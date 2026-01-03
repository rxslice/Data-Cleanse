
import { useState, useEffect, useRef } from 'react';
import { DataRow, CleanseSummary, ColumnProfile } from '../types.ts';

interface WorkerState {
  headers: string[];
  preview: DataRow[];
  profile: ColumnProfile[];
  totalRows: number;
  cleansedPreview: DataRow[];
  summary: CleanseSummary | null;
  downloadUrls: { csv: string; json: string } | null;
  error: string | null;
  isProcessing: boolean;
}

export const useDataWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const [workerState, setWorkerState] = useState<WorkerState>({
    headers: [],
    preview: [],
    profile: [],
    totalRows: 0,
    cleansedPreview: [],
    summary: null,
    downloadUrls: null,
    error: null,
    isProcessing: false,
  });

  useEffect(() => {
    let workerUrl: string | null = null;

    const initializeWorker = async () => {
        try {
            const response = await fetch('/data_processor.worker.js');
            if (!response.ok) {
                throw new Error(`Failed to fetch worker script: ${response.statusText}`);
            }
            const scriptText = await response.text();
            const blob = new Blob([scriptText], { type: 'application/javascript' });
            workerUrl = URL.createObjectURL(blob);
            
            workerRef.current = new Worker(workerUrl);

            const handleMessage = (event: MessageEvent) => {
              const { type, payload } = event.data;
              
              switch (type) {
                case 'parse_success':
                  setWorkerState(prev => ({
                    ...prev,
                    isProcessing: false,
                    error: null,
                    headers: payload.headers,
                    preview: payload.preview,
                    profile: payload.profile,
                    totalRows: payload.totalRows,
                    cleansedPreview: [],
                    summary: null,
                    downloadUrls: null,
                  }));
                  break;
                case 'cleanse_success':
                  setWorkerState(prev => ({
                    ...prev,
                    isProcessing: false,
                    error: null,
                    summary: payload.summary,
                    downloadUrls: { csv: payload.csvUrl, json: payload.jsonUrl },
                    cleansedPreview: payload.preview,
                  }));
                  break;
                case 'error':
                  setWorkerState(prev => ({ ...prev, isProcessing: false, error: payload }));
                  break;
              }
            };
            
            workerRef.current.onmessage = handleMessage;
            workerRef.current.onerror = (error) => {
                console.error("Worker error:", error);
                setWorkerState(prev => ({...prev, isProcessing: false, error: 'An error occurred in the data processing module.'}));
            };

        } catch (error) {
            console.error("Failed to initialize worker:", error);
            setWorkerState(prev => ({ ...prev, error: 'Could not load data processing module.' }));
        }
    };
    
    initializeWorker();
    
    return () => {
      workerRef.current?.terminate();
      if (workerUrl) {
        URL.revokeObjectURL(workerUrl);
      }
    };
  }, []);

  const postMessage = (command: string, payload: any) => {
    if (workerRef.current) {
      setWorkerState(prev => ({ ...prev, isProcessing: true, error: null }));
      workerRef.current.postMessage({ command, payload });
    } else {
        setWorkerState(prev => ({ ...prev, error: 'Data processor is not ready.' }));
    }
  };

  const resetState = () => {
      setWorkerState({
        headers: [],
        preview: [],
        profile: [],
        totalRows: 0,
        cleansedPreview: [],
        summary: null,
        downloadUrls: null,
        error: null,
        isProcessing: false,
      });
  }

  return { workerState, postMessage, resetState };
};
