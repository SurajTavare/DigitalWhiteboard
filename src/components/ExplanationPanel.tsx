import React from 'react';
import { X } from 'lucide-react';
import { DiagramSuggestion } from '../types';

interface ExplanationPanelProps {
  diagram: DiagramSuggestion;
  onClose: () => void;
}

const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ diagram, onClose }) => {
  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{diagram.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600">{diagram.description}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {diagram.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-purple-50 text-purple-600 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {diagram.explanation.map((section, index) => (
          <div key={index}>
            <h3 className="font-medium text-gray-800 mb-2">{section.title}</h3>
            <ul className="space-y-2">
              {section.content.map((item, itemIndex) => (
                <li key={itemIndex} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-purple-500">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="text-sm text-gray-500 pt-4 border-t border-gray-100">
          <p className="mb-2">Tips:</p>
          <ul className="space-y-1">
            <li>• Double-click shapes to edit text</li>
            <li>• Drag connection points to curve lines</li>
            <li>• Use the toolbar to customize styles</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExplanationPanel;