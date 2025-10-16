import React from 'react';

export default function Loader({ text = 'Buscando usuario...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Spinner animado */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
        <div className="absolute w-16 h-16 border-4 border-t-transparent border-green-500 rounded-full animate-[spin_1.5s_linear_infinite]"></div>
      </div>
      {/* Texto de carga */}
      <p className="mt-6 text-lg font-medium text-gray-600 animate-pulse">
        {text}
      </p>
    </div>
  );
}