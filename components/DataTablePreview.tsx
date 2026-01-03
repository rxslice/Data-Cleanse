import React from 'react';
import { DataRow } from '../types.ts';

interface DataTablePreviewProps {
  headers: string[];
  data: DataRow[];
  totalRows: number;
  fileName: string;
}

const DataTablePreview: React.FC<DataTablePreviewProps> = ({ headers, data, totalRows, fileName }) => {
  return (
    <div className="w-full bg-white dark:bg-slate-800/50 p-4 sm:p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Data Preview</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Showing first {data.length} of {totalRows} rows from <span className="font-medium text-indigo-600 dark:text-indigo-400">{fileName}</span>.</p>
      </div>
      <div className="overflow-x-auto max-h-[60vh]">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                {headers.map((header, colIndex) => (
                  <td key={`${rowIndex}-${colIndex}`} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                    {String(row[header])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTablePreview;