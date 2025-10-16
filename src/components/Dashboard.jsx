import React, { useEffect, useState } from 'react';
import { connectSocket, socket } from '../services/socket';
import ChatBox from './ChatBox';
import Loader from './Loader';
import VideoChat from './VideoChat';
import { FiCircle } from 'react-icons/fi';

export default function Dashboard() {
  const [status, setStatus] = useState('idle');
  const [roomId, setRoomId] = useState(null);

  useEffect(() => {
    connectSocket();

    socket.on('connect', () => console.log('Socket connected', socket.id));
    socket.on('matched', ({ roomId: rid }) => {
      setRoomId(rid);
      setStatus('matched');
    });
    socket.on('waiting', () => setStatus('searching'));
    socket.on('peer-left', () => { setStatus('idle'); setRoomId(null); });

    return () => {
      socket.off('connect');
      socket.off('matched');
      socket.off('waiting');
      socket.off('peer-left');
    };
  }, []);

  const startSearch = () => { setStatus('searching'); socket.emit('ready'); };
  const leave = () => { if (roomId) socket.emit('leave', { roomId }); setStatus('idle'); setRoomId(null); };

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-red-100 overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10 pointer-events-none"></div>

      <header className="relative z-10 w-full py-6 bg-red-700 flex justify-center items-center gap-3 shadow-lg font-sans">
        <FiCircle className="text-white animate-pulse text-2xl" />
        <h1 className="text-3xl font-bold text-white tracking-wide">Jandolive Live</h1>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 w-full">
        {status === 'idle' && (
          <div className="text-center max-w-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Listo para conectar!</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Haz clic para encontrar a alguien nuevo y comenzar a chatear.
            </p>
            <button
              onClick={startSearch}
              className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-blue-700 hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Buscar persona
            </button>
          </div>
        )}

        {status === 'searching' && <Loader text="Buscando una persona..." />}

        {status === 'matched' && (
          <div className="w-full max-w-6xl flex flex-col md:flex-row gap-6 mt-6">
            <div className="flex-1 relative">
              <VideoChat roomId={roomId} />
            </div>
            <div className="w-full md:w-96 relative">
              <ChatBox roomId={roomId} onLeave={leave} />
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 py-4 text-center text-gray-500 text-sm bg-white shadow-inner">
        &copy; 2025 Jandolive. Todos los derechos reservados.
      </footer>
    </div>
  );
}
