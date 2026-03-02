
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { socket } from '../services/socket';
import { FiSend, FiRefreshCw, FiMessageCircle, FiAlertCircle } from 'react-icons/fi';

export default function ChatBox({ roomId, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [connectionError, setConnectionError] = useState(null);
  const endRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    if (!socket) {
      setConnectionError('Socket no inicializado');
      console.error('Socket not initialized');
      return;
    }

    const handleMessage = (msg) => {
      const safeMsg = {
        ...msg,
        id: msg.id || `${msg.from || 'anon'}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: msg.timestamp || Date.now(),
      };

      setMessages((prev) => {
        if (prev.some((x) => x.id === safeMsg.id)) return prev;
        return [...prev, safeMsg].slice(-100);
      });
    };

    socket.on('chat-message', handleMessage);

    return () => {
      socket.off('chat-message', handleMessage);
    };
  }, [roomId]);


  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(() => {
    if (!text.trim()) return;
    if (!socket.connected) {
      setConnectionError('No conectado al servidor');
      return;
    }
    const message = {
      roomId,
      text,
      id: `${socket.id}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      from: socket.id,
      timestamp: Date.now(),
    };
    console.log('Sending message:', message);
    socket.emit('chat-message', message);
    setText('');
  }, [text, roomId]);

  const handleKey = (e) => {
    if (e.key === 'Enter') send();
  };

  const drag = useRef(null);
  const startDrag = (e) => {
    if (e.target.closest('button, input')) return;
    drag.current = {
      offsetX: e.clientX - containerRef.current.offsetLeft,
      offsetY: e.clientY - containerRef.current.offsetTop,
    };
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const onDrag = (e) => {
    if (!drag.current) return;
    containerRef.current.style.left = `${e.clientX - drag.current.offsetX}px`;
    containerRef.current.style.top = `${e.clientY - drag.current.offsetY}px`;
  };

  const stopDrag = () => {
    drag.current = null;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
  };

  const formatTime = (timestamp) => {
    const d = new Date(timestamp);
    return `${d.getHours().toString().padStart(2, '0')}:${d
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className="border border-white/20 rounded-[32px] shadow-2xl p-6 bg-white/10 backdrop-blur-xl flex flex-col w-full h-[600px] relative overflow-hidden animate-in slide-in-from-right-8 duration-500"
      onMouseDown={startDrag}
    >
      <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
        <FiMessageCircle className="text-blue-600 text-xl" />
        <h2 className="text-lg font-semibold text-gray-800">Chat en vivo</h2>
        {connectionError && (
          <FiAlertCircle className="text-red-500 text-xl ml-auto" title={connectionError} />
        )}
      </div>

      <div className="flex-1 max-h-80 overflow-y-auto mb-4 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300">
        {messages.map((m, idx) => {
          const isMine = m.from === socket.id;
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const showSender = !prevMsg || prevMsg.from !== m.from;
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} animate-slideIn`}
            >
              {showSender && (
                <span
                  className={`text-[11px] mb-1 ${isMine ? 'text-blue-400' : 'text-gray-500'}`}
                >
                  {isMine ? 'Tú' : m.from !== socket.id ? m.from : 'Contacto'}
                </span>
              )}
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm text-sm leading-relaxed ${isMine
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                  }`}
                title={`Enviado a las ${formatTime(m.timestamp)}`}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
              </div>
              <span
                className={`text-[10px] mt-1 ${isMine ? 'text-blue-400' : 'text-gray-500'}`}
              >
                {formatTime(m.timestamp)}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="flex gap-3 items-center">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          placeholder="Escribe tu mensaje..."
          disabled={!!connectionError}
        />
        <button
          onClick={send}
          className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition flex items-center justify-center disabled:bg-gray-400"
          title="Enviar mensaje"
          disabled={!!connectionError}
        >
          <FiSend size={18} />
        </button>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={onLeave}
          className="px-5 py-2 bg-green-500 text-white rounded-xl shadow-md hover:bg-green-600 hover:scale-105 transition-transform flex items-center gap-2"
        >
          <FiRefreshCw size={18} />
          <span>Siguiente</span>
        </button>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.2s ease-out;
        }
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        .scrollbar-thumb-gray-300::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}


