import React, { useState, useRef, useEffect } from 'react';
import {   Square,   Circle,   Diamond,   Link as Line, Trash2,   Pen,   Download,   Type,   Eraser,   PaintBucket,   X,  FileText,  Sparkles,  Code,  HelpCircle,   Trash } from 'lucide-react';
import FileViewer from './FileViewer';
// import DiagramSuggestions from './DiagramSuggestions';
import CodeToDiagram from './CodeToDiagram';
import AIMermaidGenerator from './AIMermaidGenerator';
import { DiagramSuggestion } from '../types';

interface ToolbarProps {
  onAddShape: (type: 'rectangle' | 'circle' | 'diamond' | 'square' | 'text' | 'line', position?: { x: number, y: number }) => void;
  onStartConnection: () => void;
  onStartDrawing: () => void;
  onDelete: () => void;
  onExport: (type: 'png' | 'pdf') => void;
  isConnecting: boolean;
  isDrawing: boolean;
  onToggleEraser: () => void;
  isEraserActive: boolean;
  onToggleBackgroundColorPicker: () => void;
  onShowTip: (tip: string) => void;
  // onApplySuggestion: (suggestion: DiagramSuggestion) => void;
  onClearScreen: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAddShape,
  onStartConnection,
  onStartDrawing,
  onDelete,
  onExport,
  isConnecting,
  isDrawing,
  onToggleEraser,
  isEraserActive,
  onToggleBackgroundColorPicker,
  onShowTip,
  // onApplySuggestion,
  onClearScreen
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCodeHints, setShowCodeHints] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
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

  const handleAddShapeWithTip = (type: 'rectangle' | 'circle' | 'diamond' | 'square' | 'text' | 'line') => {
    const toolbarWidth = 240;
    const padding = 20;
    const x = toolbarWidth + padding + Math.random() * (window.innerWidth - toolbarWidth - 200 - padding * 2);
    const y = 100 + Math.random() * (window.innerHeight - 200);
    
    onAddShape(type, { x, y });
    onShowTip(`Double-click to edit text. Drag to move. Click and drag corners to resize.`);
  };

  const handleStartConnectionWithTip = () => {
    onStartConnection();
    if (!isConnecting) {
      onShowTip("Click on a shape to start the connection, then click on another shape to complete it");
    }
  };

  const handleStartDrawingWithTip = () => {
    onStartDrawing();
    if (!isDrawing) {
      onShowTip("Click and drag to draw freely. Use Ctrl+Z to undo and Ctrl+Shift+Z to redo");
    }
  };

  const handleToggleEraserWithTip = () => {
    onToggleEraser();
    if (!isEraserActive) {
      onShowTip("Click on drawings to erase them");
    }
  };

  const handleExport = (type: 'png' | 'pdf') => {
    onExport(type);
    setIsExportOpen(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileType = file.type;
      if (
        fileType === 'application/pdf' ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'text/plain'
      ) {
        setSelectedFile(file);
      } else {
        alert('Unsupported file type. Please select a PDF, DOCX, or TXT file.');
      }
    }
  };

  return (
    <>
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg z-20 border border-gray-200">
        <div className="p-3 space-y-2">
          <button
            onClick={() => setShowAIGenerator(true)}
            className="w-full p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity mb-2"
            title="Generate PlantUML with AI"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-sm">AI Diagram</span>
          </button>

          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 rounded-lg mb-2">
            <button 
              onClick={() => handleAddShapeWithTip('rectangle')} 
              className="p-2 hover:bg-white rounded-lg transition-all" 
              title="Add Rectangle - Double-click to edit text"
            >
              <Square className="w-6 h-6 rotate-90" strokeWidth={1.5} />
            </button>
            <button 
              onClick={() => handleAddShapeWithTip('square')} 
              className="p-2 hover:bg-white rounded-lg transition-all" 
              title="Add Square - Double-click to edit text"
            >
              <Square className="w-6 h-6" strokeWidth={2} />
            </button>
            <button 
              onClick={() => handleAddShapeWithTip('circle')} 
              className="p-2 hover:bg-white rounded-lg transition-all" 
              title="Add Circle - Double-click to edit text"
            >
              <Circle className="w-6 h-6" />
            </button>
            <button 
              onClick={() => handleAddShapeWithTip('diamond')} 
              className="p-2 hover:bg-white rounded-lg transition-all" 
              title="Add Diamond - Double-click to edit text"
            >
              <div className="w-6 h-6 border-2 border-current rotate-45 transform origin-center" />
            </button>
            <button 
              onClick={() => handleAddShapeWithTip('line')} 
              className="p-2 hover:bg-white rounded-lg transition-all col-span-2" 
              title="Add Line - Drag endpoints to adjust, double-click to curve"
            >
              <div className="w-full h-0.5 bg-current" />
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setShowCodeEditor(true)}
              className="w-full p-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-all"
              title="Convert code to diagram"
            >
              <Code className="w-5 h-5" />
              <span className="text-sm">Code to Diagram</span>
            </button>

            <button
              onClick={() => setShowCodeHints(true)}
              className="w-full p-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-all"
              title="View Code Hints"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="text-sm">Code Hints</span>
            </button>

            <button 
              onClick={() => handleAddShapeWithTip('text')} 
              className="w-full p-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-all" 
              title="Add Text Box - Double-click to edit"
            >
              <Type className="w-5 h-5" />
              <span className="text-sm">Text</span>
            </button>
            <button 
              onClick={handleStartConnectionWithTip} 
              className={`w-full p-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-all ${isConnecting ? 'bg-blue-50 text-blue-600' : ''}`} 
              title="Connect Shapes - Click two shapes to connect them"
            >
              <Line className="w-5 h-5" />
              <span className="text-sm">Connect</span>
            </button>
            <button 
              onClick={handleStartDrawingWithTip} 
              className={`w-full p-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-all ${isDrawing ? 'bg-blue-50 text-blue-600' : ''}`} 
              title="Draw - Click and drag to draw freely"
            >
              <Pen className="w-5 h-5" />
              <span className="text-sm">Draw</span>
            </button>
            <button 
              onClick={handleToggleEraserWithTip} 
              className={`w-full p-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-all ${isEraserActive ? 'bg-blue-50 text-blue-600' : ''}`} 
              title="Eraser - Click on drawings to erase them"
            >
              <Eraser className="w-5 h-5" />
              <span className="text-sm">Erase</span>
            </button>
          </div>

          <div className="h-px bg-gray-200 my-1"></div>

          <button onClick={onToggleBackgroundColorPicker} className="w-full p-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-all" title="Change Background Color">
            <PaintBucket className="w-5 h-5" />
            <span className="text-sm">Background</span>
          </button>

          <label className="w-full p-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-all cursor-pointer" title="Open File">
            <FileText className="w-5 h-5" />
            <span className="text-sm">Open File</span>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>

          <div className="relative" ref={exportRef}>
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)} 
              className="w-full p-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-all" 
              title="Export Diagram"
            >
              <Download className="w-5 h-5" />
              <span className="text-sm">Export</span>
            </button>
            {isExportOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-2 min-w-[120px] border border-gray-200">
                <button 
                  onClick={() => handleExport('png')} 
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm transition-colors"
                >
                  PNG Image
                </button>
                <button 
                  onClick={() => handleExport('pdf')} 
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm transition-colors"
                >
                  PDF Document
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 border-t border-gray-100">
          <button onClick={onDelete} className="w-full p-2 hover:bg-red-50 rounded-lg flex items-center gap-2 text-red-600 transition-all" title="Delete Selected">
            <Trash2 className="w-5 h-5" />
            <span className="text-sm">Delete</span>
          </button>
        </div>

        <button
          onClick={onClearScreen}
          className="w-full p-2 hover:bg-red-50 rounded-lg flex items-center gap-2 text-red-600 transition-all"
          title="Clear Screen"
        >
          <Trash className="w-5 h-5" />
          <span className="text-sm">Clear Screen</span>
        </button>
      </div>

      {/* {showSuggestions && (
        <DiagramSuggestions
          onClose={() => setShowSuggestions(false)}
          onSelect={(suggestion) => {
            onApplySuggestion(suggestion);
            setShowSuggestions(false);
          }}
        />
      )} */}

      {selectedFile && (
        <FileViewer
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}

      {showCodeHints && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">PlantUML Code Hints</h2>
              <button
                onClick={() => setShowCodeHints(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 overflow-y-auto custom-scrollbar">
              <div>
                <h3 className="font-medium mb-2">*Sequence Diagram</h3>
                <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
                  {`@startuml
Alice -> Bob: Authentication Request
Bob --> Alice: Authentication Response

Alice -> Bob: Another authentication Request
Alice <-- Bob: Another authentication Response
@enduml`}
                </pre>
                <br></br>
                <br></br>
                <pre>
                {`explanation:-
• @startuml and @enduml mark the beginning and end
• -> creates a solid arrow
• --> creates a dashed arrow
• : adds message text`}
                </pre>
              </div>
              <br></br>
              <br></br>
              <br></br>
              <div>
                <h3 className="font-medium mb-2">*Use Case Diagram</h3>
                <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
                  {`@startuml
left to right direction
actor Customer
actor Clerk
rectangle Checkout {
  Customer -- (Checkout)
  (Checkout) .> (Payment) : include
  (Help) .> (Checkout) : extends
  (Checkout) -- Clerk
}
@enduml`}
                </pre>
                <br></br>
                <br></br>
                <pre>
                {`explanation: 
• actor defines a person/system
• rectangle creates a boundary
• -- creates a solid line connection
• .> creates a dashed arrow
• : include/extends shows relationships`
    }
                </pre>
              </div>
              <br></br>
              <br></br>
              <br></br>


              <div>
                <h3 className="font-medium mb-2">*Class Diagram</h3>
                <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
                  {`@startuml
class Animal {
  +int age
  +String gender
  +isMammal()
  +mate()
}

class Duck {
  +String beakColor
  +swim()
  +quack()
}

class Fish {
  -int sizeInFeet
  -canEat()
}

Animal <|-- Duck
Animal <|-- Fish
@enduml`}
                </pre>
                <br></br>
                <br></br>
                <pre>
                {`explanation: 
• class defines a new class
• + indicates public members
• - indicates private members
• <|-- shows inheritance`}
                </pre>
              </div>
              <br></br>
              <br></br>
              <br></br>

              <div>
                <h3 className="font-medium mb-2">*Activity Diagram</h3>
                <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
                  {`@startuml
start
:Initialize Process;
if (Data Available?) then (yes)
  :Process Data;
  if (Is Valid?) then (yes)
    :Save Results;
  else (no)
    :Log Error;
  endif
else (no)
  :Wait for Data;
endif
:Cleanup;
stop
@enduml`}
                </pre>
                <br></br>
                <br></br>
                <pre>
                  {`explanation: 
• start/stop mark beginning and end
• : defines an activity
• if/else/endif create decision points
• (label) adds text to branches`}
                </pre>
              </div>
              <br></br>
              <br></br>
              <br></br>

              <div>
                <h3 className="font-medium mb-2">*Component Diagram</h3>
                <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
                  {`@startuml
package "Frontend" {
  [Web UI]
  [Mobile App]
}

package "Backend" {
  [API Gateway]
  [User Service]
  [Payment Service]
  database "User DB"
  database "Payment DB"
}

[Web UI] --> [API Gateway]
[Mobile App] --> [API Gateway]
[API Gateway] --> [User Service]
[API Gateway] --> [Payment Service]
[User Service] --> [User DB]
[Payment Service] --> [Payment DB]
@enduml`}
                </pre>
                <br></br>
                <br></br>
                <pre>
                  {`explanation: 
• package groups related components
• [Component] defines a component
• database defines a database
• --> creates connections between components`}
                </pre>
              </div>
                    <br></br>
                    <br></br>
                    <br></br>

              <div>
                <h3 className="font-medium mb-2">*State Diagram</h3>
                <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
                  {`@startuml
[*] --> Idle
Idle --> Processing : Start
Processing --> Completed : Success
Processing --> Failed : Error
Completed --> [*]
Failed --> Idle : Retry
@enduml`}
                </pre>
                <br></br>
                <br></br>
                <pre>
                  {`explanation: 
• [*] represents start/end state
• --> creates transitions
• : adds transition label
• States can have internal actions using : notation`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCodeEditor && (
        <CodeToDiagram
          onClose={() => setShowCodeEditor(false)}
        />
      )}

      {showAIGenerator && (
        <AIMermaidGenerator
          onClose={() => setShowAIGenerator(false)}
        />
      )}
    </>
  );
};

export default Toolbar;