import React, { useState, useEffect } from 'react';
import { X, Loader2, Copy } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import CodeToDiagram from './CodeToDiagram'; // Import the CodeToDiagram component

const GOOGLE_AI_API_KEY = import.meta.env?.VITE_GOOGLE_AI_API_KEY;

interface AIPlantUMLGeneratorProps {
  onClose: () => void;
  apiKey?: string;
}

const AIPlantUMLGenerator: React.FC<AIPlantUMLGeneratorProps> = ({ onClose, apiKey }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCodeToDiagram, setShowCodeToDiagram] = useState(false);

  const effectiveApiKey = apiKey || GOOGLE_AI_API_KEY;

  const generatePlantUMLCode = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedCode('');

    try {
      if (!effectiveApiKey) {
        throw new Error('Google AI API key is not configured. Please add it to your .env file or pass it as a prop.');
      }

      const genAI = new GoogleGenerativeAI(effectiveApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const systemPrompt = "You are a diagram expert specializing in PlantUML syntax. Generate valid, well-structured PlantUML code based on user requests. Only respond with the code, no explanations or markdown formatting.";
      
      const chatSession = model.startChat({
        history: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "I'll generate clean PlantUML code based on your requests. I'll provide only the code without any explanations or markdown formatting." }] }
        ]
      });

      const result = await chatSession.sendMessage(
        `Generate PlantUML code for: ${prompt}`
      );
      
      const generatedPlantUMLCode = result.response.text().trim();
      const cleanCode = generatedPlantUMLCode.replace(/```plantuml/g, '').replace(/```/g, '').trim();
      
      setGeneratedCode(cleanCode);
    } catch (err) {
      console.error('Error generating PlantUML code:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PlantUML code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToEditor = () => {
    setShowCodeToDiagram(true);
  };

  const handleCodeToDiagramClose = () => {
    setShowCodeToDiagram(false);
    onClose();
  };

  if (showCodeToDiagram) {
    return <CodeToDiagram onClose={handleCodeToDiagramClose} initialCode={generatedCode} />;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">AI PlantUML Generator</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Describe the diagram you want to create
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Class diagram for a banking system with accounts, transactions, and customers"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && generatePlantUMLCode()}
            />
            <button
              onClick={generatePlantUMLCode}
              disabled={isLoading || !prompt.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Generate
            </button>
          </div>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-700">Generated PlantUML Code</h3>
            {generatedCode && (
              <button onClick={handleCopyCode} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 flex items-center gap-1 text-xs">
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg p-4 overflow-y-auto" style={{ maxHeight: "calc(100% - 40px)" }}>
            {error ? (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
            ) : isLoading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : generatedCode ? (
              <pre className="text-sm font-mono whitespace-pre-wrap">{generatedCode}</pre>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Generated code will appear here</div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
          {generatedCode && (
            <button onClick={handleSaveToEditor} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Use in Editor</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIPlantUMLGenerator;
