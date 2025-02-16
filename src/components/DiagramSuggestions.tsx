import React, { useState } from 'react';
import { DiagramSuggestion, Shape, Connection } from '../types';
import { Sparkles, X, Search, Loader2, Info } from 'lucide-react';

interface DiagramSuggestionsProps {
  onClose: () => void;
  onSelect: (suggestion: DiagramSuggestion) => void;
}

const DiagramSuggestions: React.FC<DiagramSuggestionsProps> = ({
  onClose,
  onSelect,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedSuggestion, setGeneratedSuggestion] = useState<DiagramSuggestion | null>(null);

  const generateDiagram = async (promptText: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const words = promptText.toLowerCase().split(' ');
      const type = words.find(w => ['sequence', 'flow', 'class', 'er'].includes(w)) || '';
      
      if (!type) {
        throw new Error('Please specify a diagram type (sequence, flow, class, er)');
      }

      // Extract key components from the prompt
      const entities = extractEntities(promptText);
      if (entities.length === 0) {
        throw new Error('Could not identify any entities in the prompt. Please be more specific.');
      }

      const actions = extractActions(promptText);
      if (actions.length === 0) {
        throw new Error('Could not identify any actions or relationships. Please describe the interactions.');
      }

      // Generate diagram based on type
      const suggestion = generateDiagramByType(type, entities, actions);
      setGeneratedSuggestion(suggestion);
    } catch (error) {
      console.error('Error generating diagram:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate diagram');
    } finally {
      setIsLoading(false);
    }
  };

  const generateDiagramByType = (
    type: string,
    entities: string[],
    actions: string[]
  ): DiagramSuggestion => {
    const baseY = 100;
    const spacing = 200;

    switch (type) {
      case 'sequence': {
        const elements = entities.map((entity, index) => ({
          id: `entity-${index}`,
          type: 'rectangle' as const,
          position: { x: 100 + index * spacing, y: baseY },
          text: capitalizeFirstLetter(entity),
          borderColor: getEntityColor(index),
          width: 120,
          height: 60
        }));

        const connections = actions.map((action, index) => ({
          id: `conn-${index}`,
          from: `entity-${index % entities.length}`,
          to: `entity-${(index + 1) % entities.length}`,
          points: [],
          lineStyle: 'solid' as const,
          arrowStyle: 'end' as const
        }));

        return {
          title: `${capitalizeFirstLetter(entities[0])} Sequence Diagram`,
          description: `Sequence diagram showing the interaction between ${entities.join(', ')}`,
          explanation: [
            {
              title: "Participants",
              content: entities.map(entity => 
                `${capitalizeFirstLetter(entity)}: Main participant in the sequence`
              )
            },
            {
              title: "Flow",
              content: actions.map((action, index) => 
                `${index + 1}. ${capitalizeFirstLetter(action)}`
              )
            }
          ],
          category: "Sequence",
          tags: ["sequence", ...entities],
          elements,
          connections
        };
      }

      case 'flow': {
        const elements = entities.map((entity, index) => ({
          id: `entity-${index}`,
          type: index === 0 ? 'rectangle' as const :
                index === entities.length - 1 ? 'diamond' as const :
                'rectangle' as const,
          position: { 
            x: 300, 
            y: baseY + index * spacing 
          },
          text: capitalizeFirstLetter(entity),
          borderColor: getEntityColor(index),
          width: 120,
          height: index === entities.length - 1 ? 120 : 60
        }));

        const connections = entities.slice(0, -1).map((_, index) => ({
          id: `conn-${index}`,
          from: `entity-${index}`,
          to: `entity-${index + 1}`,
          points: [],
          lineStyle: 'solid' as const,
          arrowStyle: 'end' as const
        }));

        return {
          title: `${capitalizeFirstLetter(entities[0])} Flow Diagram`,
          description: `Flow diagram showing the process of ${entities.join(' → ')}`,
          explanation: [
            {
              title: "Steps",
              content: entities.map((entity, index) => 
                `${index + 1}. ${capitalizeFirstLetter(entity)}`
              )
            },
            {
              title: "Process Flow",
              content: actions.map((action, index) => 
                `${index + 1}. ${capitalizeFirstLetter(action)}`
              )
            }
          ],
          category: "Flow",
          tags: ["flowchart", "process", ...entities],
          elements,
          connections
        };
      }

      default:
        throw new Error(`Diagram type '${type}' is not yet supported`);
    }
  };

  const extractEntities = (text: string): string[] => {
    const words = text.toLowerCase().split(/[\s,]+/);
    const commonEntities = new Set([
      'user', 'system', 'server', 'database', 'client', 'service',
      'browser', 'api', 'cache', 'queue', 'worker', 'app', 'application',
      'customer', 'admin', 'payment', 'order', 'product', 'cart'
    ]);
    
    // First pass: direct matches
    let entities = words.filter(word => commonEntities.has(word));
    
    // Second pass: compound terms
    const compoundTerms = text.toLowerCase().match(/([a-z]+\s+[a-z]+)/g) || [];
    entities = [...entities, ...compoundTerms.filter(term => 
      term.split(' ').some(word => commonEntities.has(word))
    )];

    return Array.from(new Set(entities));
  };

  const extractActions = (text: string): string[] => {
    const sentences = text.split(/[.,;]/).map(s => s.trim());
    const verbs = new Set([
      'send', 'receive', 'process', 'validate', 'store', 'retrieve',
      'request', 'respond', 'check', 'verify', 'update', 'delete',
      'create', 'read', 'write', 'query', 'authenticate', 'authorize'
    ]);

    return sentences.filter(s => {
      const words = s.toLowerCase().split(' ');
      return words.some(w => verbs.has(w)) && 
             !words.includes('sequence') && 
             !words.includes('diagram');
    });
  };

  const getEntityColor = (index: number): string => {
    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#14B8A6'];
    return colors[index % colors.length];
  };

  const capitalizeFirstLetter = (text: string): string => {
    return text.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderExplanation = (explanation: { title: string; content: string[] }[]) => (
    <div className="mt-4 space-y-4">
      {explanation.map((section, index) => (
        <div key={index}>
          <h4 className="font-medium text-gray-700 mb-2">{section.title}</h4>
          <ul className="list-disc list-inside space-y-1">
            {section.content.map((item, itemIndex) => (
              <li key={itemIndex} className="text-sm text-gray-600">{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-5xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-semibold">AI Diagram Suggestions</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Try 'sequence diagram of user login process'"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && prompt.trim()) {
                  generateDiagram(prompt);
                }
              }}
            />
            <button
              onClick={() => generateDiagram(prompt)}
              disabled={!prompt.trim() || isLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Generate
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Supported types: sequence diagram, flow diagram
          </p>
          {error && (
            <div className="mt-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          <div className="grid grid-cols-3 gap-4">
            {generatedSuggestion && (
              <>
                <div className="col-span-2 border-2 border-purple-500 rounded-xl p-4 bg-purple-50">
                  <h3 className="text-lg font-medium mb-2">{generatedSuggestion.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{generatedSuggestion.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {generatedSuggestion.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => onSelect(generatedSuggestion)}
                    className="mt-4 w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Use This Diagram
                  </button>
                </div>
                <div className="border-l border-gray-200 pl-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-purple-500" />
                    <h3 className="font-medium text-gray-700">Diagram Explanation</h3>
                  </div>
                  {renderExplanation(generatedSuggestion.explanation)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagramSuggestions;