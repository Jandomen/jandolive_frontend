import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../services/socket';
import { FiMonitor, FiVideo, FiChevronLeft, FiChevronRight, FiSkipForward } from 'react-icons/fi';

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
  const peersRef = useRef({});
  const initiatedRef = useRef(new Set());

  const [localReady, setLocalReady] = useState(false);
  const roomIdRef = useRef(roomId);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

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
    const initLocalMedia = async () => {
      try {
        if (!localStreamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
          setLocalReady(true);
        }
      } catch (err) {
        console.error("❌ Error inicializando cámara local:", err);
      }
    };
    initLocalMedia();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
    };
  }, []);

  const createPeer = async (socketId, senderOffer = false) => {
    const currentRoom = roomIdRef.current;
    if (!currentRoom) return null;
    if (peersRef.current[socketId]) return peersRef.current[socketId];

    const peer = new RTCPeerConnection(configuration);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current);
      });
    }

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice-candidate', { roomId: currentRoom, candidate: e.candidate, to: socketId });
      }
    };

    peer.ontrack = (e) => {
      console.log("🎬 Track remoto recibido de:", socketId);
      setRemoteStreams((prev) => ({ ...prev, [socketId]: e.streams[0] }));
    };

    peersRef.current[socketId] = peer;

    if (senderOffer) {
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('offer', { roomId: currentRoom, offer: peer.localDescription, to: socketId });
      } catch (err) {
        console.error("Error creando oferta:", err);
      }
    }

    return peer;
  };

  useEffect(() => {
    const onUserJoined = ({ socketId }) => {
      console.log("🚀 Nuevo participante detectado:", socketId);
      createPeer(socketId, false);
    };

    const onOffer = async ({ offer, from }) => {
      console.log("📥 Oferta recibida de:", from);
      const currentRoom = roomIdRef.current;
      if (!currentRoom) return;

      const peer = await createPeer(from, false);
      if (!peer) return;

      try {
        if (peer.signalingState !== "stable") {
          await peer.setLocalDescription({ type: "rollback" });
        }
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('answer', { roomId: currentRoom, answer, to: from });
      } catch (e) {
        console.error("Error al contestar oferta:", e);
      }
    };

    const onAnswer = async ({ answer, from }) => {
      const peer = peersRef.current[from];
      if (peer) {
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (e) {
          console.error("Error al aceptar respuesta:", e);
        }
      }
    };

    const onIceCandidate = async ({ candidate, from }) => {
      const peer = peersRef.current[from];
      if (peer && candidate) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) { }
      }
    };

    const onPeerLeft = ({ socketId }) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
        initiatedRef.current.delete(socketId);
        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[socketId];
          return next;
        });
      }
    };

    socket.on('user-joined', onUserJoined);
    socket.on('offer', onOffer);
    socket.on('answer', onAnswer);
    socket.on('ice-candidate', onIceCandidate);
    socket.on('peer-left', onPeerLeft);

    return () => {
      socket.off('user-joined', onUserJoined);
      socket.off('offer', onOffer);
      socket.off('answer', onAnswer);
      socket.off('ice-candidate', onIceCandidate);
      socket.off('peer-left', onPeerLeft);
    };
  }, []);

  useEffect(() => {
    if (!roomId) {
      Object.keys(peersRef.current).forEach(sid => {
        peersRef.current[sid].close();
        delete peersRef.current[sid];
      });
      setRemoteStreams({});
      initiatedRef.current.clear();
      return;
    }

    if (others && others.length > 0 && localReady) {
      // Timeout para evitar condiciones de carrera en el montaje del otro lado
      const timer = setTimeout(() => {
        others.forEach(sid => {
          if (sid !== socket.id && !initiatedRef.current.has(sid)) {
            initiatedRef.current.add(sid);
            console.log("📨 Iniciando oferta proactiva tras espera:", sid);
            createPeer(sid, true);
          }
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [roomId, others, localReady]);

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

  const handleNext = () => {
    socket.emit('ready');
  };

  const streamsArray = Object.entries(remoteStreams);
  const isPrivateRoom = roomId && !roomId.startsWith('room-');

  return (
    <div className="relative w-full h-full min-h-[460px] bg-black/80 backdrop-blur-md rounded-[40px] overflow-hidden border border-white/10 shadow-3xl">

      <div className="absolute top-6 left-6 z-[20] flex gap-3">
        <button
          onClick={toggleScreenShare}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] transition-all ${isSharingScreen ? 'bg-red-500 text-white shadow-lg ring-2 ring-red-500/50' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:translate-y-[-2px] shadow-xl backdrop-blur-md'}`}
        >
          {isSharingScreen ? <FiVideo className="text-sm" /> : <FiMonitor className="text-sm" />}
          {isSharingScreen ? 'Detener Pantalla' : 'Compartir Pantalla'}
        </button>

        {!isPrivateRoom && (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-black text-[9px] uppercase tracking-[0.2em] hover:bg-indigo-500 hover:translate-y-[-2px] transition-all shadow-xl active:scale-95 border border-white/20"
          >
            <FiSkipForward className="text-sm" /> Siguiente
          </button>
        )}
      </div>

      {isPrivateRoom && (
        <div className="absolute top-6 right-6 z-[20] bg-indigo-600/20 border border-indigo-500/30 px-4 py-2 rounded-xl backdrop-blur-md">
          <span className="text-indigo-300 font-black text-[10px] uppercase tracking-[0.2em]">Sala Privada: {roomId}</span>
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        {streamsArray.length === 0 ? (
          <div className="flex flex-col items-center gap-5">
            <div className="w-20 h-20 border-[6px] border-white/10 border-t-indigo-500 rounded-full animate-spin shadow-2xl relative">
              <div className="absolute inset-0 rounded-full shadow-[0_0_20px_#6366f1] animate-pulse"></div>
            </div>
            <p className="text-white font-black tracking-[0.4em] animate-pulse text-[11px] uppercase opacity-60">
              {isPrivateRoom ? `Esperando amigos en la sala ${roomId}...` : "Buscando alguien nuevo..."}
            </p>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center p-6 sm:p-8">
            <div className="hidden lg:grid lg:grid-cols-2 gap-5 w-full h-full text-white">
              {streamsArray.map(([id, stream]) => (
                <div key={id} className="relative aspect-video bg-[#121216] rounded-[32px] overflow-hidden border border-white/10 group shadow-3xl">
                  <video autoPlay playsInline muted={false} ref={(el) => el && !el.srcObject && (el.srcObject = stream)} className="w-full h-full object-cover" />
                  <div className="absolute bottom-5 left-5 px-4 py-1.5 bg-black/70 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2 shadow-2xl">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">En Línea</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex lg:hidden flex-col items-center justify-center w-full h-full relative group">
              {streamsArray[currentIndex] && (
                <div className="relative w-full aspect-video bg-[#121216] rounded-[32px] overflow-hidden border border-white/10 shadow-3xl">
                  <video key={streamsArray[currentIndex][0]} autoPlay playsInline muted={false} ref={(el) => el && !el.srcObject && (el.srcObject = streamsArray[currentIndex][1])} className="w-full h-full object-cover" />
                  <div className="absolute bottom-5 left-5 px-4 py-1.5 bg-black/70 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2 shadow-2xl">
                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80]"></div>
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">{currentIndex + 1}/{streamsArray.length}</span>
                  </div>
                </div>
              )}

              {streamsArray.length > 1 && (
                <div className="absolute inset-x-4 flex items-center justify-between pointer-events-none z-50">
                  <button onClick={prevPerson} className="p-3 bg-black/50 backdrop-blur-md rounded-full text-white pointer-events-auto hover:bg-black/70 transition"><FiChevronLeft size={24} /></button>
                  <button onClick={nextPerson} className="p-3 bg-black/50 backdrop-blur-md rounded-full text-white pointer-events-auto hover:bg-black/70 transition"><FiChevronRight size={24} /></button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={`absolute bottom-6 left-6 sm:left-auto sm:right-6 ${isSharingScreen ? 'w-full max-w-[260px]' : 'w-36 h-28 sm:w-56 sm:h-40'} bg-black/60 backdrop-blur-3xl border border-white/30 rounded-[28px] overflow-hidden shadow-3xl transition-all duration-700 z-[30]`}>
        <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" />
        <div className="absolute top-3 left-3 px-3 py-1 bg-indigo-600 rounded-xl border border-white/20 text-white text-[8px] font-black uppercase tracking-widest shadow-xl">
          {isSharingScreen ? 'Tu Pantalla' : 'Tú'}
        </div>
      </div>
    </div>
  );
}
