import React from 'react';

export default function Home({ onStart }) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-indigo-50 overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/subtle-dots.png')] opacity-10"></div>

      <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight drop-shadow-sm">
          Jandolive <span className="text-blue-600">🥳</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-md sm:max-w-lg leading-relaxed">
          Conéctate al instante con personas de todo el mundo y disfruta de charlas en tiempo real con video y texto.
        </p>

        <button
          onClick={onStart}
          className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-blue-700 hover:scale-105 transition-transform duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          ¡Comenzar Ahora!
        </button>

        <p className="mt-6 text-sm text-gray-500">
          Totalmente anónimo • Video y chat en tiempo real • Conexión segura
        </p>
      </div>

      <footer className="absolute bottom-4 text-gray-400 text-sm">
        &copy; 2025 Jandolive. Todos los derechos reservados.
      </footer>
    </div>
  );
}