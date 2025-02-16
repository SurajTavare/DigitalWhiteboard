import React, { useState, useEffect } from 'react';
import * as PDFJS from 'pdfjs-dist';
import mammoth from 'mammoth';
import { X } from 'lucide-react';

// Set up PDF.js worker
PDFJS.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface FileViewerProps {
  file: File;
  onClose: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFile = async () => {
      try {
        if (file.type === 'application/pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise;
          let text = '';
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            text += textContent.items.map((item: any) => item.str).join(' ') + '\n';
          }
          
          setContent(text);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          setContent(result.value);
        } else if (file.type === 'text/plain') {
          const text = await file.text();
          setContent(text);
        } else {
          throw new Error('Unsupported file type');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file');
      } finally {
        setLoading(false);
      }
    };

    loadFile();
  }, [file]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 relative">
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 relative max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{file.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {error ? (
          <div className="text-red-500 p-4 bg-red-50 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 whitespace-pre-wrap font-mono text-sm p-4 bg-gray-50 rounded-lg">
            {content}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileViewer;