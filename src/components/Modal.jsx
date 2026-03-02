import React from 'react';
import { FiX, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

export default function Modal({ isOpen, onClose, title, message, type = 'info' }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[40px] shadow-2xl p-8 max-w-sm w-full animate-in zoom-in slide-in-from-bottom-8 duration-500 overflow-hidden font-['Outfit']">
                {/* Decorative Background */}
                <div className={`absolute top-0 left-0 w-full h-2 ${type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}></div>

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`p-4 rounded-full ${type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                        {type === 'error' ? <FiAlertTriangle size={32} /> : <FiCheckCircle size={32} />}
                    </div>

                    <h3 className="text-2xl font-bold text-white tracking-tight">
                        {title}
                    </h3>

                    <p className="text-blue-100 opacity-80 leading-relaxed">
                        {message}
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-white text-indigo-700 font-extrabold rounded-2xl shadow-xl hover:bg-blue-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Entendido
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                >
                    <FiX size={24} />
                </button>
            </div>
        </div>
    );
}
