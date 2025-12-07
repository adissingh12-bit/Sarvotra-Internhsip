export interface Contact {
  id: string;
  name: string;
  avatar: string;
  username: string;
}

export interface Transaction {
  id: string;
  recipientId: string;
  recipientName: string;
  amount: number;
  date: Date;
  type: 'outgoing' | 'incoming';
  status: 'completed' | 'failed' | 'pending';
}

export interface UserState {
  balance: number;
  transactions: Transaction[];
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

// Audio Types for Live API
export interface PCMFloat32Data {
  data: Float32Array;
}

export type Tab = 'pay' | 'balance' | 'history';
