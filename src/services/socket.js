import { io } from 'socket.io-client';

export let socket = null;

export function connectSocket() {
  if (!socket) {
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const userId = localStorage.getItem('userId') || Math.random().toString(36).substring(2);
    localStorage.setItem('userId', userId);

    socket = io(BACKEND_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      query: { userId },
    });
  }
}