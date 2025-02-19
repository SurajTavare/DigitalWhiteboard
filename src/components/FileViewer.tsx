import React, { useState, useEffect } from 'react';
import { X, Moon, Sun } from 'lucide-react';
import mammoth from 'mammoth';

interface FileViewerProps {
  file: File;
  onClose: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const loadFile = async () => {
      try {
        if (file.type === 'application/pdf') {
          const url = URL.createObjectURL(file);
          setFileUrl(url);
          setLoading(false);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const arrayBuffer = await file.arrayBuffer();
          
          const result = await mammoth.convertToHtml(
            { arrayBuffer: arrayBuffer },
            {
              styleMap: [
                "p[style-name='Heading 1'] => h1:fresh",
                "p[style-name='Heading 2'] => h2:fresh",
                "p[style-name='Heading 3'] => h3:fresh",
                "r[style-name='Strong'] => strong",
                "table => table.table",
                "p => p.paragraph"
              ],
              includeDefaultStyleMap: true,
              preserveEmptyParagraphs: true,
              ignoreEmptyParagraphs: false
            }
          );

          const styledContent = `
            <style>
              .document-content {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: ${darkMode ? '#ddd' : '#333'};
                background-color: ${darkMode ? '#1e1e1e' : '#fff'};
                padding: 1rem;
              }
              .paragraph {
                margin: 1em 0;
              }
              table.table {
                border-collapse: collapse;
                width: 100%;
                margin: 1em 0;
                color: ${darkMode ? '#ddd' : '#333'};
              }
              table.table td, table.table th {
                border: 1px solid ${darkMode ? '#555' : '#ddd'};
                padding: 8px;
              }
              table.table tr:nth-child(even) {
                background-color: ${darkMode ? '#2e2e2e' : '#f9f9f9'};
              }
              h1, h2, h3 {
                color: #2563eb;
                margin: 1em 0;
              }
              img {
                max-width: 100%;
                height: auto;
                margin: 1em 0;
              }
            </style>
            <div class="document-content">
              ${result.value}
            </div>
          `;

          setContent(styledContent);
          
          const url = URL.createObjectURL(file);
          setFileUrl(url);
        } else if (file.type === 'text/plain') {
          const text = await file.text();
          setContent(text.replace(/\n/g, '<br>'));
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

    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [file, darkMode]);

  return (
    <div className={`fixed inset-0 ${darkMode ? 'bg-black' : 'bg-black/50'} backdrop-blur-sm flex items-center justify-center z-50`}>
      <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'} rounded-lg p-4 w-11/12 h-[90vh] relative flex flex-col`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">{file.name}</h2>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg transition-colors">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 bg-red-50 rounded-lg">
            {error}
          </div>
        ) : file.type === 'application/pdf' ? (
          <div className="flex-1 w-full h-[calc(90vh-4rem)] min-h-0">
            <iframe
              src={fileUrl}
              className="w-full h-full rounded-lg border border-gray-200"
              title="PDF Viewer"
            />
          </div>
        ) : (
          <div className={`overflow-y-auto flex-1 p-6 rounded-lg shadow-inner ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </div>
    </div>
  );
};

export default FileViewer;
