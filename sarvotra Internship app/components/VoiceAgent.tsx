import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { ConnectionState } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';
import { createPcmBlob, decodeAudioData, base64ToBytes } from '../utils/audioUtils';

interface VoiceAgentProps {
  onPaymentRequest: (contactName: string, amount: number) => Promise<{ success: boolean; message: string }>;
  connectionState: ConnectionState;
  setConnectionState: (state: ConnectionState) => void;
  isOpen: boolean;
  onClose: () => void;
}

const VoiceAgent: React.FC<VoiceAgentProps> = ({ 
  onPaymentRequest, 
  connectionState, 
  setConnectionState,
  isOpen,
  onClose
}) => {
  const [volume, setVolume] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  // We track the active session promise to close it on cleanup
  const activeSessionPromiseRef = useRef<Promise<any> | null>(null);

  // Define the tool
  const paymentTool: FunctionDeclaration = {
    name: 'makePayment',
    parameters: {
      type: Type.OBJECT,
      description: 'Initiate a payment to a contact.',
      properties: {
        contactName: {
          type: Type.STRING,
          description: 'The name of the person to pay (e.g., "Alice", "Bob").',
        },
        amount: {
          type: Type.NUMBER,
          description: 'The amount of money to send.',
        },
      },
      required: ['contactName', 'amount'],
    },
  };

  useEffect(() => {
    let animationFrame: number;
    let isActive = true;

    const startSession = async () => {
      try {
        if (!process.env.API_KEY) {
          console.error("API_KEY is missing from environment variables.");
          setConnectionState(ConnectionState.ERROR);
          return;
        }

        setConnectionState(ConnectionState.CONNECTING);

        // 1. Setup Audio Input
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            channelCount: 1,
            echoCancellation: true,
            autoGainControl: true,
            noiseSuppression: true
          } 
        });
        
        if (!isActive) {
            stream.getTracks().forEach(t => t.stop());
            return;
        }

        streamRef.current = stream;
        
        // Initialize Input Context
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        if (inputCtx.state === 'suspended') {
          await inputCtx.resume();
        }
        inputAudioContextRef.current = inputCtx;
        
        const source = inputCtx.createMediaStreamSource(stream);
        const analyzer = inputCtx.createAnalyser();
        analyzer.fftSize = 64;
        source.connect(analyzer);
        
        // Volume Visualization Logic
        const updateVolume = () => {
          if (!isActive || !streamRef.current) return;
          const dataArray = new Uint8Array(analyzer.frequencyBinCount);
          analyzer.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVolume(avg);
          animationFrame = requestAnimationFrame(updateVolume);
        };
        updateVolume();

        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
        
        // 2. Setup Audio Output
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        if (outputCtx.state === 'suspended') {
          await outputCtx.resume();
        }
        audioContextRef.current = outputCtx;
        const outputNode = outputCtx.createGain();
        outputNode.connect(outputCtx.destination);

        // 3. Initialize Gemini Client
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // 4. Connect Session
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: [paymentTool] }],
          },
          callbacks: {
            onopen: () => {
              if (!isActive) return;
              console.log('Gemini Live Connected - Listening for Wake Word');
              setConnectionState(ConnectionState.CONNECTED);
              
              scriptProcessor.onaudioprocess = (e) => {
                if (!isActive) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createPcmBlob(inputData);
                sessionPromise.then(session => {
                   if (!isActive) return;
                   session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputCtx.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (!isActive) return;

              const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (base64Audio) {
                  // Use outputCtx from local closure to ensure consistency
                  // This prevents "cannot connect to an AudioNode belonging to a different audio context"
                  const ctx = outputCtx;
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                  
                  try {
                    const audioBuffer = await decodeAudioData(
                      base64ToBytes(base64Audio),
                      ctx,
                      24000,
                      1
                    );
                    
                    const bufferSource = ctx.createBufferSource();
                    bufferSource.buffer = audioBuffer;
                    bufferSource.connect(outputNode);
                    
                    bufferSource.addEventListener('ended', () => {
                      if (sourcesRef.current) sourcesRef.current.delete(bufferSource);
                    });

                    bufferSource.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    sourcesRef.current.add(bufferSource);
                  } catch (err) {
                    console.error("Error processing audio chunk", err);
                  }
              }

              if (message.toolCall) {
                if (!isActive) return;
                setIsProcessing(true);
                console.log('Tool call received:', message.toolCall);
                for (const fc of message.toolCall.functionCalls) {
                  if (fc.name === 'makePayment') {
                    const { contactName, amount } = fc.args as any;
                    const result = await onPaymentRequest(contactName, amount);
                    
                    sessionPromise.then(session => {
                      if (!isActive) return;
                      session.sendToolResponse({
                        functionResponses: {
                          id: fc.id,
                          name: fc.name,
                          response: { result: result.message }
                        }
                      });
                    });
                  }
                }
                setIsProcessing(false);
              }
              
              if (message.serverContent?.interrupted) {
                 sourcesRef.current.forEach(s => s.stop());
                 sourcesRef.current.clear();
                 nextStartTimeRef.current = 0;
              }
            },
            onclose: () => {
              console.log('Session closed');
              if (isActive) {
                setConnectionState(ConnectionState.DISCONNECTED);
              }
            },
            onerror: (err) => {
              console.error('Gemini Live Error', err);
              if (isActive) {
                setConnectionState(ConnectionState.ERROR);
              }
            }
          }
        });
        
        activeSessionPromiseRef.current = sessionPromise;

      } catch (e) {
        console.error("Failed to start session:", e);
        if (isActive) {
          setConnectionState(ConnectionState.ERROR);
        }
      }
    };

    const cleanup = () => {
      isActive = false;
      cancelAnimationFrame(animationFrame);

      // Close Gemini Session
      if (activeSessionPromiseRef.current) {
          activeSessionPromiseRef.current.then(session => {
              try { session.close(); } catch(e) {}
          }).catch(e => {});
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      sourcesRef.current.forEach(s => {
          try { s.stop(); } catch (e) {}
      });
      sourcesRef.current.clear();
      setVolume(0);
    };

    if (isOpen) {
      startSession();
    } else {
      cleanup();
    }

    return () => cleanup();
  }, [isOpen, onPaymentRequest, setConnectionState]);

  if (!isOpen) return null;

  const handleRetry = () => {
      onClose();
      // Small timeout to allow state to reset before user opens again
      setTimeout(() => {
          // Parent app would need to handle re-opening, but here we just close
          // The user can click the toggle again.
      }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-md text-white transition-opacity duration-300">
      <div className="absolute top-6 right-6">
        <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col items-center space-y-8 animate-pulse">
        {/* Visualizer Orb */}
        <div className="relative flex items-center justify-center">
          {/* Outer glow varies by volume */}
          <div 
            className={`w-40 h-40 rounded-full blur-xl transition-all duration-100 ${
                connectionState === ConnectionState.ERROR ? 'bg-red-500' :
                isProcessing ? 'bg-green-500' : 'bg-indigo-500'
            }`}
            style={{ 
              transform: connectionState === ConnectionState.CONNECTED ? `scale(${1 + volume / 60})` : 'scale(1)',
              opacity: 0.6 + (volume / 100)
            }}
          />
          
          {/* Core Orb */}
          <div className="absolute w-32 h-32 rounded-full bg-gray-900 flex items-center justify-center border border-white/10 shadow-2xl z-10">
            {connectionState === ConnectionState.CONNECTING ? (
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            ) : connectionState === ConnectionState.ERROR ? (
               <div className="text-red-500">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                   </svg>
               </div>
            ) : (
              <div 
                 className={`w-6 h-6 rounded-full transition-all duration-300 ${isProcessing ? 'bg-green-400 animate-bounce' : 'bg-indigo-400'}`} 
                 style={{ 
                   transform: `scale(${1 + volume / 40})`,
                   boxShadow: `0 0 ${volume}px ${isProcessing ? '#4ade80' : '#818cf8'}`
                 }}
              />
            )}
          </div>
        </div>

        <div className="text-center space-y-4 max-w-xs px-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
                {connectionState === ConnectionState.ERROR ? 'Connection Failed' : 'Hands-Free Mode'}
            </h2>
            <p className={`font-medium ${connectionState === ConnectionState.ERROR ? 'text-red-400' : 'text-indigo-300'}`}>
                {connectionState === ConnectionState.CONNECTING ? 'Connecting...' : 
                 connectionState === ConnectionState.ERROR ? 'Service Unavailable' : 
                 'Always On'}
            </p>
          </div>
          
          {connectionState === ConnectionState.CONNECTED && (
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-gray-400">
                <p className="mb-2">Say <span className="text-white font-bold">"Sarvotra"</span> to wake me up.</p>
                <p>Then try: "Pay Alice 50 dollars"</p>
            </div>
          )}

          {connectionState === ConnectionState.ERROR && (
              <button 
                onClick={handleRetry}
                className="bg-white text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition"
              >
                  Close & Retry
              </button>
          )}

          {isProcessing && (
            <div className="inline-flex items-center space-x-2 text-green-400 bg-green-400/10 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
              <span>Processing Payment...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceAgent;