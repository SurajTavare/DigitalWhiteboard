import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface BackgroundColorPickerProps {
  onColorChange: (color: string) => void;
  onClose: () => void;
}

const BackgroundColorPicker: React.FC<BackgroundColorPickerProps> = ({ onColorChange, onClose }) => {
  const colors = ['#FFFFFF', '#F8F9FA', '#E9ECEF', '#DEE2E6', '#F8F0FC', '#F3F0FF', '#EDF2FF', '#E7F5FF', '#E3FAFC', '#E6FCF5', '#EBFBEE', '#FFF9DB', '#FFF4E6'];
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleColorSelect = (color: string) => {
    onColorChange(color);
    onClose();
  };

  return (
    <div ref={pickerRef} className="absolute top-12 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg z-20 border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-700">Background Color</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => handleColorSelect(color)}
            className="w-8 h-8 rounded-lg border border-gray-200 hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
};

export default BackgroundColorPicker;