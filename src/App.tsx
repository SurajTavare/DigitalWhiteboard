import React, { useState, useEffect } from 'react';
import DiagramEditor from './components/DiagramEditor';
import ViewOnlyDiagram from './components/ViewOnlyDiagram';
import { supabase } from './lib/supabase';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagramData, setDiagramData] = useState<any>(null);
  const [isCollaborating, setIsCollaborating] = useState(false);

  useEffect(() => {
    const loadDiagram = async () => {
      try {
        // Get the share ID from the URL
        const path = window.location.pathname;
        const pathParts = path.split('/').filter(Boolean);
        const mode = pathParts[0]; // 'view' or 'collaborate'
        const shareId = pathParts[1];

        console.log('Loading diagram with shareId:', shareId);

        if (!shareId) {
          setLoading(false);
          return;
        }

        // Fetch the diagram data
        const { data: diagram, error } = await supabase
          .from('diagrams')
          .select('*')
          .eq('share_id', shareId)
          .single();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        if (diagram) {
          console.log('Loaded diagram:', diagram);
          
          // Ensure data structure is complete
          const diagramData = {
            id: diagram.id,
            shapes: diagram.data.shapes || [],
            connections: diagram.data.connections || [],
            drawings: diagram.data.drawings || [],
            backgroundColor: diagram.data.backgroundColor || '#FFFFFF',
            isPublic: diagram.is_public,
            shareId: diagram.share_id,
            owner_id: diagram.owner_id
          };

          setDiagramData(diagramData);
        } else {
          console.error('No diagram found for shareId:', shareId);
          setError('Diagram not found');
        }
      } catch (err) {
        console.error('Error loading diagram:', err);
        setError('Failed to load diagram');
      } finally {
        setLoading(false);
      }
    };

    // Check if we're in view or collaborate mode
    const path = window.location.pathname;
    const isViewOnly = path.startsWith('/view/');
    const isCollabMode = path.startsWith('/collaborate/');

    setIsCollaborating(isCollabMode);

    if (isViewOnly || isCollabMode) {
      loadDiagram();
    } else {
      setLoading(false);
    }
  }, []);

  // Get current mode from URL
  const path = window.location.pathname;
  const isViewOnly = path.startsWith('/view/');
  const isCollabMode = path.startsWith('/collaborate/');

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading diagram...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Unable to load diagram</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a 
            href="/"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Editor
          </a>
        </div>
      </div>
    );
  }

  if (isViewOnly && diagramData) {
    console.log('Rendering view-only diagram:', diagramData);
    return <ViewOnlyDiagram {...diagramData} />;
  }

  if (isCollabMode && diagramData) {
    console.log('Rendering collaborative diagram:', diagramData);
    return <DiagramEditor initialData={diagramData} isCollaborating={true} />;
  }

  return (
    <div className="w-full h-screen">
      <DiagramEditor />
    </div>
  );
}

export default App;