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

  const handleExport = async (type: 'png' | 'pdf') => {
    if (!containerRef.current) return;

    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor,
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        foreignObjectRendering: true
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