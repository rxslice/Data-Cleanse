import React from 'react';
import { CheckCircleIcon, LockClosedIcon, SparklesIcon } from './icons.tsx';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProModal: React.FC<ProModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 max-w-lg w-full transform transition-all">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
             <span className="p-2 bg-yellow-400 rounded-full mr-4">
                <SparklesIcon />
            </span>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Upgrade to DataCleanse Pro</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">&times;</button>
        </div>

        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Unlock the full potential of DataCleanse for professional-grade data preparation. Go beyond the limits and supercharge your workflow.
        </p>

        <div className="mt-6 space-y-4">
          <div className="flex items-start">
            <CheckCircleIcon />
            <div className="ml-3">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200">100MB+ File Processing</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Cleanse massive datasets without breaking a sweat. Perfect for professionals.</p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircleIcon />
            <div className="ml-3">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200">Advanced Deduplication</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Unlock Fuzzy Matching to find and remove near-duplicates and typos.</p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircleIcon />
            <div className="ml-3">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200">Custom Regex Validation</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Define your own complex validation rules to ensure data integrity.</p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircleIcon />
            <div className="ml-3">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200">Advanced Masking & Hashing</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Securely mask PII with advanced patterns or SHA-256 hashing.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
            Upgrade for $25/Month
          </button>
          <button onClick={onClose} className="mt-2 text-sm text-slate-500 dark:text-slate-400 hover:underline">
            Continue with Free
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProModal;