
const TransformationType = {
  DEDUPLICATE: 'deduplicate',
  CASE: 'case',
  TRIM: 'trim',
  FIND_REPLACE: 'find_replace',
  MASK: 'mask',
  VALIDATE_FORMAT: 'validate_format',
};

let fullData = [];

function parseCSV(text) {
  const lines = [];
  let currentLine = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      currentLine.push(currentField.trim());
      if (currentLine.length > 0 || currentField !== '') {
        lines.push(currentLine);
      }
      currentLine = [];
      currentField = '';
      if (char === '\r' && nextChar === '\n') i++;
    } else {
      currentField += char;
    }
  }
  
  if (currentField !== '' || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    lines.push(currentLine);
  }

  if (lines.length === 0) return [];
  
  const header = lines[0];
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const row = {};
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = lines[i][j] || '';
    }
    rows.push(row);
  }
  return rows;
}

function getColumnProfile(data, headers) {
  return headers.map(header => {
    const values = data.map(row => row[header]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
    const uniqueValues = new Set(nonNullValues);
    
    // Distribution Analysis
    const counts = {};
    nonNullValues.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    const distribution = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([val, count]) => ({ 
        value: String(val).length > 20 ? String(val).substring(0, 17) + '...' : val, 
        percentage: (count / data.length) * 100 
      }));

    let type = 'string';
    if (nonNullValues.length > 0) {
      const first = nonNullValues[0];
      if (!isNaN(parseFloat(first)) && isFinite(first)) type = 'number';
      else if (['true', 'false', true, false].includes(first)) type = 'boolean';
    }

    return {
      name: header,
      type,
      uniqueCount: uniqueValues.size,
      nullCount: data.length - nonNullValues.length,
      sampleValues: Array.from(uniqueValues).slice(0, 5),
      distribution
    };
  });
}

function applyTransformations(transformations) {
  let data = JSON.parse(JSON.stringify(fullData));
  const summary = {
    rowsRemoved: 0,
    cellsModified: 0,
    originalRowCount: fullData.length,
    finalRowCount: 0
  };

  transformations.forEach(t => {
    switch (t.type) {
      case TransformationType.DEDUPLICATE: {
        const seen = new Set();
        const initialCount = data.length;
        data = data.filter(row => {
          const val = String(row[t.column]);
          if (seen.has(val)) return false;
          seen.add(val);
          return true;
        });
        summary.rowsRemoved += (initialCount - data.length);
        break;
      }
      case TransformationType.CASE: {
        data.forEach(row => {
          if (row[t.column]) {
            let orig = String(row[t.column]);
            let mod = orig;
            switch (t.options.caseType) {
              case 'UPPERCASE': mod = orig.toUpperCase(); break;
              case 'lowercase': mod = orig.toLowerCase(); break;
              case 'Title Case': mod = orig.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()); break;
            }
            if(orig !== mod) { row[t.column] = mod; summary.cellsModified++; }
          }
        });
        break;
      }
      case TransformationType.TRIM: {
        data.forEach(row => {
          if (row[t.column]) {
            let orig = String(row[t.column]);
            let mod = orig.trim().replace(/\s+/g, ' ');
            if(orig !== mod) { row[t.column] = mod; summary.cellsModified++; }
          }
        });
        break;
      }
      case TransformationType.FIND_REPLACE: {
        const { find, replace } = t.options;
        if(find !== undefined) {
          const regex = new RegExp(find, 'g');
          data.forEach(row => {
            if (row[t.column]) {
              let orig = String(row[t.column]);
              let mod = orig.replace(regex, replace || '');
              if(orig !== mod) { row[t.column] = mod; summary.cellsModified++; }
            }
          });
        }
        break;
      }
      case TransformationType.MASK: {
        data.forEach(row => {
          if (row[t.column]) {
            let orig = String(row[t.column]);
            const len = orig.length;
            row[t.column] = len > 4 ? orig.substring(0, 4) + '*'.repeat(len - 4) : '*'.repeat(len);
            summary.cellsModified++;
          }
        });
        break;
      }
      case TransformationType.VALIDATE_FORMAT: {
        const initialCount = data.length;
        const { validationType, removeInvalid } = t.options;
        if (removeInvalid) {
          data = data.filter(row => {
            const val = String(row[t.column]);
            if (validationType === 'isNumber') return !isNaN(parseFloat(val)) && isFinite(val);
            if (validationType === 'containsAt') return val.includes('@');
            return true;
          });
          summary.rowsRemoved += (initialCount - data.length);
        }
        break;
      }
    }
  });

  summary.finalRowCount = data.length;
  return { cleansedData: data, summary };
}

function dataToCsv(data) {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = [headers.join(',')];
  data.forEach(row => {
    rows.push(headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(','));
  });
  return rows.join('\n');
}

self.onmessage = async (e) => {
  const { command, payload } = e.data;
  switch (command) {
    case 'parse':
      try {
        const text = await payload.file.text();
        const parsedData = payload.file.type === 'application/json' ? JSON.parse(text) : parseCSV(text);
        fullData = parsedData;
        const headers = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
        const profile = getColumnProfile(parsedData, headers);
        self.postMessage({ type: 'parse_success', payload: { headers, preview: parsedData.slice(0, 50), profile, totalRows: parsedData.length } });
      } catch (err) { self.postMessage({ type: 'error', payload: 'Engine Error: ' + err.message }); }
      break;
    case 'cleanse':
      try {
        const { cleansedData, summary } = applyTransformations(payload.transformations);
        self.postMessage({
          type: 'cleanse_success',
          payload: {
            summary,
            csvUrl: URL.createObjectURL(new Blob([dataToCsv(cleansedData)], { type: 'text/csv' })),
            jsonUrl: URL.createObjectURL(new Blob([JSON.stringify(cleansedData, null, 2)], { type: 'application/json' })),
            preview: cleansedData.slice(0, 50)
          }
        });
      } catch (err) { self.postMessage({ type: 'error', payload: 'Cleansing Failure' }); }
      break;
  }
};
