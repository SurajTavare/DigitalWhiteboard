import React, { useRef, useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Shape as ShapeType } from '../types';
import { Minus, Plus, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic } from 'lucide-react';

interface ShapeProps {
  shape: ShapeType;
  onDrag: (id: string, position: { x: number; y: number }, isEndPoint?: boolean, updatedShape?: any) => void;
  onSelect: (id: string) => void;
  onTextEdit: (id: string, text: string) => void;
  onResize?: (id: string, width: number, height: number) => void;
  onColorChange?: (id: string, color: string) => void;
  onBorderWidthChange?: (id: string, width: number) => void;
  onStyleChange?: (id: string, styles: { [key: string]: string }) => void;
  isSelected: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
}

interface Point {
  x: number;
  y: number;
}

const Shape: React.FC<ShapeProps> = ({
  shape,
  onDrag,
  onSelect,
  onTextEdit,
  onResize,
  onColorChange,
  onBorderWidthChange,
  onStyleChange,
  isSelected,
  isEditing,
  setIsEditing
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const endPointRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(shape.text);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [borderWidth, setBorderWidth] = useState(shape.borderWidth || 2);
  const [textStyle, setTextStyle] = useState({
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'center',
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [size, setSize] = useState({
    width: shape.width || (shape.type === 'text' ? 200 : 128),
    height: shape.height || (shape.type === 'text' ? 100 : shape.type === 'rectangle' ? 80 : 128)
  });
  const resizeRef = useRef<HTMLDivElement>(null);
  const initialSize = useRef({ width: 0, height: 0 });
  const initialMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setText(shape.text);
  }, [shape.text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      initialSize.current = {
        width: rect.width,
        height: rect.height
      };
      initialMousePos.current = {
        x: e.clientX,
        y: e.clientY
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeDirection) return;

      const dx = e.clientX - initialMousePos.current.x;
      const dy = e.clientY - initialMousePos.current.y;

      let newWidth = initialSize.current.width;
      let newHeight = initialSize.current.height;

      if (resizeDirection.includes('e')) newWidth += dx;
      if (resizeDirection.includes('w')) newWidth -= dx;
      if (resizeDirection.includes('s')) newHeight += dy;
      if (resizeDirection.includes('n')) newHeight -= dy;

      // Maintain aspect ratio for square, circle, and diamond
      if (shape.type === 'square' || shape.type === 'circle' || shape.type === 'diamond') {
        const size = Math.max(newWidth, newHeight);
        newWidth = size;
        newHeight = size;
      }

      // Enforce minimum sizes
      newWidth = Math.max(50, newWidth);
      newHeight = Math.max(50, newHeight);

      setSize({ width: newWidth, height: newHeight });
      if (onResize) {
        onResize(shape.id, newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection, shape.type, shape.id, onResize]);

  const getShapeClass = () => {
    const baseClass = "absolute flex items-center justify-center text-sm p-4 cursor-move " +
      (isSelected ? "ring-2 ring-blue-500 " : "");
    
    switch (shape.type) {
      case 'rectangle':
        return baseClass + "bg-white";
      case 'square':
        return baseClass + "bg-white aspect-square";
      case 'circle':
        return baseClass + "bg-white rounded-full";
      case 'diamond':
        return baseClass + "bg-white";
      case 'text':
        return baseClass + "bg-transparent border-none p-0";
      case 'line':
        return baseClass + "bg-transparent border-none p-0";
      default:
        return baseClass;
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) {
      setIsEditing(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      const cursorPosition = e.currentTarget.selectionStart;
      const textBeforeCursor = text.slice(0, cursorPosition);
      const textAfterCursor = text.slice(cursorPosition);
      setText(textBeforeCursor + '\n' + textAfterCursor);
      e.preventDefault();
    } else if (e.key === 'Enter' && !e.shiftKey && shape.type !== 'text') {
      e.preventDefault();
      setIsEditing(false);
      onTextEdit(shape.id, text);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    onTextEdit(shape.id, text);
  };

  const handleColorChange = (color: string) => {
    if (onColorChange) {
      onColorChange(shape.id, color);
      setShowColorPicker(false);
    }
  };

  const handleBorderWidthChange = (change: number) => {
    const newWidth = Math.max(1, Math.min(10, borderWidth + change));
    setBorderWidth(newWidth);
    if (onBorderWidthChange) {
      onBorderWidthChange(shape.id, newWidth);
    }
  };

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080', '#008080', '#4A5568', '#ED8936', '#48BB78'];

  // Render line shape
  if (shape.type === 'line') {
    const startPoint = shape.position;
    const endPoint = shape.endPoint || { x: startPoint.x + 100, y: startPoint.y };
    
    const path = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
    
    return (
      <>
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        >
          {/* Visible line */}
          <path
            d={path}
            stroke={shape.borderColor || '#666'}
            strokeWidth={shape.borderWidth || 2}
            fill="none"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(shape.id);
            }}
            style={{ pointerEvents: 'visibleStroke' }} // Make the entire stroke area interactive
          />
          {/* Invisible thicker line for easier interaction */}
          <path
            d={path}
            stroke="transparent"
            strokeWidth={20} // Increase this value to make it easier to click
            fill="none"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(shape.id);
            }}
            style={{ pointerEvents: 'visibleStroke' }}
          />
        </svg>
        {isSelected && (
          <>
            <Draggable
              nodeRef={nodeRef}
              position={startPoint}
              onDrag={(_, data) => onDrag(shape.id, { x: data.x, y: data.y })}
              bounds="parent"
            >
              <div
                ref={nodeRef}
                className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-move"
                style={{ transform: 'translate(-50%, -50%)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(shape.id);
                }}
              />
            </Draggable>
            <Draggable
              nodeRef={endPointRef}
              position={endPoint}
              onDrag={(_, data) => onDrag(shape.id, { x: data.x, y: data.y }, true)}
              bounds="parent"
            >
              <div
                ref={endPointRef}
                className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-move"
                style={{ transform: 'translate(-50%, -50%)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(shape.id);
                }}
              />
            </Draggable>
          </>
        )}
      </>
    );
  }

  // Render diamond shape using SVG
  if (shape.type === 'diamond') {
    return (
      <Draggable
        nodeRef={nodeRef}
        position={shape.position}
        onDrag={(_, data) => onDrag(shape.id, { x: data.x, y: data.y })}
        bounds="parent"
        disabled={isResizing}
      >
        <div
          ref={nodeRef}
          className="absolute"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(shape.id);
          }}
          onDoubleClick={handleDoubleClick}
        >
          <svg
            width={size.width}
            height={size.height}
            style={{ overflow: 'visible' }}
          >
            <polygon
              points={`${size.width / 2},0 ${size.width},${size.height / 2} ${size.width / 2},${size.height} 0,${size.height / 2}`}
              fill="white"
              stroke={shape.borderColor || '#666'}
              strokeWidth={shape.borderWidth || 2}
            />
            {isEditing ? (
              <foreignObject x="0" y="0" width={size.width} height={size.height}>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  className="bg-transparent outline-none resize-none w-full h-full overflow-hidden text-center"
                  style={{
                    fontWeight: textStyle.fontWeight,
                    fontStyle: textStyle.fontStyle,
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Type here..."
                />
              </foreignObject>
            ) : (
              <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                style={{
                  fontWeight: textStyle.fontWeight,
                  fontStyle: textStyle.fontStyle,
                }}
              >
                {text}
              </text>
            )}
          </svg>

          {isSelected && (
            <>
              {/* Border Width and Color Controls */}
              <div className="absolute -top-12 left-0 bg-white/90 backdrop-blur-sm shadow-md rounded-lg p-2 flex gap-2 items-center border border-gray-200 max-w-[calc(100vw-theme(space.8))] overflow-x-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColorPicker(!showColorPicker);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0"
                  title="Change Border Color"
                >
                  <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: shape.borderColor || '#666' }} />
                </button>
                <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBorderWidthChange(-1);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
                    title="Decrease Border Width"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xs w-4 text-center">{borderWidth}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBorderWidthChange(1);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
                    title="Increase Border Width"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {showColorPicker && (
                  <div className="absolute top-10 left-0 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-2 z-10 border border-gray-200">
                    <div className="grid grid-cols-5 gap-1">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleColorChange(color);
                          }}
                          className="w-6 h-6 rounded-lg border border-gray-200 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Resize Handles */}
              <div
                className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-bl cursor-nw-resize"
                onMouseDown={(e) => handleResizeStart(e, 'nw')}
              />
              <div
                className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-br cursor-ne-resize"
                onMouseDown={(e) => handleResizeStart(e, 'ne')}
              />
              <div
                className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-tl cursor-sw-resize"
                onMouseDown={(e) => handleResizeStart(e, 'sw')}
              />
              <div
                className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-tr cursor-se-resize"
                onMouseDown={(e) => handleResizeStart(e, 'se')}
              />
            </>
          )}
        </div>
      </Draggable>
    );
  }

  // Render other shapes (rectangle, square, circle, text)
  return (
    <Draggable
      nodeRef={nodeRef}
      position={shape.position}
      onDrag={(_, data) => onDrag(shape.id, { x: data.x, y: data.y })}
      bounds="parent"
      disabled={isResizing}
    >
      <div
        ref={nodeRef}
        className={getShapeClass()}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(shape.id);
        }}
        onDoubleClick={handleDoubleClick}
        style={{
          width: size.width,
          height: size.height,
          ...(shape.type !== 'text' ? {
            borderColor: shape.borderColor || '#666',
            borderWidth: shape.borderWidth || 2,
            borderStyle: 'solid'
          } : {}),
          ...textStyle
        }}
      >
        {isSelected && !isEditing && (
          <div className="absolute -top-12 left-0 bg-white/90 backdrop-blur-sm shadow-md rounded-lg p-2 flex gap-2 items-center border border-gray-200 max-w-[calc(100vw-theme(space.8))] overflow-x-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0"
              title="Change Color"
            >
              <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: shape.borderColor || '#666' }} />
            </button>
            <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBorderWidthChange(-1);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
                title="Decrease Border Width"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xs w-4 text-center">{borderWidth}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBorderWidthChange(1);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
                title="Increase Border Width"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {showColorPicker && (
              <div className="absolute top-10 left-0 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-2 z-10 border border-gray-200">
                <div className="grid grid-cols-5 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleColorChange(color);
                      }}
                      className="w-6 h-6 rounded-lg border border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {shape.type === 'text' && isSelected && (
          <div className="absolute -top-12 left-0 bg-white/90 backdrop-blur-sm shadow-md rounded-lg p-2 flex gap-2 items-center">
            <button
              onClick={() => setTextStyle(prev => ({ ...prev, textAlign: 'left' }))}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTextStyle(prev => ({ ...prev, textAlign: 'center' }))}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTextStyle(prev => ({ ...prev, textAlign: 'right' }))}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <AlignRight className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <button
              onClick={() => setTextStyle(prev => ({
                ...prev,
                fontWeight: prev.fontWeight === 'bold' ? 'normal' : 'bold'
              }))}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTextStyle(prev => ({
                ...prev,
                fontStyle: prev.fontStyle === 'italic' ? 'normal' : 'italic'
              }))}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <Italic className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className={shape.type === 'diamond' ? 'transform -rotate-45' : ''}>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="bg-transparent outline-none resize-none w-full overflow-hidden"
              style={{
                textAlign: textStyle.textAlign as 'left' | 'center' | 'right',
                fontWeight: textStyle.fontWeight,
                fontStyle: textStyle.fontStyle,
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Type here..."
            />
          ) : (
            <div 
              className="whitespace-pre-wrap"
              style={{
                textAlign: textStyle.textAlign as 'left' | 'center' | 'right',
                fontWeight: textStyle.fontWeight,
                fontStyle: textStyle.fontStyle
              }}
            >
              {text}
            </div>
          )}
        </div>

        {isSelected && shape.type !== 'line' && (
          <>
            <div
              className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-bl cursor-nw-resize"
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
            />
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-br cursor-ne-resize"
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
            />
            <div
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-tl cursor-sw-resize"
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
            />
            <div
              ref={resizeRef}
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-tr cursor-se-resize"
              onMouseDown={(e) => handleResizeStart(e, 'se')}
            />
          </>
        )}
      </div>
    </Draggable>
  );
};

export default Shape;