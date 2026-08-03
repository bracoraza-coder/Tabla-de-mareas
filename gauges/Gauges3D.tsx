import React from 'react';

interface Gauges3DProps {
  pressure?: number;   // hPa
  tempAir?: number;    // °C
  tempWater?: number;  // °C
  waveHeight?: number; // m
  uvIndex?: number;    // 0-11
}

export const Gauges3D: React.FC<Gauges3DProps> = ({
  pressure = 1018,
  tempAir = 22,
  tempWater = 19,
  waveHeight = 1.2,
  uvIndex = 6
}) => {
  const pressureAngle = Math.min(Math.max(((pressure - 980) / 60) * 240 - 120, -120), 120);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
      
      {/* PRESIÓN ATMOSFÉRICA */}
      <div className="bg-gradient-to-b from-slate-100 to-slate-200 p-4 rounded-2xl shadow-lg border border-slate-300 flex flex-col items-center">
        <h4 className="font-bold text-slate-700 text-xs uppercase mb-2 tracking-wider">Presión Atmosférica</h4>
        <div className="relative w-36 h-36 flex items-center justify-center bg-slate-300 rounded-full shadow-inner border-4 border-slate-100">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="6" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#0284c7" strokeWidth="6" strokeDasharray="200" strokeDashoffset="60" />
          </svg>
          <div 
            className="absolute w-1 h-14 bg-red-600 rounded-full origin-bottom transition-transform duration-700 shadow-md"
            style={{ transform: `translateY(-28px) rotate(${pressureAngle}deg)` }}
          />
          <div className="absolute w-4 h-4 bg-slate-800 rounded-full border-2 border-white shadow-md"></div>
          <div className="absolute bottom-6 text-center">
            <span className="text-base font-extrabold text-slate-800">{pressure}</span>
            <span className="text-[10px] text-slate-500 block -mt-1">hPa</span>
          </div>
        </div>
      </div>

      {/* TEMPERATURA */}
      <div className="bg-gradient-to-b from-slate-100 to-slate-200 p-4 rounded-2xl shadow-lg border border-slate-300 flex flex-col items-center justify-between">
        <h4 className="font-bold text-slate-700 text-xs uppercase mb-2 tracking-wider">Temperatura</h4>
        <div className="flex justify-around w-full items-center my-auto">
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-amber-600 mb-1">Aire</span>
            <div className="w-10 h-24 bg-slate-300 rounded-full p-1 relative shadow-inner border border-slate-400">
              <div 
                className="w-full bg-amber-500 rounded-full absolute bottom-1 left-0 right-0 transition-all duration-500"
                style={{ height: `${Math.min(tempAir * 2, 85)}%` }}
              />
            </div>
            <span className="text-sm font-bold text-slate-800 mt-2">{tempAir}°C</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-cyan-600 mb-1">Agua</span>
            <div className="w-10 h-24 bg-slate-300 rounded-full p-1 relative shadow-inner border border-slate-400">
              <div 
                className="w-full bg-cyan-500 rounded-full absolute bottom-1 left-0 right-0 transition-all duration-500"
                style={{ height: `${Math.min(tempWater * 2, 85)}%` }}
              />
            </div>
            <span className="text-sm font-bold text-slate-800 mt-2">{tempWater}°C</span>
          </div>
        </div>
      </div>

      {/* OLEAJE */}
      <div className="bg-gradient-to-b from-slate-100 to-slate-200 p-4 rounded-2xl shadow-lg border border-slate-300 flex flex-col items-center">
        <h4 className="font-bold text-slate-700 text-xs uppercase mb-2 tracking-wider">Altura de Ola</h4>
        <div className="relative w-36 h-36 flex items-center justify-center bg-slate-300 rounded-full shadow-inner border-4 border-slate-100">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M 20 70 A 35 35 0 0 1 80 70" fill="none" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />
            <path d="M 20 70 A 35 35 0 0 1 80 70" fill="none" stroke="#0ea5e9" strokeWidth="8" strokeDasharray="110" strokeDashoffset={110 - Math.min(waveHeight * 25, 110)} strokeLinecap="round" />
          </svg>
          <div className="absolute text-center">
            <span className="text-xl font-black text-slate-800">{waveHeight}</span>
            <span className="text-xs text-slate-500 block">metros</span>
          </div>
        </div>
      </div>

      {/* ÍNDICE UV */}
      <div className="bg-gradient-to-b from-slate-100 to-slate-200 p-4 rounded-2xl shadow-lg border border-slate-300 flex flex-col items-center">
        <h4 className="font-bold text-slate-700 text-xs uppercase mb-2 tracking-wider">Índice UV</h4>
        <div className="relative w-36 h-36 flex items-center justify-center bg-slate-300 rounded-full shadow-inner border-4 border-slate-100">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M 20 70 A 35 35 0 0 1 80 70" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
            <path d="M 20 70 A 35 35 0 0 1 80 70" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="110" strokeDashoffset={110 - Math.min((uvIndex / 11) * 110, 110)} strokeLinecap="round" />
          </svg>
          <div className="absolute text-center">
            <span className="text-xl font-black text-amber-600">{uvIndex}</span>
            <span className="text-xs text-slate-500 block">
              {uvIndex > 7 ? 'Muy Alto' : uvIndex > 5 ? 'Alto' : 'Moderado'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};