import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Download } from 'lucide-react';
import mermaid from 'mermaid';

interface CodeToDiagramProps {
  onClose: () => void;
}

const CodeToDiagram: React.FC<CodeToDiagramProps> = ({ onClose }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    });
  }, []);

  const generateDiagram = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { svg } = await mermaid.render('diagram', code);
      setSvg(svg);
    } catch (err) {
      console.error('Error generating diagram:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate diagram');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!svg) return;

    // Create a Blob from the SVG data and generate a download link
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create an anchor element to trigger the download
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'diagram.svg'; // Set the filename for the download
    document.body.appendChild(downloadLink);
    downloadLink.click(); // Trigger the download
    document.body.removeChild(downloadLink);

    // Revoke the object URL to free up resources
    URL.revokeObjectURL(svgUrl);

    setShowExportMenu(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Convert Code to Diagram</h2>
          <div className="flex items-center gap-2">
            {svg && (
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  <span className="text-sm">Export</span>
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg py-1 min-w-[120px] border border-gray-200">
                    <button
                      onClick={handleExport}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      SVG File
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste your Mermaid code here
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 p-4 bg-gray-50 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-auto"
              placeholder={`graph TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    C --> D[Rethink]
    D --> B
    B ---->|No| E[End]`}
            />
          </div>

          <div className="flex flex-col">
            <div className="text-sm font-medium text-gray-700 mb-2">Preview</div>
            <div className="flex-1 bg-gray-50 rounded-lg p-4 overflow-auto max-h-[400px]"> {/* Decreased max-height */}
              {error ? (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              ) : svg ? (
                <div
                  ref={diagramRef}
                  className="bg-white p-4 rounded-lg shadow-sm"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  Your diagram will appear here
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed buttons at the bottom */}
        <div className="mt-auto flex justify-end gap-3 mt-4 pt-4 border-t pb-10"> {/* Added padding to bottom */}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={generateDiagram}
            disabled={!code.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            Generate Diagram
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeToDiagram;
