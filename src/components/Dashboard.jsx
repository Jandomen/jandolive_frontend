import React, { useEffect, useState } from 'react';
import { connectSocket, socket } from '../services/socket';
import ChatBox from './ChatBox';
import Loader from './Loader';
import VideoChat from './VideoChat';
import { FiCircle, FiUsers, FiKey, FiCopy } from 'react-icons/fi';
import Modal from './Modal';
import Footer from './Footer';

export default function Dashboard() {
  const [status, setStatus] = useState('idle'); // idle, searching, joining, matched, waiting-private
  const [roomId, setRoomId] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [createdCode, setCreatedCode] = useState(null);
  const [others, setOthers] = useState([]); // Lista inicial de participantes para VideoChat

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', type: 'info' });

  useEffect(() => {
    connectSocket();

    socket.on('connect', () => console.log('✅ Socket connected:', socket.id));

    socket.on('waiting', () => setStatus('searching'));

    socket.on('matched', ({ roomId: rid }) => {
      console.log('🎯 matched in room:', rid);
      setRoomId(rid);
      setOthers([]); // En random usualmente empezamos de 0 o el otro ya está
      setStatus('matched');
    });

    socket.on('joined-room', ({ roomId: rid, others: o }) => {
      setRoomId(rid);
      setOthers(o || []);
      setStatus('matched');
    });

    socket.on('private-room-created', ({ roomId: rid }) => {
      setCreatedCode(rid);
      setStatus('waiting-private');
    });

    socket.on('user-joined', ({ socketId }) => {
      console.log('👤 Alguien se unió:', socketId);
      setStatus('matched');
    });


    socket.on('error', (msg) => {
      console.warn('⚠️ Server error:', msg);
      showAlert('Error del Servidor', msg, 'error');
      setStatus('idle');
    });

    socket.on('call-ended', () => {
      leave();
      showAlert('Llamada Finalizada', 'La otra persona se ha ido.', 'info');
    });

    return () => {
      socket.off('connect');
      socket.off('waiting');
      socket.off('matched');
      socket.off('joined-room');
      socket.off('private-room-created');
      socket.off('user-joined');
      socket.off('error');
      socket.off('call-ended');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const showAlert = (title, message, type = 'info') => {
    setModalConfig({ title, message, type });
    setIsModalOpen(true);
  };

  const startSearching = () => {
    setStatus('searching');
    socket.emit('ready');
  };

  const [maxParticipants, setMaxParticipants] = useState(10);

  const createPrivateRoom = () => {
    socket.emit('create-private-room', { maxParticipants });
  };

  const joinByCode = () => {
    if (!joinCode.trim()) {
      return showAlert('Código requerido', 'Por favor, ingresa el código de la sala.', 'error');
    }
    setStatus('joining');
    socket.emit('join-room', { roomId: joinCode.toUpperCase() });
  };

  const leave = () => {
    if (status === 'matched' || roomId || createdCode) {
      socket.emit('leave', { roomId: roomId || createdCode });
    }
    // 🧹 Limpieza TOTAL de estados para evitar re-carga de página
    setStatus('idle');
    setRoomId(null);
    setCreatedCode(null);
    setJoinCode('');
  };

  const copyCode = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      showAlert('¡Copiado!', `El código ${createdCode} está en tu portapapeles. ✨`, 'info');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] selection:bg-indigo-500/30 font-['Outfit'] overflow-x-hidden flex flex-col">
      {/* Header Premium */}
      <header className="fixed top-0 w-full z-50 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-red-600 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]"></div>
          <h1 className="text-2xl font-black text-white tracking-widest text-shadow-glow">JANDOLIVE</h1>
        </div>

      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 pt-32 pb-12 w-full max-w-screen-2xl mx-auto overflow-y-auto">

        {/* State: IDLE (Menú Principal) */}
        {status === 'idle' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-12 duration-700">
            {/* Opción 1: Random */}
            <div className="group relative bg-[#121216] backdrop-blur-3xl p-10 rounded-[40px] border border-white/10 shadow-3xl hover:border-indigo-500/50 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <FiCircle size={150} />
              </div>
              <h2 className="text-3xl font-black text-white mb-4">Chat Aleatorio</h2>
              <p className="text-white/50 mb-8 font-medium">Conoce gente nueva al instante en un video 1 a 1 de forma segura.</p>
              <button
                onClick={startSearching}
                className="w-full relative z-10 bg-indigo-600 text-white font-black py-5 rounded-[24px] shadow-2xl hover:bg-indigo-500 active:scale-95 transition-all tracking-widest uppercase text-xs"
              >
                Empezar Búsqueda
              </button>
            </div>

            {/* Opción 2: Privado */}
            <div className="bg-[#121216]/50 backdrop-blur-2xl p-10 rounded-[40px] border border-white/5 space-y-8 shadow-2xl">
              <div className="flex flex-col gap-4">
                <h2 className="text-3xl font-black text-white">Sala Privada</h2>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Crea un link exclusivo para tus amigos</p>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={createPrivateRoom}
                  className="w-full bg-white/5 text-white border border-white/20 font-black py-4 rounded-[24px] hover:bg-white/10 transition-all tracking-widest uppercase text-xs flex items-center justify-center gap-3"
                >
                  <FiKey /> Crear Nueva Sala
                </button>
                <div className="flex items-center justify-center gap-3 px-4 py-2 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                  <span className="text-white/40 text-[10px] font-black tracking-widest uppercase">Límite:</span>
                  <input
                    type="number" min="2" max="20"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    className="w-12 bg-transparent text-indigo-400 font-black text-center outline-none"
                  />
                  <FiUsers className="text-indigo-400/40 text-xs" />
                </div>
              </div>
            </div>

            {/* Unirse por código */}
            <div className="md:col-span-2 bg-white/5 backdrop-blur-md p-8 rounded-[36px] border border-white/10 shadow-xl flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 space-y-2 w-full">
                <h3 className="text-white font-black tracking-widest uppercase text-[10px] opacity-40">¿Tienes un código?</h3>
                <input
                  type="text"
                  placeholder="INGRESA EL CÓDIGO AQUÍ..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-center text-lg tracking-[0.4em] placeholder:tracking-normal placeholder:font-normal placeholder:opacity-20 uppercase outline-none focus:border-indigo-500/50 transition-all"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
              </div>
              <button
                onClick={joinByCode}
                className="w-full md:w-auto px-12 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 shadow-xl transition-all active:scale-95"
              >
                ENTRAR
              </button>
            </div>
          </div>
        )}

        {/* State: Searching & Joining */}
        {(status === 'searching' || status === 'joining') && (
          <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
            <Loader text={status === 'searching' ? "Buscando alguien increíble..." : "Validando código de sala..."} />
            <button
              onClick={leave}
              className="px-8 py-3 bg-red-500/10 text-red-500 font-black rounded-full border border-red-500/20 hover:bg-red-500 hover:text-white transition-all uppercase text-xs tracking-widest shadow-xl active:scale-95"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* State: Waiting Private (Created) */}
        {status === 'waiting-private' && (
          <div className="max-w-md w-full bg-[#121216] backdrop-blur-3xl p-10 rounded-[48px] border border-white/10 shadow-3xl text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="space-y-3">
              <div className="w-20 h-20 bg-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto border border-indigo-500/30">
                <FiKey className="text-indigo-400 text-3xl" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Sala Creada con Éxito</h2>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] px-8">Comparte este código para que se unan a la charla</p>
            </div>

            <div className="space-y-4">
              <div
                onClick={copyCode}
                className="cursor-pointer group relative bg-black/40 rounded-[28px] py-6 border border-white/10 hover:border-indigo-500/50 transition-all"
              >
                <span className="text-3xl font-black text-white tracking-[0.5em] pl-[0.5em]">
                  {createdCode}
                </span>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 p-2 rounded-xl">
                  <FiCopy className="text-white text-xs" />
                </div>
              </div>
              <button
                onClick={copyCode}
                className="w-full flex items-center justify-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:text-indigo-300"
              >
                Haga clic para copiar código
              </button>
            </div>

            <button
              onClick={leave}
              className="w-full py-4 bg-white/5 text-white/40 border border-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95"
            >
              Cerrar y Salir
            </button>
          </div>
        )}

        {/* State: Matched (Video + Chat) */}
        {status === 'matched' && (
          <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 h-full min-h-0 pt-4 px-2 pb-10">
            {/* Video Container (Protagonista) */}
            <div className="flex-1 min-h-[320px] sm:min-h-[400px] lg:h-[700px] bg-black/20 rounded-[48px] relative overflow-hidden ring-1 ring-white/10 shadow-2xl">
              <VideoChat roomId={roomId} others={others} />
            </div>

            {/* Chat Container (Lateral o Inferior) */}
            <div className="flex-none w-full lg:w-[450px] h-[450px] sm:h-[500px] lg:h-[700px] relative">
              <ChatBox roomId={roomId} onLeave={leave} />
            </div>
          </div>
        )}

      </main>

      <Footer />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
}
