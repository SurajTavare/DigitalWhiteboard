import React, { useState, useEffect, useRef } from "react";
import { X, Loader2, Download } from "lucide-react";
import pako from "pako"; // Ensure you have pako installed for proper DEFLATE compression

interface CodeToDiagramProps {
  onClose: () => void;
  initialCode?: string;
}

const CodeToDiagram: React.FC<CodeToDiagramProps> = ({
  onClose,
  initialCode = "",
}) => {
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCode) {
      generateDiagram();
    }
  }, []);

  const generateDiagram = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const plantUmlServer = "https://www.plantuml.com/plantuml/svg/";

      // Correctly encode the PlantUML code with DEFLATE compression and Base64
      const encoded = "~1" + encodePlantUmlCode(code);

      const response = await fetch(`${plantUmlServer}${encoded}`);

      if (!response.ok) {
        throw new Error(`Failed to generate diagram: ${response.statusText}`);
      }

      const svgText = await response.text();
      setSvg(svgText);
    } catch (err) {
      console.error("Error generating diagram:", err);
      setError(err instanceof Error ? err.message : "Failed to generate diagram");
    } finally {
      setIsLoading(false);
    }
  };

  // PlantUML encoding function using DEFLATE compression
  const encodePlantUmlCode = (text: string): string => {
    const utf8Encoded = new TextEncoder().encode(text);
    const compressed = pako.deflate(utf8Encoded, { level: 9 });
    return encode64(compressed);
  };

  // Base64 encoding specific to PlantUML
  const encode64 = (data: Uint8Array): string => {
    const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
    let result = "";
    let current = 0;
    let bits = 0;

    for (let i = 0; i < data.length; i++) {
      current = (current << 8) | data[i];
      bits += 8;
      while (bits >= 6) {
        bits -= 6;
        result += alphabet[(current >> bits) & 0x3F];
      }
    }

    if (bits > 0) {
      result += alphabet[(current << (6 - bits)) & 0x3F];
    }

    return result;
  };

  const handleExport = () => {
    if (!svg) return;

    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = "diagram.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

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
              Paste your PlantUML code here
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 p-4 bg-gray-50 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-auto"
              placeholder={`@startuml
Alice -> Bob: Authentication Request
Bob --> Alice: Authentication Response
@enduml`}
            />
          </div>

          <div className="flex flex-col">
            <div className="text-sm font-medium text-gray-700 mb-2">Preview</div>
            <div className="flex-1 bg-gray-50 rounded-lg p-4 overflow-auto max-h-[400px]">
              {error ? (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              ) : isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
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

        <div className="mt-auto flex justify-end gap-3 mt-4 pt-4 border-t pb-10">
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
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Generate Diagram
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeToDiagram;
