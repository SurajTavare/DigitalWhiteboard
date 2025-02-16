import React, { useState, useEffect, useRef } from 'react';
import { Connection as ConnectionType, LineStyle, ArrowStyle } from '../types';
import { Shape } from '../types';
import { ArrowRight, ArrowLeft, ArrowLeftRight } from 'lucide-react';

interface ConnectionProps {
  connection: ConnectionType;
  shapes: Shape[];
  isSelected: boolean;
  onSelect: (id: string) => void;
  onStyleChange: (id: string, lineStyle: LineStyle, arrowStyle: ArrowStyle) => void;
}

const Connection: React.FC<ConnectionProps> = ({
  connection,
  shapes,
  isSelected,
  onSelect,
  onStyleChange
}) => {
  const [showStyleOptions, setShowStyleOptions] = useState(false);
  const [pathLength, setPathLength] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);
  const fromShape = shapes.find(s => s.id === connection.from);
  const toShape = shapes.find(s => s.id === connection.to);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [connection]);

  if (!fromShape || !toShape) return null;

  const getStrokeDashArray = (style: LineStyle) => {
    switch (style) {
      case 'dashed':
        return '8,8';
      case 'dotted':
        return '2,4';
      default:
        return 'none';
    }
  };

  const getCenterPoint = (shape: Shape) => {
    const width = shape.width || (shape.type === 'text' ? 200 : 128);
    const height = shape.height || (shape.type === 'text' ? 100 : 80);

    return {
      x: shape.position.x + width / 2,
      y: shape.position.y + height / 2
    };
  };

  const getIntersectionPoint = (shape: Shape, point: { x: number; y: number }) => {
    const center = getCenterPoint(shape);
    const width = shape.width || (shape.type === 'text' ? 200 : 128);
    const height = shape.height || (shape.type === 'text' ? 100 : 80);
    
    const angle = Math.atan2(point.y - center.y, point.x - center.x);
    
    let intersectX, intersectY;
    
    if (shape.type === 'circle') {
      const radius = width / 2;
      intersectX = center.x + radius * Math.cos(angle);
      intersectY = center.y + radius * Math.sin(angle);
    } else if (shape.type === 'diamond') {
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      const tanAngle = Math.abs(Math.tan(angle));
      
      if (tanAngle <= halfHeight / halfWidth) {
        intersectX = center.x + (halfWidth * Math.sign(Math.cos(angle)));
        intersectY = center.y + (halfWidth * tanAngle * Math.sign(Math.sin(angle)));
      } else {
        intersectX = center.x + (halfHeight / tanAngle * Math.sign(Math.cos(angle)));
        intersectY = center.y + (halfHeight * Math.sign(Math.sin(angle)));
      }
    } else {
      const dx = Math.abs(Math.cos(angle));
      const dy = Math.abs(Math.sin(angle));
      
      if (dx * height <= dy * width) {
        intersectX = center.x + (height / (2 * dy)) * dx * Math.sign(Math.cos(angle));
        intersectY = center.y + (height / 2) * Math.sign(Math.sin(angle));
      } else {
        intersectX = center.x + (width / 2) * Math.sign(Math.cos(angle));
        intersectY = center.y + (width / (2 * dx)) * dy * Math.sign(Math.sin(angle));
      }
    }
    
    return { x: intersectX, y: intersectY };
  };

  const getPath = () => {
    const from = getCenterPoint(fromShape);
    const to = getCenterPoint(toShape);

    const fromIntersect = getIntersectionPoint(fromShape, to);
    const toIntersect = getIntersectionPoint(toShape, from);

    // Use straight lines by default
    if (connection.lineStyle === 'curved') {
      const dx = toIntersect.x - fromIntersect.x;
      const dy = toIntersect.y - fromIntersect.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const controlPoint1 = {
        x: fromIntersect.x + dx * 0.25,
        y: fromIntersect.y + dy * 0.25 - Math.min(50, distance * 0.2)
      };
      
      const controlPoint2 = {
        x: fromIntersect.x + dx * 0.75,
        y: fromIntersect.y + dy * 0.75 - Math.min(50, distance * 0.2)
      };

      return {
        path: `M ${fromIntersect.x} ${fromIntersect.y} C ${controlPoint1.x} ${controlPoint1.y} ${controlPoint2.x} ${controlPoint2.y} ${toIntersect.x} ${toIntersect.y}`,
        fromIntersect,
        toIntersect,
        controlPoint1,
        controlPoint2
      };
    }

    // Straight line
    return {
      path: `M ${fromIntersect.x} ${fromIntersect.y} L ${toIntersect.x} ${toIntersect.y}`,
      fromIntersect,
      toIntersect
    };
  };

  const pathData = getPath();

  const handleLineStyleChange = (style: LineStyle) => {
    onStyleChange(connection.id, style, connection.arrowStyle);
    setShowStyleOptions(false);
  };

  const handleArrowStyleChange = (style: ArrowStyle) => {
    onStyleChange(connection.id, connection.lineStyle, style);
    setShowStyleOptions(false);
  };

  const midPoint = {
    x: (pathData.fromIntersect.x + pathData.toIntersect.x) / 2,
    y: (pathData.fromIntersect.y + pathData.toIntersect.y) / 2 - 40
  };

  return (
    <>
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <defs>
          <marker
            id={`arrowhead-start-${connection.id}`}
            markerWidth="10"
            markerHeight="7"
            refX="0"
            refY="3.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon
              points="10 0, 0 3.5, 10 7"
              fill={isSelected ? '#3B82F6' : '#666'}
            />
          </marker>
          <marker
            id={`arrowhead-end-${connection.id}`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={isSelected ? '#3B82F6' : '#666'}
            />
          </marker>
        </defs>
        
        <path
          ref={pathRef}
          d={pathData.path}
          stroke={isSelected ? '#3B82F6' : '#666'}
          strokeWidth="2"
          fill="none"
          strokeDasharray={getStrokeDashArray(connection.lineStyle)}
          markerStart={connection.arrowStyle === 'start' || connection.arrowStyle === 'both' ? `url(#arrowhead-start-${connection.id})` : ''}
          markerEnd={connection.arrowStyle === 'end' || connection.arrowStyle === 'both' ? `url(#arrowhead-end-${connection.id})` : ''}
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(connection.id);
          }}
          style={{ pointerEvents: 'stroke' }}
        />

        {isSelected && connection.lineStyle === 'curved' && pathData.controlPoint1 && pathData.controlPoint2 && (
          <>
            <circle
              cx={pathData.controlPoint1.x}
              cy={pathData.controlPoint1.y}
              r={4}
              fill="#3B82F6"
            />
            <circle
              cx={pathData.controlPoint2.x}
              cy={pathData.controlPoint2.y}
              r={4}
              fill="#3B82F6"
            />
          </>
        )}
      </svg>

      {isSelected && (
        <div
          className="absolute bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-2 z-10 flex gap-2 items-center border border-gray-200"
          style={{ left: midPoint.x, top: midPoint.y }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex gap-2">
            <button
              onClick={() => handleLineStyleChange('solid')}
              className={`p-2 hover:bg-gray-100 rounded-lg ${connection.lineStyle === 'solid' ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              ───
            </button>
            <button
              onClick={() => handleLineStyleChange('dashed')}
              className={`p-2 hover:bg-gray-100 rounded-lg ${connection.lineStyle === 'dashed' ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              - - -
            </button>
            <button
              onClick={() => handleLineStyleChange('dotted')}
              className={`p-2 hover:bg-gray-100 rounded-lg ${connection.lineStyle === 'dotted' ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              ⋯
            </button>
            <button
              onClick={() => handleLineStyleChange('curved')}
              className={`p-2 hover:bg-gray-100 rounded-lg ${connection.lineStyle === 'curved' ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              ⟆
            </button>
          </div>

          <div className="w-px h-6 bg-gray-200" />

          <div className="flex gap-2">
            <button
              onClick={() => handleArrowStyleChange('none')}
              className={`p-2 hover:bg-gray-100 rounded-lg ${connection.arrowStyle === 'none' ? 'bg-blue-50 text-blue-600' : ''}`}
              title="No Arrows"
            >
              ─
            </button>
            <button
              onClick={() => handleArrowStyleChange('start')}
              className={`p-2 hover:bg-gray-100 rounded-lg ${connection.arrowStyle === 'start' ? 'bg-blue-50 text-blue-600' : ''}`}
              title="Start Arrow"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleArrowStyleChange('end')}
              className={`p-2 hover:bg-gray-100 rounded-lg ${connection.arrowStyle === 'end' ? 'bg-blue-50 text-blue-600' : ''}`}
              title="End Arrow"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleArrowStyleChange('both')}
              className={`p-2 hover:bg-gray-100 rounded-lg ${connection.arrowStyle === 'both' ? 'bg-blue-50 text-blue-600' : ''}`}
              title="Both Arrows"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Connection;