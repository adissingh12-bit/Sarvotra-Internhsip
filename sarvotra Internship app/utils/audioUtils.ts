// We define the interface locally to avoid runtime import errors from the SDK
export interface GenAIPartBlob {
  data: string;
  mimeType: string;
}

export function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function arrayBufferToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // CRITICAL FIX: Ensure we are reading the buffer correctly aligned
  // We create a copy of the buffer slice to ensure it's aligned and standalone
  const alignedBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  const dataInt16 = new Int16Array(alignedBuffer);
  
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function downsampleTo16k(inputData: Float32Array, inputSampleRate: number): Int16Array {
  if (inputSampleRate === 16000) {
    const l = inputData.length;
    const result = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      result[i] = Math.max(-1, Math.min(1, inputData[i])) * 32768;
    }
    return result;
  }

  const ratio = inputSampleRate / 16000;
  const newLength = Math.ceil(inputData.length / ratio);
  const result = new Int16Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const offset = Math.floor(i * ratio);
    // Use the nearest sample
    const val = inputData[Math.min(offset, inputData.length - 1)];
    result[i] = Math.max(-1, Math.min(1, val)) * 32768;
  }
  
  return result;
}

export function createPcmBlob(data: Float32Array, sampleRate: number): GenAIPartBlob {
  const int16Data = downsampleTo16k(data, sampleRate);
  return {
    data: arrayBufferToBase64(new Uint8Array(int16Data.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
