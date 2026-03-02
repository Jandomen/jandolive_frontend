import React, { useEffect, useState } from 'react';
import { connectSocket, socket } from '../services/socket';
import ChatBox from './ChatBox';
import Loader from './Loader';
import VideoChat from './VideoChat';
import { FiCircle, FiUsers, FiKey, FiCopy } from 'react-icons/fi';
import Modal from './Modal';

export default function Dashboard() {
  const [status, setStatus] = useState('idle');
  const [roomId, setRoomId] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [createdCode, setCreatedCode] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', type: 'info' });

  const showAlert = (title, message, type = 'info') => {
    setModalConfig({ title, message, type });
    setIsModalOpen(true);
  };

  useEffect(() => {
    connectSocket();

    socket.on('connect', () => console.log('✅ Socket connected:', socket.id));
    socket.on('matched', ({ roomId: rid }) => {
      setRoomId(rid);
      setStatus('matched');
    });
    socket.on('waiting', () => setStatus('searching'));
    socket.on('joined-room', ({ roomId: rid }) => {
      setRoomId(rid);
      setStatus('matched');
    });
    socket.on('private-room-created', ({ roomId: rid }) => {
      setCreatedCode(rid);
      setRoomId(rid);
      setStatus('waiting-private');
    });
    socket.on('user-joined', () => {
      setStatus('matched');
    });
    socket.on('error', (msg) => {
      console.warn('⚠️ Server error:', msg);
      showAlert('Error del Servidor', msg, 'error');
      setStatus('idle');
    });
    socket.on('peer-left', () => {
      setStatus('idle');
      setRoomId(null);
      setCreatedCode(null);
    });

    return () => {
      socket.off('connect');
      socket.off('matched');
      socket.off('waiting');
      socket.off('joined-room');
      socket.off('private-room-created');
      socket.off('user-joined');
      socket.off('error');
      socket.off('peer-left');
    };
  }, []);

  const startRandomSearch = () => {
    setStatus('searching');
    socket.emit('ready');
  };

  const createPrivateRoom = () => {
    socket.emit('create-private-room');
  };

  const joinByCode = () => {
    if (!joinCode.trim()) {
      return showAlert('Campo Requerido', 'Por favor, ingresa un código válido para unirte.', 'error');
    }
    setStatus('joining');
    socket.emit('join-room', { roomId: joinCode.trim().toUpperCase() });
  };

  const leave = () => {
    // Informamos al servidor para que nos quite de la lista de espera o de la sala
    socket.emit('leave', { roomId });

    setStatus('idle');
    setRoomId(null);
    setCreatedCode(null);
    setJoinCode('');
  };

  const copyCode = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      showAlert('¡Copiado!', 'El código de la sala se ha copiado al portapapeles. 📋', 'info');
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-500 overflow-hidden font-['Outfit']">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

      {/* Header Glassmorphism */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/10 border-b border-white/20 px-8 py-4 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-4 h-4 bg-red-500 rounded-full animate-pulse-live"></div>
            <FiCircle className="text-white text-xl relative z-10" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter italic">
            JANDOLIVE
          </h1>

        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Global Network</span>
          <div className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]"></div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 w-full">
        {status === 'idle' && (
          <div className="text-center max-w-2xl space-y-8 bg-white/10 backdrop-blur-xl p-10 rounded-3xl border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500">
            <div className="space-y-2">
              <h2 className="text-4xl font-extrabold text-white">
                ¡Conecta ahora! 🌎
              </h2>
              <p className="text-blue-100 text-lg opacity-80 leading-relaxed">
                Elige un modo y comienza a charlar con personas de todo el mundo al instante.
              </p>
            </div>

            {/* Opciones */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-6">
              <button
                onClick={startRandomSearch}
                className="group relative flex items-center gap-3 px-8 py-4 bg-white text-indigo-600 text-lg font-bold rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-indigo-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <FiUsers className="relative z-10 text-xl" />
                <span className="relative z-10">Búsqueda Aleatoria</span>
              </button>

              <button
                onClick={createPrivateRoom}
                className="group relative flex items-center gap-3 px-8 py-4 bg-white/10 text-white text-lg font-bold rounded-2xl shadow-xl border border-white/30 hover:bg-white/20 hover:scale-105 transition-all duration-300"
              >
                <FiKey className="text-xl" /> Crear Sala Privada
              </button>
            </div>

            {/* Unirse por código */}
            <div className="flex flex-col items-center gap-4 pt-4 border-t border-white/10">
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <input
                  type="text"
                  placeholder="Código de Invitación"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:outline-none text-center uppercase font-bold tracking-widest"
                />
                <button
                  onClick={joinByCode}
                  className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl shadow-lg hover:bg-blue-400 transition-colors"
                >
                  Entrar
                </button>
              </div>
            </div>
          </div>
        )}

        {status === 'searching' && (
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
            <Loader text="Buscando una persona increíble..." />
            <button
              onClick={leave}
              className="px-6 py-2 bg-white/10 text-white/80 border border-white/20 rounded-full hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all font-bold text-sm tracking-widest uppercase"
            >
              Cancelar Búsqueda
            </button>
          </div>
        )}
        {status === 'joining' && <Loader text="Uniéndose a la sala..." />}
        {status === 'waiting-private' && (
          <div className="text-center space-y-8 bg-white/10 backdrop-blur-xl p-10 rounded-3xl border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500 max-w-md w-full">
            <div className="space-y-2">
              <h3 className="text-3xl font-extrabold text-white">
                Sala Privada 🎉
              </h3>
              <p className="text-blue-100 opacity-80">
                Comparte el código con tus amigos:
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-center items-center gap-3">
                <span className="bg-white/10 border border-white/30 text-2xl font-black text-white px-8 py-3 rounded-2xl shadow-inner tracking-widest">
                  {createdCode}
                </span>
                <button
                  onClick={copyCode}
                  className="p-4 bg-white text-indigo-600 rounded-2xl hover:bg-indigo-50 shadow-lg transition-transform hover:scale-110 active:scale-95"
                  title="Copiar Código"
                >
                  <FiCopy className="text-xl" />
                </button>
              </div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Esperando compañero...</p>
            </div>

            <div className="pt-4 space-y-6">
              <Loader text="Generando conexión..." />
              <button
                onClick={leave}
                className="px-8 py-3 bg-red-500/20 text-red-100 border border-red-500/40 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold text-sm tracking-widest uppercase w-full shadow-lg"
              >
                Cancelar y Salir
              </button>
            </div>
          </div>
        )}


        {status === 'matched' && (
          <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 mt-2 lg:mt-6 px-2 sm:px-4 h-full">
            {/* Contenedor de Video: Altura ajustable según pantalla */}
            <div className="flex-1 min-h-[350px] lg:h-[600px] relative">
              <VideoChat roomId={roomId} />
            </div>

            {/* Contenedor de Chat: Ancho fijo en PC, completo en móvil */}
            <div className="w-full lg:w-[400px] min-h-[400px] lg:h-[600px] relative">
              <ChatBox roomId={roomId} onLeave={leave} />
            </div>
          </div>
        )}

      </main>

      {/* Modern Modal replacement for alerts */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />

      <footer className="relative z-10 py-4 text-center text-gray-500 text-sm bg-white shadow-inner">
        &copy; 2025 Jandolive. Todos los derechos reservados.
      </footer>
    </div>
  );
}

