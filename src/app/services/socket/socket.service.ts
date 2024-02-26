// socket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Presense } from '../../../types/app.types';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  socket: Socket | undefined;
  presense: Presense[] = [];
  constructor() {}

  connect() {
    if (!this.socket?.connected) {
      this.socket = io('http://localhost:4000');
    }
  }

  // Emit an event to the server
  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  // Listen for events from the server
  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }
}
