import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../services/socket';
import { FiMonitor, FiVideo, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

export default function VideoChat({ roomId, others = [] }) {
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const peersRef = useRef({}); // { socketId: RTCPeerConnection }

  const nextPerson = () => {
    const total = Object.keys(remoteStreams).length;
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const prevPerson = () => {
    const total = Object.keys(remoteStreams).length;
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  useEffect(() => {
    if (!roomId) return;

    const createPeer = async (socketId, stream, senderOffer = false) => {
      if (peersRef.current[socketId]) return peersRef.current[socketId];

      const peer = new RTCPeerConnection(configuration);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      peer.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('ice-candidate', { roomId, candidate: e.candidate, to: socketId });
        }
      };

      peer.ontrack = (e) => {
        setRemoteStreams((prev) => ({ ...prev, [socketId]: e.streams[0] }));
      };

      if (senderOffer) {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('offer', { roomId, offer: peer.localDescription, to: socketId });
      }

      peersRef.current[socketId] = peer;
      return peer;
    };

    const initMedia = async () => {
      try {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(t => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // Limpiar eventos antes de registrar nuevos de señalización
        socket.off('offer');
        socket.off('answer');
        socket.off('ice-candidate');
        socket.off('peer-left');
        socket.off('user-joined');

        // 🔥 AHORA SÍ: Iniciamos la conexión con los que Dashboard nos avisó que ya estaban
        others.forEach(sid => {
          if (sid !== socket.id) {
            console.log("📨 Lanzando oferta inicial a participante existente:", sid);
            createPeer(sid, stream, true);
          }
        });

        // 🔥 EVENTO: Alguien nuevo entra DESPUÉS de nosotros
        socket.on('user-joined', ({ socketId }) => {
          console.log("🚀 Alguien se unió, lanzando oferta a:", socketId);
          createPeer(socketId, stream, true);
        });

        socket.on('offer', async ({ offer, from }) => {
          console.log("📥 Recibida oferta de:", from);
          const peer = await createPeer(from, stream, false);
          await peer.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit('answer', { roomId, answer, to: from });
        });

        socket.on('answer', async ({ answer, from }) => {
          const peer = peersRef.current[from];
          if (peer) await peer.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('ice-candidate', async ({ candidate, from }) => {
          const peer = peersRef.current[from];
          if (peer && candidate) await peer.addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on('peer-left', ({ socketId }) => {
          if (peersRef.current[socketId]) {
            peersRef.current[socketId].close();
            delete peersRef.current[socketId];
            setRemoteStreams((prev) => {
              const next = { ...prev };
              delete next[socketId];
              return next;
            });
          }
        });

      } catch (err) {
        console.error("❌ Error de medios:", err);
      }
    };

    initMedia();

    return () => {
      const currentPeers = peersRef.current;
      const currentStream = localStreamRef.current;
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('peer-left');
      socket.off('user-joined');
      Object.values(currentPeers).forEach(p => p.close());
      if (currentStream) currentStream.getTracks().forEach(t => t.stop());
      peersRef.current = {};
      setRemoteStreams({});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, others]);

  const toggleScreenShare = async () => {
    try {
      if (!isSharingScreen) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        Object.values(peersRef.current).forEach(peer => {
          const sender = peer.getSenders().find(s => s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        screenTrack.onended = () => stopScreenShare();
        setIsSharingScreen(true);
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error("Error al compartir escritorio:", err);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(track => track.stop());
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    Object.values(peersRef.current).forEach(peer => {
      const sender = peer.getSenders().find(s => s.track.kind === 'video');
      if (sender) sender.replaceTrack(videoTrack);
    });
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    setIsSharingScreen(false);
  };

  const streamsArray = Object.entries(remoteStreams);

  return (
    <div className="relative w-full h-full min-h-[460px] bg-black/80 backdrop-blur-md rounded-[40px] overflow-hidden border border-white/10 shadow-3xl animate-in fade-in zoom-in duration-500">

      {/* Controles Flotantes Premium */}
      <div className="absolute top-6 left-6 z-[20] flex gap-3">
        <button
          onClick={toggleScreenShare}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] transition-all ${isSharingScreen ? 'bg-red-500 text-white shadow-lg ring-2 ring-red-500/50' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:translate-y-[-2px] shadow-xl backdrop-blur-md'}`}
        >
          {isSharingScreen ? <FiVideo className="text-sm" /> : <FiMonitor className="text-sm" />}
          {isSharingScreen ? 'Detener Pantalla' : 'Compartir Pantalla'}
        </button>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        {streamsArray.length === 0 ? (
          <div className="flex flex-col items-center gap-5">
            <div className="w-20 h-20 border-[6px] border-white/10 border-t-indigo-500 rounded-full animate-spin shadow-2xl relative">
              <div className="absolute inset-0 rounded-full shadow-[0_0_20px_#6366f1] animate-pulse"></div>
            </div>
            <p className="text-white font-black tracking-[0.4em] animate-pulse text-[11px] uppercase opacity-60">Esperando amigos...</p>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center p-6 sm:p-8">
            {/* Grid Layout for Desktop */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-5 w-full h-full">
              {streamsArray.map(([id, stream]) => (
                <video key={id} autoPlay playsInline ref={(el) => el && !el.srcObject && (el.srcObject = stream)} className="w-full h-full object-cover bg-[#121216] rounded-[32px] border border-white/10 shadow-3xl" />
              ))}
            </div>

            {/* Carousel Layout for Mobile */}
            <div className="flex lg:hidden flex-col items-center justify-center w-full h-full relative">
              {streamsArray[currentIndex] && (
                <div className="relative w-full aspect-video bg-[#121216] rounded-[32px] overflow-hidden border border-white/10 shadow-3xl">
                  <video key={streamsArray[currentIndex][0]} autoPlay playsInline ref={(el) => el && !el.srcObject && (el.srcObject = streamsArray[currentIndex][1])} className="w-full h-full object-cover" />
                  <div className="absolute bottom-5 left-5 px-4 py-1.5 bg-black/70 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80]"></div>
                    <span className="text-white text-[10px] font-black uppercase">Participante {currentIndex + 1}/{streamsArray.length}</span>
                  </div>
                </div>
              )}

              {streamsArray.length > 1 && (
                <div className="absolute inset-x-4 flex items-center justify-between pointer-events-none">
                  <button onClick={prevPerson} className="p-3 bg-black/50 backdrop-blur-md rounded-full text-white pointer-events-auto shadow-xl"><FiChevronLeft size={24} /></button>
                  <button onClick={nextPerson} className="p-3 bg-black/50 backdrop-blur-md rounded-full text-white pointer-events-auto shadow-xl"><FiChevronRight size={24} /></button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={`absolute bottom-6 left-6 sm:left-auto sm:right-6 ${isSharingScreen ? 'w-full max-w-[260px]' : 'w-36 h-28 sm:w-56 sm:h-40'} bg-black/60 backdrop-blur-3xl border border-white/30 rounded-[28px] overflow-hidden shadow-3xl transition-all duration-700 hover:rotate-1 group ring-2 ring-white/10 z-[30]`}>
        <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" />
        <div className="absolute top-3 left-3 px-3 py-1 bg-indigo-600 rounded-xl border border-white/20 text-white text-[8px] font-black uppercase tracking-widest shadow-xl">
          {isSharingScreen ? 'Tu Pantalla' : 'Tú'}
        </div>
      </div>
    </div>
  );
}
