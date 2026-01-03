import React, { useState, useEffect } from 'react';
import { Transformation, TransformationType } from '../types.ts';
import { SparklesIcon } from './icons.tsx';

interface AiSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: Transformation[];
  onAddSuggestions: (suggestions: Transformation[]) => void;
  transformationLimit: number;
  currentTransformationCount: number;
}

const TRANSFORMATION_LABELS: Record<string, string> = {
    [TransformationType.DEDUPLICATE]: 'Deduplicate Rows',
    [TransformationType.CASE]: 'Change Case',
    [TransformationType.TRIM]: 'Trim Whitespace',
    [TransformationType.FIND_REPLACE]: 'Find & Replace',
    [TransformationType.MASK]: 'Mask PII',
    [TransformationType.VALIDATE_FORMAT]: 'Validate Format',
    [TransformationType.FUZZY_MATCH]: 'Fuzzy Matching',
    [TransformationType.ADVANCED_MASK]: 'Advanced Masking',
    [TransformationType.REGEX_VALIDATE]: 'Custom Regex Validation',
};

const AiSuggestionsModal: React.FC<AiSuggestionsModalProps> = ({
  isOpen,
  onClose,
  suggestions,
  onAddSuggestions,
  transformationLimit,
  currentTransformationCount,
}) => {
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
        // Pre-select suggestions that can fit within the limit
        const availableSlots = transformationLimit - currentTransformationCount;
        const preselected = suggestions.slice(0, availableSlots).map(s => s.id);
        setSelectedSuggestionIds(preselected);
    }
  }, [isOpen, suggestions, transformationLimit, currentTransformationCount]);

  if (!isOpen) return null;

  const handleToggleSelection = (id: string) => {
    setSelectedSuggestionIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleAddClick = () => {
    const toAdd = suggestions.filter(s => selectedSuggestionIds.includes(s.id));
    onAddSuggestions(toAdd);
    onClose();
  };

  const availableSlots = transformationLimit - currentTransformationCount;
  const canAddCount = Math.min(selectedSuggestionIds.length, availableSlots);

  const renderSuggestionDetails = (t: Transformation) => {
    let details = `On column: ${t.column}`;
    if (t.options) {
        switch(t.type) {
            case TransformationType.CASE:
                details += ` to ${t.options.caseType}`;
                break;
            case TransformationType.FIND_REPLACE:
                details += ` (find '${t.options.find}', replace with '${t.options.replace}')`;
                break;
            case TransformationType.VALIDATE_FORMAT:
                details += ` (type: ${t.options.validationType}, ${t.options.removeInvalid ? 'remove invalid' : 'keep invalid'})`;
                break;
        }
    }
    return details;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 max-w-2xl w-full transform transition-all">
        <div className="flex justify-between items-start">
            <div className="flex items-center">
                <span className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mr-3 text-indigo-600 dark:text-indigo-300">
                    <SparklesIcon />
                </span>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">AI Suggestions for Cleansing</h2>
            </div>
            <button onClick={onClose} className="text-3xl font-light text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 leading-none">&times;</button>
        </div>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Our AI analyzed your data and found potential issues. Select the rules you'd like to apply.
        </p>

        <div className="mt-4 border-t border-b border-slate-200 dark:border-slate-700 max-h-80 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700">
          {suggestions.length > 0 ? (
            suggestions.map(suggestion => (
              <div key={suggestion.id} className="p-4 flex items-center hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <input
                  type="checkbox"
                  id={`suggestion-${suggestion.id}`}
                  checked={selectedSuggestionIds.includes(suggestion.id)}
                  onChange={() => handleToggleSelection(suggestion.id)}
                  className="h-5 w-5 rounded border-slate-300 dark:border-slate-500 text-indigo-600 focus:ring-indigo-500 bg-transparent dark:bg-slate-600"
                  aria-label={`Select suggestion: ${TRANSFORMATION_LABELS[suggestion.type]}`}
                />
                <label htmlFor={`suggestion-${suggestion.id}`} className="ml-3 text-sm flex-grow cursor-pointer">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{TRANSFORMATION_LABELS[suggestion.type] || suggestion.type}</span>
                  <p className="text-slate-500 dark:text-slate-400">{renderSuggestionDetails(suggestion)}</p>
                </label>
              </div>
            ))
          ) : (
            <p className="p-4 text-center text-slate-500 dark:text-slate-400">No specific issues found by AI. Your data looks clean!</p>
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {currentTransformationCount}/{transformationLimit} rules used. You can add {availableSlots} more.
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="py-2 px-4 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">
                Cancel
            </button>
            <button 
                onClick={handleAddClick} 
                disabled={canAddCount === 0}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
                Add {canAddCount > 0 ? `${canAddCount} Selected` : ''} Rule{canAddCount !== 1 && 's'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiSuggestionsModal;