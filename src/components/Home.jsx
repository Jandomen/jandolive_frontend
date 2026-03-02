import React from 'react';

export default function Home({ onStart }) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-700 via-violet-700 to-pink-600 overflow-hidden font-['Outfit']">
      {/* Patrón de fondo sutil */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

      {/* Círculos de luz decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-400 rounded-full blur-[120px] opacity-20"></div>

      <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 lg:px-8 max-w-3xl bg-white/10 backdrop-blur-2xl p-12 rounded-[40px] border border-white/20 shadow-2xl mx-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h1 className="text-6xl sm:text-7xl font-black text-white mb-6 tracking-tighter italic">
          JANDOLIVE <span className="text-blue-300 not-italic">🥳</span>
        </h1>

        <p className="text-xl sm:text-2xl text-blue-100 mb-10 opacity-90 leading-relaxed font-light">
          Conéctate al instante con personas de todo el mundo. Charlas en tiempo real, <span className="font-bold text-white underline decoration-blue-400">seguras y anónimas</span>.
        </p>

        <button
          onClick={onStart}
          className="group relative px-12 py-5 bg-white text-indigo-700 text-xl font-extrabold rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-indigo-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <span className="relative z-10">¡Comenzar Ahora!</span>
        </button>

        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm font-bold text-white/60">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
            Anónimo
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
            Video HD
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div>
            Seguro
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 text-white/30 text-xs font-bold tracking-widest uppercase">
        &copy; 2025 Jandolive • Diseñado para conectar
      </footer>
    </div>
  );
}