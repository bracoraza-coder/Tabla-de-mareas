import React, { useEffect, useRef } from 'react';
import { TideDayData, Port, UserUnits } from '../../types';

interface WaterLevelCanvasGaugeProps {
  dayData: TideDayData;
  port: Port;
  units: UserUnits;
}

export const WaterLevelCanvasGauge: React.FC<WaterLevelCanvasGaugeProps> = ({
  dayData,
  port,
  units,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { currentWaterHeight, currentTideState, coefficient } = dayData;
  const maxPossible = port.baseHeight + port.amplitude;
  const normalizedLevel = Math.max(0, Math.min(1, currentWaterHeight / (maxPossible || 1)));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let waveOffset = 0;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 320;
      const height = rect.height || 180;

      // High-DPI buffer scaling
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Clear canvas with dark sea floor background
      ctx.fillStyle = '#020617'; // slate-950
      ctx.fillRect(0, 0, width, height);

      // Draw gauge background grid & depth markers
      ctx.strokeStyle = '#1e293b'; // slate-800
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      for (let y = 30; y < height - 20; y += 30) {
        ctx.beginPath();
        ctx.moveTo(10, y);
        ctx.lineTo(width - 10, y);
        ctx.stroke();
      }
      ctx.setLineDash([]); // reset

      // Calculate water surface Y position (higher water height = smaller Y)
      const waterTopY = height - 25 - normalizedLevel * (height - 60);

      // Draw ocean gradient
      const grad = ctx.createLinearGradient(0, waterTopY, 0, height);
      if (coefficient >= 80) {
        grad.addColorStop(0, '#0284c7'); // sky-600
        grad.addColorStop(1, '#0c4a6e'); // sky-900
      } else {
        grad.addColorStop(0, '#0284c7');
        grad.addColorStop(1, '#0f172a');
      }

      ctx.fillStyle = grad;

      // Dynamic 2D Sine Wave Surface Animation
      waveOffset += 0.04;
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, waterTopY);

      for (let x = 0; x <= width; x += 10) {
        const sineY = Math.sin(x * 0.03 + waveOffset) * 3 + Math.cos(x * 0.015 - waveOffset * 0.5) * 2;
        ctx.lineTo(x, waterTopY + sineY);
      }

      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Draw crest highlight line
      ctx.strokeStyle = '#38bdf8'; // sky-400
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 10) {
        const sineY = Math.sin(x * 0.03 + waveOffset) * 3 + Math.cos(x * 0.015 - waveOffset * 0.5) * 2;
        if (x === 0) ctx.moveTo(x, waterTopY + sineY);
        else ctx.lineTo(x, waterTopY + sineY);
      }
      ctx.stroke();

      // Current Height Label Overlay
      const formatH = (m: number) => {
        if (units.height === 'ft') return `${(m * 3.28084).toFixed(2)} ft`;
        return `${m.toFixed(2)} m`;
      };

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Nivel: ${formatH(currentWaterHeight)}`, 16, 26);

      ctx.font = '11px monospace';
      ctx.fillStyle = currentTideState === 'subiendo' ? '#34d399' : '#f87171';
      ctx.fillText(
        `Marea ${currentTideState.toUpperCase()} ${currentTideState === 'subiendo' ? '▲' : '▼'} (Coef. ${coefficient})`,
        16,
        42
      );

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    // Debounced resize: coalesce rapid resize events via requestAnimationFrame
    // to prevent frame drops on window resize (avoids synchronous redraws on
    // every pixel change and is safe to cancel on unmount).
    let rafResize: number | null = null;
    const handleResize = () => {
      if (rafResize !== null) cancelAnimationFrame(rafResize);
      rafResize = requestAnimationFrame(() => {
        rafResize = null;
        // The animation loop (render) already reads getBoundingClientRect on
        // every frame, so a single extra frame after resize is sufficient.
      });
    };
    window.addEventListener('resize', handleResize);

    // Memory Leak Prevention: Cleanup on unmount!
    return () => {
      cancelAnimationFrame(animId);
      if (rafResize !== null) cancelAnimationFrame(rafResize);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentWaterHeight, currentTideState, coefficient, port, units]);

  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 shadow-xl flex flex-col items-center">
      <div className="w-full flex items-center justify-between pb-2 px-1 border-b border-slate-800/80 mb-2 text-xs font-mono font-bold text-slate-300">
        <span>SIMULADOR 2D NIVEL DE AGUA (CANVAS RETINA 60FPS)</span>
        <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-2 py-0.5 rounded">
          High-DPI
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-40 rounded-xl overflow-hidden block cursor-pointer"
        style={{ width: '100%', height: '160px' }}
      />
    </div>
  );
};
