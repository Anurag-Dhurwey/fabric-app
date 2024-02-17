// socket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  socket: Socket | undefined;

  constructor() {}

  connect() {
    this.socket = io('http://localhost:4000'); // Change the URL to your Socket.IO server
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
