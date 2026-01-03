// public/data_processor.worker.ts

// Since this is a worker, it must be plain Javascript.
// TypeScript syntax has been removed.

// Fix: Wrap worker code in an IIFE to avoid global scope pollution and redeclaration errors.
(() => {
  const TransformationType = {
    DEDUPLICATE: 'deduplicate',
    CASE: 'case',
    TRIM: 'trim',
    FIND_REPLACE: 'find_replace',
    MASK: 'mask',
    VALIDATE_FORMAT: 'validate_format',
  };

  let fullData = [];

  // A simple but effective CSV parser
  function parseCSV(text) {
    const lines = text.trim().split('\n');
    const header = lines[0].split(',').map(h => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      // This is a simple parser, for robust parsing a library would be better
      // but this avoids dependencies. It doesn't handle commas within quotes.
      const values = lines[i].split(',');
      const row = {};
      for (let j = 0; j < header.length; j++) {
        row[header[j]] = values[j] ? values[j].trim() : '';
      }
      rows.push(row);
    }
    return rows;
  }

  function applyTransformations(transformations) {
    let data = [...fullData];
    const summary = {
      rowsRemoved: 0,
      cellsModified: 0,
    };

    transformations.forEach(t => {
      switch (t.type) {
        case TransformationType.DEDUPLICATE: {
          const seen = new Set();
          const initialCount = data.length;
          data = data.filter(row => {
            const value = row[t.column];
            if (seen.has(value)) {
              return false;
            }
            seen.add(value);
            return true;
          });
          summary.rowsRemoved += (initialCount - data.length);
          break;
        }
        case TransformationType.CASE: {
          data.forEach(row => {
            if (row[t.column]) {
              let original = row[t.column];
              switch (t.options.caseType) {
                case 'UPPERCASE': row[t.column] = original.toUpperCase(); break;
                case 'lowercase': row[t.column] = original.toLowerCase(); break;
                case 'Title Case': row[t.column] = original.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()); break;
              }
              if(original !== row[t.column]) summary.cellsModified++;
            }
          });
          break;
        }
        case TransformationType.TRIM: {
          data.forEach(row => {
              if (row[t.column] && typeof row[t.column] === 'string') {
                  let original = row[t.column];
                  row[t.column] = row[t.column].trim().replace(/\s+/g, ' ');
                  if(original !== row[t.column]) summary.cellsModified++;
              }
          });
          break;
        }
        case TransformationType.FIND_REPLACE: {
          const { find, replace } = t.options;
          if(find) {
              const regex = new RegExp(find, 'g');
              data.forEach(row => {
                  if (row[t.column] && typeof row[t.column] === 'string') {
                      let original = row[t.column];
                      row[t.column] = row[t.column].replace(regex, replace);
                      if(original !== row[t.column]) summary.cellsModified++;
                  }
              });
          }
          break;
        }
        case TransformationType.MASK: {
          data.forEach(row => {
              if (row[t.column] && typeof row[t.column] === 'string') {
                  let original = row[t.column];
                  const len = original.length;
                  if (len > 4) {
                      row[t.column] = original.substring(0, 4) + '*'.repeat(len - 4);
                  } else {
                      row[t.column] = '*'.repeat(len);
                  }
                  if(original !== row[t.column]) summary.cellsModified++;
              }
          });
          break;
        }
        case TransformationType.VALIDATE_FORMAT: {
          const initialCount = data.length;
          const { validationType, removeInvalid } = t.options;
          if (removeInvalid) {
              data = data.filter(row => {
                  const value = row[t.column];
                  if (validationType === 'isNumber') return !isNaN(parseFloat(value)) && isFinite(value);
                  if (validationType === 'containsAt') return typeof value === 'string' && value.includes('@');
                  return true;
              });
              summary.rowsRemoved += (initialCount - data.length);
          }
          break;
        }
      }
    });

    return { cleansedData: data, summary };
  }

  function dataToCsv(data) {
      if (data.length === 0) return "";
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      data.forEach(row => {
          const values = headers.map(header => {
              const escaped = ('' + row[header]).replace(/"/g, '""');
              return `"${escaped}"`;
          });
          csvRows.push(values.join(','));
      });
      return csvRows.join('\n');
  }


  self.onmessage = async (e) => {
    const { command, payload } = e.data;

    switch (command) {
      case 'parse': {
        try {
          const { file } = payload;
          const text = await file.text();
          
          let parsedData;
          if (file.type === 'application/json') {
            parsedData = JSON.parse(text);
          } else { // CSV, TSV
            parsedData = parseCSV(text);
          }
          
          fullData = parsedData;
          const headers = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
          const preview = parsedData.slice(0, 50);

          self.postMessage({ 
            type: 'parse_success', 
            payload: { headers, preview, totalRows: parsedData.length } 
          });

        } catch (error) {
          self.postMessage({ type: 'error', payload: 'Failed to parse file.' });
        }
        break;
      }
      case 'cleanse': {
          try {
              const { transformations } = payload;
              const { cleansedData, summary } = applyTransformations(transformations);

              // Create blobs for download
              const csvBlob = new Blob([dataToCsv(cleansedData)], { type: 'text/csv;charset=utf-8;' });
              const jsonBlob = new Blob([JSON.stringify(cleansedData, null, 2)], { type: 'application/json;charset=utf-8;' });
              
              self.postMessage({
                  type: 'cleanse_success',
                  payload: {
                      summary,
                      csvUrl: URL.createObjectURL(csvBlob),
                      jsonUrl: URL.createObjectURL(jsonBlob),
                      preview: cleansedData.slice(0, 50)
                  }
              });

          } catch (error) {
              self.postMessage({ type: 'error', payload: 'Failed to cleanse data.' });
          }
          break;
      }
    }
  };
})();
