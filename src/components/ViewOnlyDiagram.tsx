import React, { useRef } from 'react';
import { Shape, Connection, DrawingPath } from '../types';
import ShapeComponent from './Shape';
import ConnectionComponent from './Connection';
import ViewOnlyToolbar from './ViewOnlyToolbar';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ViewOnlyDiagramProps {
  shapes: Shape[];
  connections: Connection[];
  drawings: DrawingPath[];
  backgroundColor?: string;
  isPublic?: boolean;
  shareId?: string;
}

const ViewOnlyDiagram: React.FC<ViewOnlyDiagramProps> = ({
  shapes,
  connections,
  drawings,
  backgroundColor = '#FFFFFF'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const calculateBoundingBox = () => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Check shapes
    shapes.forEach(shape => {
      const width = shape.width || (shape.type === 'text' ? 200 : 128);
      const height = shape.height || (shape.type === 'text' ? 100 : shape.type === 'rectangle' ? 80 : 128);

      minX = Math.min(minX, shape.position.x);
      minY = Math.min(minY, shape.position.y);
      maxX = Math.max(maxX, shape.position.x + width);
      maxY = Math.max(maxY, shape.position.y + height);

      // For lines, check endPoint
      if (shape.type === 'line' && shape.endPoint) {
        minX = Math.min(minX, shape.endPoint.x);
        minY = Math.min(minY, shape.endPoint.y);
        maxX = Math.max(maxX, shape.endPoint.x);
        maxY = Math.max(maxY, shape.endPoint.y);
      }
    });

    // Check drawings
    drawings.forEach(drawing => {
      drawing.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    // Add padding
    const padding = 50;
    return {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      width: Math.min(maxX - minX + padding * 2, 5000),
      height: Math.min(maxY - minY + padding * 2, 5000)
    };
  };

  const handleExport = async (type: 'png' | 'pdf') => {
    if (!containerRef.current) return;

    try {
      const boundingBox = calculateBoundingBox();
      
      // Create a temporary container for export
      const exportContainer = containerRef.current.cloneNode(true) as HTMLElement;
      
      // Position the container to show only the diagram area
      exportContainer.style.backgroundColor = backgroundColor;
      exportContainer.style.width = `${boundingBox.width}px`;
      exportContainer.style.height = `${boundingBox.height}px`;
      exportContainer.style.position = 'fixed';
      exportContainer.style.top = '0';
      exportContainer.style.left = '0';
      exportContainer.style.zIndex = '-1000';
      exportContainer.style.transform = `translate(${-boundingBox.x}px, ${-boundingBox.y}px)`;
      exportContainer.style.overflow = 'hidden';
      document.body.appendChild(exportContainer);

      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(exportContainer, {
        backgroundColor: backgroundColor,
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        foreignObjectRendering: true,
        width: boundingBox.width,
        height: boundingBox.height,
        x: boundingBox.x,
        y: boundingBox.y
      });

      if (type === 'png') {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'diagram.png';
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (type === 'pdf') {
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
        pdf.save('diagram.pdf');
      }

      document.body.removeChild(exportContainer);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export diagram. Please try again.');
    }
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 relative diagram-canvas overflow-auto"
        style={{ backgroundColor }}
      >
        <ViewOnlyToolbar onExport={handleExport} />

        {connections.map(connection => (
          <ConnectionComponent
            key={connection.id}
            connection={connection}
            shapes={shapes}
            isSelected={false}
            onSelect={() => {}}
            onStyleChange={() => {}}
          />
        ))}

        {shapes.map(shape => (
          <ShapeComponent
            key={shape.id}
            shape={shape}
            onDrag={() => {}}
            onSelect={() => {}}
            onTextEdit={() => {}}
            isSelected={false}
            isEditing={false}
            setIsEditing={() => {}}
          />
        ))}

        {drawings.length > 0 && (
          <canvas
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
            ref={(canvas) => {
              if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  canvas.width = canvas.offsetWidth;
                  canvas.height = canvas.offsetHeight;
                  
                  drawings.forEach(path => {
                    ctx.strokeStyle = path.color;
                    ctx.lineWidth = path.width;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    
                    if (path.points.length > 0) {
                      ctx.beginPath();
                      ctx.moveTo(path.points[0].x, path.points[0].y);
                      path.points.forEach(point => {
                        ctx.lineTo(point.x, point.y);
                      });
                      ctx.stroke();
                    }
                  });
                }
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ViewOnlyDiagram;