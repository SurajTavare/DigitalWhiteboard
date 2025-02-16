import React, { useRef, useState, useEffect } from 'react';
import { DrawingPath, DrawingPoint } from '../types';

interface DrawingCanvasProps {
  isDrawing: boolean;
  isEraserActive: boolean;
  drawings: DrawingPath[];
  onDrawingComplete: (path: DrawingPath) => void;
  onErase: (pathIds: string[]) => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isDrawing,
  isEraserActive,
  drawings,
  onDrawingComplete,
  onErase,
  onUndo,
  onRedo
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPath, setCurrentPath] = useState<DrawingPoint[]>([]);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [erasedPaths, setErasedPaths] = useState<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
      drawAllPaths(ctx);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey && onRedo) {
          onRedo();
        } else if (onUndo) {
          onUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo]);

  const drawAllPaths = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    drawings.forEach(path => {
      if (!erasedPaths.includes(path.id)) {
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        drawPath(ctx, path.points);
      }
    });
  };

  const drawPath = (ctx: CanvasRenderingContext2D, points: DrawingPoint[]) => {
    if (points.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    points.forEach(point => {
      ctx.lineTo(point.x, point.y);
    });

    ctx.stroke();
  };

  const erasePath = (x: number, y: number) => {
    const tolerance = 10;
    const pathsToErase = drawings.filter(path => {
      if (erasedPaths.includes(path.id)) return false;
      return path.points.some(point => {
        return Math.abs(point.x - x) <= tolerance && Math.abs(point.y - y) <= tolerance;
      });
    });

    if (pathsToErase.length > 0) {
      const newErasedPaths = pathsToErase.map(p => p.id);
      setErasedPaths(prev => [...prev, ...newErasedPaths]);
      onErase(newErasedPaths);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && !isEraserActive) return;

    setIsDrawingActive(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isEraserActive) {
      erasePath(x, y);
    } else {
      setCurrentPath([{ x, y, type: 'start' }]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isEraserActive) {
      erasePath(x, y);
    } else {
      setCurrentPath(prev => [...prev, { x, y, type: 'point' }]);
      drawAllPaths(ctx);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      drawPath(ctx, [...currentPath, { x, y, type: 'point' }]);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawingActive) return;

    if (!isEraserActive && currentPath.length > 0) {
      const newPath: DrawingPath = {
        id: `drawing-${Date.now()}`,
        points: [...currentPath, { ...currentPath[currentPath.length - 1], type: 'end' }],
        color: '#000',
        width: 2
      };
      onDrawingComplete(newPath);
    }

    setCurrentPath([]);
    setIsDrawingActive(false);
  };

  return (
    <canvas
      ref={canvasRef}
      className={`absolute top-0 left-0 w-full h-full ${isDrawing || isEraserActive ? 'cursor-crosshair' : ''}`}
      style={{
        zIndex: isDrawing || isEraserActive ? 1 : 0,
        pointerEvents: isDrawing || isEraserActive ? 'auto' : 'none'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};

export default DrawingCanvas;