import React, { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';

interface ViewOnlyToolbarProps {
  onExport: (type: 'png' | 'pdf') => void;
}

const ViewOnlyToolbar: React.FC<ViewOnlyToolbarProps> = ({ onExport }) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg z-20 border border-gray-200">
      <div className="relative" ref={exportRef}>
        <button 
          onClick={() => setIsExportOpen(!isExportOpen)} 
          className="p-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-all"
          title="Export Diagram"
        >
          <Download className="w-5 h-5" />
        </button>
        
        {isExportOpen && (
          <div className="absolute right-0 top-full mt-2 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-2 min-w-[120px] border border-gray-200">
            <button 
              onClick={() => {
                onExport('png');
                setIsExportOpen(false);
              }} 
              className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm"
            >
              PNG Image
            </button>
            <button 
              onClick={() => {
                onExport('pdf');
                setIsExportOpen(false);
              }} 
              className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm"
            >
              PDF Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewOnlyToolbar;