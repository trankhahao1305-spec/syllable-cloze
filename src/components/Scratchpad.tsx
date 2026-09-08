import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { RotateCcw } from 'lucide-react';

export interface ScratchpadHandle {
  clear: () => void;
  isEmpty: () => boolean;
}

interface ScratchpadProps {
  strokeColor?: string;
  lineWidth?: number;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

export const Scratchpad = forwardRef<ScratchpadHandle, ScratchpadProps>(({
  strokeColor = '#1e293b',
  lineWidth = 3.5,
  className = ''
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const [hasStrokes, setHasStrokes] = useState(false);

  // Lưu lịch sử nét vẽ để vẽ lại khi resize
  const strokesRef = useRef<Point[][]>([]);
  const currentStrokeRef = useRef<Point[]>([]);

  const setupAndRedraw = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeColor;

    // Vẽ lại các nét đã vẽ
    for (const stroke of strokesRef.current) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        const midPoint = {
          x: (stroke[i - 1].x + stroke[i].x) / 2,
          y: (stroke[i - 1].y + stroke[i].y) / 2
        };
        ctx.quadraticCurveTo(stroke[i - 1].x, stroke[i - 1].y, midPoint.x, midPoint.y);
      }
      ctx.lineTo(stroke[stroke.length - 1].x, stroke[stroke.length - 1].y);
      ctx.stroke();
    }
  };

  useEffect(() => {
    setupAndRedraw();

    const handleResize = () => {
      setupAndRedraw();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [lineWidth, strokeColor]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current = [];
    currentStrokeRef.current = [];
    setHasStrokes(false);
  };

  useImperativeHandle(ref, () => ({
    clear: clearCanvas,
    isEmpty: () => strokesRef.current.length === 0
  }));

  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Ngăn chặn cuộn/trượt màn hình khi viết tay
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const pt = getCanvasCoordinates(e);
    if (!pt) return;

    isDrawingRef.current = true;
    lastPointRef.current = pt;
    currentStrokeRef.current = [pt];
    setHasStrokes(true);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    e.preventDefault();

    const pt = getCanvasCoordinates(e);
    if (!pt) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);

    const midPoint = {
      x: (lastPointRef.current.x + pt.x) / 2,
      y: (lastPointRef.current.y + pt.y) / 2
    };

    ctx.quadraticCurveTo(lastPointRef.current.x, lastPointRef.current.y, midPoint.x, midPoint.y);
    ctx.stroke();

    lastPointRef.current = pt;
    currentStrokeRef.current.push(pt);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    isDrawingRef.current = false;
    lastPointRef.current = null;

    if (currentStrokeRef.current.length > 0) {
      strokesRef.current.push([...currentStrokeRef.current]);
      currentStrokeRef.current = [];
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden rounded-2xl select-none bg-slate-50 border border-slate-200/80 shadow-inner ${className}`}
      style={{
        backgroundImage: `radial-gradient(#cbd5e1 1.2px, transparent 1.2px)`,
        backgroundSize: '24px 24px'
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full block cursor-crosshair"
        style={{ touchAction: 'none' }}
      />

      {/* Nút Xóa nhanh bảng viết khi đang vẽ */}
      {hasStrokes && (
        <button
          onClick={clearCanvas}
          type="button"
          title="Xóa nhanh nét vẽ"
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md text-slate-500 hover:text-slate-800 active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      )}

      {/* Hướng dẫn mờ khi bảng còn trống */}
      {!hasStrokes && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
          <p className="text-slate-400 font-medium text-sm tracking-wide">
            ✍️ Viết tay âm tiết còn thiếu vào đây
          </p>
        </div>
      )}
    </div>
  );
});

Scratchpad.displayName = 'Scratchpad';
