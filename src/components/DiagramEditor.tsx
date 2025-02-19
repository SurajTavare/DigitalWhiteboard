import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Undo2, Redo2, Save, Upload, Share2, X } from 'lucide-react';
import { Shape, Connection, DiagramState, HistoryAction, ShapeType, DrawingPath, LineStyle, ArrowStyle } from '../types';
import ShapeComponent from './Shape';
import ConnectionComponent from './Connection';
import DrawingCanvas from './DrawingCanvas';
import Toolbar from './Toolbar';
import BackgroundColorPicker from './BackgroundColorPicker';
import ShareDialog from './ShareDialog';
import { supabase } from '../lib/supabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { v4 as uuidv4 } from 'uuid';

interface DiagramEditorProps {
  diagramId?: string;
  initialData?: any;
  isCollaborating?: boolean;
}

const DiagramEditor: React.FC<DiagramEditorProps> = ({
  diagramId,
  initialData,
  isCollaborating = false
}) => {
  const [shapes, setShapes] = useState<Shape[]>(initialData?.shapes || []);
  const [connections, setConnections] = useState<Connection[]>(initialData?.connections || []);
  const [drawings, setDrawings] = useState<DrawingPath[]>(initialData?.drawings || []);
  const [backgroundColor, setBackgroundColor] = useState(initialData?.backgroundColor || '#FFFFFF');
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [isEraserActive, setIsEraserActive] = useState(false);
  const [drawingHistory, setDrawingHistory] = useState<DrawingPath[][]>([[]]);
  const [drawingHistoryIndex, setDrawingHistoryIndex] = useState(0);
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showBackgroundColorPicker, setShowBackgroundColorPicker] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTip, setShowTip] = useState<string | null>(null);
  const tipTimeoutRef = useRef<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showAuthMessage, setShowAuthMessage] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const showFeatureTip = (tip: string) => {
    if (tipTimeoutRef.current) {
      window.clearTimeout(tipTimeoutRef.current);
    }
    setShowTip(tip);
    tipTimeoutRef.current = window.setTimeout(() => {
      setShowTip(null);
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (tipTimeoutRef.current) {
        window.clearTimeout(tipTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (diagramId) {
      loadDiagram(diagramId);
    }
  }, [diagramId]);

  const loadDiagram = async (id: string) => {
    try {
      const { data: diagram, error } = await supabase
        .from('diagrams')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (diagram) {
        if (!diagram.is_public && diagram.owner_id !== user?.id) {
          showFeatureTip("You don't have permission to view this diagram");
          return;
        }

        setShapes(diagram.data.shapes || []);
        setConnections(diagram.data.connections || []);
        setDrawings(diagram.data.drawings || []);
        setIsPublic(diagram.is_public);
        setCurrentDiagramId(diagram.id);
        setShareUrl(`${window.location.origin}/diagram/${diagram.share_id}`);
      }
    } catch (error) {
      console.error('Error loading diagram:', error);
      showFeatureTip("Failed to load diagram");
    }
  };

  const saveDiagram = async (name: string = 'Untitled Diagram') => {
    if (!user) {
      setShowAuthMessage(true);
      showFeatureTip("Please sign in to save and share diagrams");
      return;
    }

    try {
      const data: DiagramState = {
        shapes,
        connections,
        drawings
      };

      if (currentDiagramId) {
        const { error } = await supabase
          .from('diagrams')
          .update({
            data,
            updated_at: new Date().toISOString(),
            version: supabase.sql`version + 1`
          })
          .eq('id', currentDiagramId)
          .eq('owner_id', user.id);

        if (error) throw error;
        showFeatureTip("Diagram updated successfully!");
        setShowShareDialog(true);
      } else {
        const shareId = uuidv4();
        const { data: diagram, error } = await supabase
          .from('diagrams')
          .insert({
            name,
            data,
            owner_id: user.id,
            share_id: shareId,
            is_public: false
          })
          .select()
          .single();

        if (error) throw error;

        setCurrentDiagramId(diagram.id);
        const newShareUrl = `${window.location.origin}/diagram/${shareId}`;
        setShareUrl(newShareUrl);
        showFeatureTip("Diagram saved successfully! You can now share it.");
        setShowShareDialog(true);
      }
    } catch (error) {
      console.error('Error saving diagram:', error);
      showFeatureTip("Failed to save diagram. Please try again.");
    }
  };

  const handleTogglePublic = async (newIsPublic: boolean) => {
    if (!user) {
      setShowAuthMessage(true);
      showFeatureTip("Please sign in to change diagram visibility");
      return;
    }

    if (!currentDiagramId) {
      try {
        const name = 'Untitled Diagram';
        const shareId = uuidv4();
        const { data: diagram, error } = await supabase
          .from('diagrams')
          .insert({
            name,
            data: { shapes, connections, drawings },
            owner_id: user.id,
            share_id: shareId,
            is_public: newIsPublic
          })
          .select()
          .single();

        if (error) throw error;

        setCurrentDiagramId(diagram.id);
        const newShareUrl = `${window.location.origin}/diagram/${shareId}`;
        setShareUrl(newShareUrl);
        setIsPublic(newIsPublic);
        showFeatureTip("Diagram saved and made public successfully!");
      } catch (error) {
        console.error('Error saving diagram:', error);
        showFeatureTip("Failed to save diagram. Please try again.");
      }
    } else {
      try {
        const { error } = await supabase
          .from('diagrams')
          .update({ is_public: newIsPublic })
          .eq('id', currentDiagramId)
          .eq('owner_id', user.id);

        if (error) throw error;
        setIsPublic(newIsPublic);
        showFeatureTip(newIsPublic ? "Diagram is now public" : "Diagram is now private");
      } catch (error) {
        console.error('Error updating diagram visibility:', error);
        showFeatureTip("Failed to update diagram visibility");
      }
    }
  };

  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color);
  };

  const toggleBackgroundColorPicker = () => {
    setShowBackgroundColorPicker(!showBackgroundColorPicker);
  };

  const handleBorderWidthChange = (id: string, width: number) => {
    setShapes(prev => prev.map(shape =>
      shape.id === id ? { ...shape, borderWidth: width } : shape
    ));
  };

  const addToHistory = useCallback((action: HistoryAction) => {
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, action]);
    setHistoryIndex(historyIndex + 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex >= 0) {
      history[historyIndex].undo();
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      history[historyIndex + 1].redo();
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  const undoDrawing = useCallback(() => {
    if (drawingHistoryIndex > 0) {
      setDrawingHistoryIndex(drawingHistoryIndex - 1);
      setDrawings(drawingHistory[drawingHistoryIndex - 1]);
    }
  }, [drawingHistory, drawingHistoryIndex]);

  const redoDrawing = useCallback(() => {
    if (drawingHistoryIndex < drawingHistory.length - 1) {
      setDrawingHistoryIndex(drawingHistoryIndex + 1);
      setDrawings(drawingHistory[drawingHistoryIndex + 1]);
    }
  }, [drawingHistory, drawingHistoryIndex]);

  const calculateBoundingBox = () => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    shapes.forEach(shape => {
      const width = shape.width || (shape.type === 'text' ? 200 : 128);
      const height = shape.height || (shape.type === 'text' ? 100 : shape.type === 'rectangle' ? 80 : 128);

      minX = Math.min(minX, shape.position.x);
      minY = Math.min(minY, shape.position.y);
      maxX = Math.max(maxX, shape.position.x + width);
      maxY = Math.max(maxY, shape.position.y + height);

      if (shape.type === 'line' && shape.endPoint) {
        minX = Math.min(minX, shape.endPoint.x);
        minY = Math.min(minY, shape.endPoint.y);
        maxX = Math.max(maxX, shape.endPoint.x);
        maxY = Math.max(maxY, shape.endPoint.y);
      }
    });

    drawings.forEach(drawing => {
      drawing.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    const padding = 50;
    return {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      width: Math.min(maxX - minX + padding * 2, 5000),
      height: Math.min(maxY - minY + padding * 2, 5000)
    };
  };

  const handleExport = async (type: 'png' | 'pdf') => {
    if (!containerRef.current) return;

    try {
      const boundingBox = calculateBoundingBox();
      
      const exportContainer = containerRef.current.cloneNode(true) as HTMLElement;
      const toolbar = exportContainer.querySelector('[class*="absolute top-4 left-4"]');
      if (toolbar) toolbar.remove();

      exportContainer.style.backgroundColor = backgroundColor;
      exportContainer.style.width = `${boundingBox.width}px`;
      exportContainer.style.height = `${boundingBox.height}px`;
      exportContainer.style.position = 'fixed';
      exportContainer.style.top = '0';
      exportContainer.style.left = '0';
      exportContainer.style.zIndex = '-1000';
      exportContainer.style.transform = `translate(${-boundingBox.x}px, ${-boundingBox.y}px)`;
      exportContainer.style.overflow = 'hidden';
      document.body.appendChild(exportContainer);

      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(exportContainer, {
        backgroundColor: backgroundColor,
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        foreignObjectRendering: true,
        width: boundingBox.width,
        height: boundingBox.height,
        x: boundingBox.x,
        y: boundingBox.y
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

      document.body.removeChild(exportContainer);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export diagram. Please try again.');
    }
  };

  const handleAddShape = (type: ShapeType, position?: { x: number; y: number }) => {
    const defaultPosition = position || {
      x: Math.random() * (window.innerWidth - 400) + 240,
      y: Math.random() * (window.innerHeight - 200) + 100
    };

    const newShape: Shape = {
      id: `shape-${Date.now()}`,
      type,
      position: defaultPosition,
      text: type === 'text' ? 'Double click to edit' : `${type.charAt(0).toUpperCase() + type.slice(1)} ${shapes.length + 1}`,
      borderColor: '#666',
      borderWidth: 2,
      width: type === 'text' ? 200 : type === 'line' ? 0 : 128,
      height: type === 'text' ? 100 : type === 'line' ? 0 : type === 'rectangle' ? 80 : 128
    };

    if (type === 'line') {
      newShape.endPoint = {
        x: newShape.position.x + 100,
        y: newShape.position.y
      };
    }

    setShapes(prev => [...prev, newShape]);
    addToHistory({
      type: 'ADD_SHAPE',
      data: newShape,
      undo: () => setShapes(prev => prev.filter(s => s.id !== newShape.id)),
      redo: () => setShapes(prev => [...prev, newShape])
    });
  };

  const handleDrag = (id: string, position: { x: number; y: number }, isEndPoint?: boolean) => {
    setShapes(prev => prev.map(shape =>
      shape.id === id
        ? isEndPoint
          ? { ...shape, endPoint: position }
          : { ...shape, position }
        : shape
    ));
  };

  const handleSelect = (id: string) => {
    if (isConnecting) {
      if (connectionStart === null) {
        setConnectionStart(id);
      } else if (connectionStart !== id) {
        const newConnection: Connection = {
          id: `conn-${Date.now()}`,
          from: connectionStart,
          to: id,
          points: [],
          lineStyle: 'solid',
          arrowStyle: 'end'
        };
        
        setConnections(prev => [...prev, newConnection]);
        addToHistory({
          type: 'ADD_CONNECTION',
          data: newConnection,
          undo: () => setConnections(prev => prev.filter(c => c.id !== newConnection.id)),
          redo: () => setConnections(prev => [...prev, newConnection])
        });
        
        setConnectionStart(null);
        setIsConnecting(false);
      }
    } else {
      setSelectedShape(id);
      setSelectedConnection(null);
    }
  };

  const handleConnectionSelect = (id: string) => {
    setSelectedConnection(id);
    setSelectedShape(null);
  };

  const handleConnectionStyleChange = (id: string, lineStyle: LineStyle, arrowStyle: ArrowStyle) => {
    const connection = connections.find(c => c.id === id);
    if (connection) {
      const oldStyles = { lineStyle: connection.lineStyle, arrowStyle: connection.arrowStyle };
      setConnections(prev => prev.map(c =>
        c.id === id ? { ...c, lineStyle, arrowStyle } : c
      ));
      addToHistory({
        type: 'UPDATE_CONNECTION_STYLE',
        data: { id, oldStyles, newStyles: { lineStyle, arrowStyle } },
        undo: () => setConnections(prev => prev.map(c =>
          c.id === id ? { ...c, ...oldStyles } : c
        )),
        redo: () => setConnections(prev => prev.map(c =>
          c.id === id ? { ...c, lineStyle, arrowStyle } : c
        ))
      });
    }
  };

  const handleShapeColorChange = (id: string, color: string) => {
    const shape = shapes.find(s => s.id === id);
    if (shape) {
      const oldColor = shape.borderColor;
      setShapes(prev => prev.map(s =>
        s.id === id ? { ...s, borderColor: color } : s
      ));
      addToHistory({
        type: 'UPDATE_SHAPE_COLOR',
        data: { id, oldColor, newColor: color },
        undo: () => setShapes(prev => prev.map(s =>
          s.id === id ? { ...s, borderColor: oldColor } : s
        )),
        redo: () => setShapes(prev => prev.map(s =>
          s.id === id ? { ...s, borderColor: color } : s
        ))
      });
    }
  };

  const handleDrawingComplete = (path: DrawingPath) => {
    const newDrawings = [...drawings, path];
    setDrawings(newDrawings);
    
    const newHistory = drawingHistory.slice(0, drawingHistoryIndex + 1);
    newHistory.push(newDrawings);
    setDrawingHistory(newHistory);
    setDrawingHistoryIndex(drawingHistoryIndex + 1);
  };

  const handleErase = (pathIds: string[]) => {
    const newDrawings = drawings.filter(d => !pathIds.includes(d.id));
    setDrawings(newDrawings);
    
    const newHistory = drawingHistory.slice(0, drawingHistoryIndex + 1);
    newHistory.push(newDrawings);
    setDrawingHistory(newHistory);
    setDrawingHistoryIndex(drawingHistoryIndex + 1);
  };

  const handleStartConnection = () => {
    setIsConnecting(!isConnecting);
    setIsDrawing(false);
    setIsEraserActive(false);
  };

  const handleStartDrawing = () => {
    setIsDrawing(!isDrawing);
    setIsConnecting(false);
    setIsEraserActive(false);
  };

  const handleDelete = () => {
    if (selectedShape) {
      const shape = shapes.find(s => s.id === selectedShape);
      if (shape) {
        setShapes(prev => prev.filter(s => s.id !== selectedShape));
        setConnections(prev => prev.filter(c => c.from !== selectedShape && c.to !== selectedShape));
        addToHistory({
          type: 'DELETE_SHAPE',
          data: { shape, connections: connections.filter(c => c.from === selectedShape || c.to === selectedShape) },
          undo: () => {
            setShapes(prev => [...prev, shape]);
            setConnections(prev => [...prev, ...connections.filter(c => c.from === selectedShape || c.to === selectedShape)]);
          },
          redo: () => {
            setShapes(prev => prev.filter(s => s.id !== selectedShape));
            setConnections(prev => prev.filter(c => c.from !== selectedShape && c.to !== selectedShape));
          }
        });
      }
      setSelectedShape(null);
    } else if (selectedConnection) {
      const connection = connections.find(c => c.id === selectedConnection);
      if (connection) {
        setConnections(prev => prev.filter(c => c.id !== selectedConnection));
        addToHistory({
          type: 'DELETE_CONNECTION',
          data: connection,
          undo: () => setConnections(prev => [...prev, connection]),
          redo: () => setConnections(prev => prev.filter(c => c.id !== selectedConnection))
        });
      }
      setSelectedConnection(null);
    }
  };

  const handleTextEdit = (id: string, text: string) => {
    setShapes(prev => prev.map(shape =>
      shape.id === id ? { ...shape, text } : shape
    ));
  };

  const handleResizeShape = (id: string, width: number, height: number) => {
    setShapes(prev => prev.map(shape =>
      shape.id === id ? { ...shape, width, height } : shape
    ));
  };

  const handleSave = () => {
    const data: DiagramState = {
      shapes,
      connections,
      drawings
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data: DiagramState = JSON.parse(e.target?.result as string);
        setShapes(data.shapes || []);
        setConnections(data.connections || []);
        setDrawings(data.drawings || []);
        setHistory([]);
        setHistoryIndex(-1);
      } catch (error) {
        console.error('Failed to load diagram:', error);
        alert('Failed to load diagram. Please try again with a valid file.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearScreen = () => {
    const oldState = {
      shapes,
      connections,
      drawings,
      currentDiagramId,
      shareUrl,
      isPublic
    };

    setShapes([]);
    setConnections([]);
    setDrawings([]);
    setSelectedShape(null);
    setSelectedConnection(null);
    setCurrentDiagramId(null);
    setShareUrl('');
    setIsPublic(false);
    
    addToHistory({
      type: 'CLEAR_SCREEN',
      data: oldState,
      undo: () => {
        setShapes(oldState.shapes);
        setConnections(oldState.connections);
        setDrawings(oldState.drawings);
        setCurrentDiagramId(oldState.currentDiagramId);
        setShareUrl(oldState.shareUrl);
        setIsPublic(oldState.isPublic);
      },
      redo: () => {
        setShapes([]);
        setConnections([]);
        setDrawings([]);
        setCurrentDiagramId(null);
        setShareUrl('');
        setIsPublic(false);
      }
    });
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col overflow-hidden">
      <div className="bg-white p-4 shadow-md flex gap-4">
        <button
          onClick={undo}
          className="p-2 rounded hover:bg-gray-100"
          disabled={historyIndex < 0}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button
          onClick={redo}
          className="p-2 rounded hover:bg-gray-100"
          disabled={historyIndex >= history.length - 1}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-5 h-5" />
        </button>
        <button
          onClick={handleSave}
          className="p-2 rounded hover:bg-gray-100"
          title="Save diagram"
        >
          <Save className="w-5 h-5" />
        </button>
        <label className="p-2 rounded hover:bg-gray-100 cursor-pointer" title="Load diagram">
          <Upload className="w-5 h-5" />
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleLoad}
          />
        </label>
        <button
          onClick={() => setShowShareDialog(true)}
          className="p-2 rounded hover:bg-gray-100"
          title="Share diagram"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 relative overflow-auto">
        <div
          ref={containerRef}
          className="absolute inset-0 diagram-canvas"
          style={{ backgroundColor }}
          onClick={() => {
            setSelectedShape(null);
            setSelectedConnection(null);
            if (isConnecting) {
              setIsConnecting(false);
              setConnectionStart(null);
            }
          }}
        >
          {showTip && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-black/75 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
              {showTip}
            </div>
          )}

          {showAuthMessage && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
              <p className="text-sm">Please sign in to save and share diagrams</p>
              <button
                onClick={() => setShowAuthMessage(false)}
                className="absolute -top-2 -right-2 bg-blue-600 rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <Toolbar
            onAddShape={handleAddShape}
            onStartConnection={handleStartConnection}
            onStartDrawing={handleStartDrawing}
            onDelete={handleDelete}
            onExport={handleExport}
            isConnecting={isConnecting}
            isDrawing={isDrawing}
            onToggleEraser={() => setIsEraserActive(!isEraserActive)}
            isEraserActive={isEraserActive}
            onToggleBackgroundColorPicker={toggleBackgroundColorPicker}
            onShowTip={showFeatureTip}
            onClearScreen={handleClearScreen}
          />

          {showBackgroundColorPicker && (
            <BackgroundColorPicker 
              onColorChange={handleBackgroundColorChange}
              onClose={() => setShowBackgroundColorPicker(false)}
            />
          )}

          {connections.map(connection => (
            <ConnectionComponent
              key={connection.id}
              connection={connection}
              shapes={shapes}
              isSelected={selectedConnection === connection.id}
              onSelect={handleConnectionSelect}
              onStyleChange={handleConnectionStyleChange}
            />
          ))}

          {shapes.map(shape => (
            <ShapeComponent
              key={shape.id}
              shape={shape}
              onDrag={handleDrag}
              onSelect={handleSelect}
              onTextEdit={handleTextEdit}
              onResize={handleResizeShape}
              onColorChange={handleShapeColorChange}
              onBorderWidthChange={handleBorderWidthChange}
              isSelected={selectedShape === shape.id}
              isEditing={isEditing && selectedShape === shape.id}
              setIsEditing={setIsEditing}
            />
          ))}

          <DrawingCanvas
            isDrawing={isDrawing}
            isEraserActive={isEraserActive}
            drawings={drawings}
            onDrawingComplete={handleDrawingComplete}
            onErase={handleErase}
            onUndo={undoDrawing}
            onRedo={redoDrawing}
          />

          {showShareDialog && (
            <ShareDialog
              shareUrl={shareUrl}
              isPublic={isPublic}
              onTogglePublic={handleTogglePublic}
              onClose={() => setShowShareDialog(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagramEditor;