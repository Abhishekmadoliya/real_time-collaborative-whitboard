import { useEffect, useRef } from 'react';
import { ElementTypes } from '../hooks/useWhiteboard';

const Canvas = ({ 
  canvasRef,
  elements,
  remoteUserCursors,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  width = 1920,
  height = 1080,
  backgroundColor = '#ffffff',
  gridSize = 20,
  showGrid = true
}) => {
  const drawingCanvasRef = useRef(null);
  
  useEffect(() => {
    if (!drawingCanvasRef.current) return;
    
    const canvas = drawingCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height, gridSize);
    }
    
    // Draw elements
    elements.forEach(element => {
      drawElement(ctx, element);
    });
    
    // Draw remote user cursors
    drawRemoteCursors(ctx, remoteUserCursors);
  }, [elements, remoteUserCursors, backgroundColor, showGrid, gridSize, width, height]);
  
  const drawGrid = (ctx, width, height, gridSize) => {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };
  
  const drawElement = (ctx, element) => {
    switch (element.type) {
      case ElementTypes.PENCIL:
        drawPencil(ctx, element);
        break;
      case ElementTypes.LINE:
        drawLine(ctx, element);
        break;
      case ElementTypes.RECTANGLE:
        drawRectangle(ctx, element);
        break;
      case ElementTypes.ELLIPSE:
        drawEllipse(ctx, element);
        break;
      case ElementTypes.TEXT:
        drawText(ctx, element);
        break;
      case ElementTypes.IMAGE:
        drawImage(ctx, element);
        break;
      default:
        break;
    }
  };
  
  const drawPencil = (ctx, element) => {
    const { points, strokeColor, strokeWidth } = element;
    
    if (points.length < 2) return;
    
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.stroke();
  };
  
  const drawLine = (ctx, element) => {
    const { x1, y1, x2, y2, strokeColor, strokeWidth } = element;
    
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  
  const drawRectangle = (ctx, element) => {
    const { x1, y1, x2, y2, strokeColor, fillColor, strokeWidth } = element;
    
    const width = x2 - x1;
    const height = y2 - y1;
    
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    
    if (fillColor !== 'transparent') {
      ctx.fillStyle = fillColor;
      ctx.fillRect(x1, y1, width, height);
    }
    
    ctx.strokeRect(x1, y1, width, height);
  };
  
  const drawEllipse = (ctx, element) => {
    const { x1, y1, x2, y2, strokeColor, fillColor, strokeWidth } = element;
    
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const radiusX = Math.abs(x2 - x1) / 2;
    const radiusY = Math.abs(y2 - y1) / 2;
    
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    
    if (fillColor !== 'transparent') {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    
    ctx.stroke();
  };
  
  const drawText = (ctx, element) => {
    const { x, y, text, fontSize, fontFamily, color } = element;
    
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y + fontSize); // Add fontSize to y to ensure text is visible
  };
  
  const drawImage = (ctx, element) => {
    const { x, y, width, height, src } = element;
    
    const img = new Image();
    img.src = src;
    
    if (img.complete) {
      ctx.drawImage(img, x, y, width, height);
    } else {
      img.onload = () => {
        ctx.drawImage(img, x, y, width, height);
      };
    }
  };
  
  const drawRemoteCursors = (ctx, cursors) => {
    Object.keys(cursors).forEach(userId => {
      const position = cursors[userId];
      
      if (!position) return;
      
      // Draw cursor
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(position.x, position.y, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw user ID
      ctx.font = '12px Arial';
      ctx.fillStyle = '#000000';
      ctx.fillText(userId.substring(0, 6), position.x + 10, position.y + 5);
    });
  };
  
  return (
    <canvas
      ref={(el) => {
        canvasRef.current = el;
        drawingCanvasRef.current = el;
      }}
      width={width}
      height={height}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      className="border border-gray-300 cursor-crosshair touch-none"
      style={{ backgroundColor }}
    />
  );
};

export default Canvas; 