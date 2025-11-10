import Papa from 'papaparse';

// Helper function to normalize header names
function normalizeHeaders(data) {
  if (!data || data.length === 0) return data;

  // Map of common variations to standard field names
  const headerMap = {
    // trace_id variations
    'traceid': 'trace_id',
    'trace id': 'trace_id',
    'id': 'trace_id',

    // date/time (handle capitalized versions from Langfuse)
    'date': 'date',
    'time': 'time',

    // message variations (Langfuse uses "output")
    'output': 'message',
    'response': 'message',

    // tool_called variations
    'toolcalled': 'tool_called',
    'tool called': 'tool_called',

    // query_validity variations
    'queryvalidity': 'query_validity',
    'query validity': 'query_validity',

    // identified_entities variations
    'identifiedentities': 'identified_entities',
    'identified entities': 'identified_entities',

    // trace_tags variations
    'tracetags': 'trace_tags',
    'trace tags': 'trace_tags',
    'tags': 'trace_tags'
  };

  return data.map(row => {
    const normalizedRow = {};
    const keys = Object.keys(row);

    keys.forEach((key, index) => {
      const lowerKey = key.toLowerCase().trim();

      // If first column has empty name and contains data that looks like an ID, use it as trace_id
      if (lowerKey === '' && index === 0 && row[key] && row[key].length > 0) {
        normalizedRow['trace_id'] = row[key];
      } else {
        const normalizedKey = headerMap[lowerKey] || lowerKey;
        normalizedRow[normalizedKey] = row[key];
      }
    });

    return normalizedRow;
  });
}

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        // Normalize headers to handle different naming conventions
        const normalizedData = normalizeHeaders(results.data);
        resolve(normalizedData);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

export function validateTraceCSV(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return { valid: false, error: 'CSV is empty' };
  }

  // Only require trace_id and message (date/time/input are optional)
  const requiredFields = ['trace_id', 'message'];
  const firstRow = data[0];
  const missingFields = requiredFields.filter(field => !(field in firstRow));

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`
    };
  }

  return { valid: true };
}

export function validateCommentCSV(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return { valid: false, error: 'CSV is empty' };
  }

  const requiredFields = ['trace_id', 'comment'];
  const firstRow = data[0];
  const missingFields = requiredFields.filter(field => !(field in firstRow));

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`
    };
  }

  return { valid: true };
}

export function normalizeTraceData(rawData) {
  return rawData.map(row => {
    let message = row.message || '';
    let toolCalled = row.tool_called || '';
    let queryValidity = row.query_validity || '';
    let identifiedEntities = row.identified_entities || '';
    let input = row.input || '';

    // Try to parse JSON from 'output' or 'message' field (Langfuse format)
    const jsonField = row.output || row.message;
    if (jsonField && typeof jsonField === 'string' && jsonField.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(jsonField);

        // Extract message
        if (parsed.message) {
          message = parsed.message;
        }

        // Extract tools_called (array)
        if (parsed.tools_called && Array.isArray(parsed.tools_called)) {
          toolCalled = parsed.tools_called.join(', ');
        }

        // Extract query_validity
        if (parsed.query_validity !== undefined) {
          queryValidity = parsed.query_validity ? 'Valid' : 'Invalid';
        }

        // Extract entities_identified
        if (parsed.entities_identified && typeof parsed.entities_identified === 'object') {
          const entities = [];
          Object.entries(parsed.entities_identified).forEach(([key, values]) => {
            if (Array.isArray(values) && values.length > 0) {
              entities.push(...values);
            }
          });
          identifiedEntities = entities.join(', ');
        }
      } catch (e) {
        // If JSON parsing fails, use the raw value as message
        console.warn('Failed to parse JSON in output field:', e);
      }
    }

    // Try to parse JSON from 'input' field if it's JSON
    if (row.input && typeof row.input === 'string' && row.input.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(row.input);
        // Extract user_query if present
        if (parsed.user_query) {
          input = parsed.user_query;
        }
      } catch (e) {
        // Keep original input if parsing fails
      }
    }

    return {
      trace_id: row.trace_id || '',
      date: row.date || '',
      time: row.time || '',
      input: input,
      message: message,
      tool_called: toolCalled,
      query_validity: queryValidity,
      identified_entities: identifiedEntities,
      trace_tags: row.trace_tags || ''
    };
  });
}

export function normalizeCommentData(rawData) {
  return rawData.map(row => {
    // Handle unnamed first column (common in exports)
    const firstColValue = row[''] || row[Object.keys(row)[0]];

    // Parse tags - handle JSON array format from Langfuse or comma-separated
    let parsedTags = [];
    const tagValue = row.tags || row.trace_tags || row.traceTags || row.tracetags || '';

    if (tagValue) {
      try {
        // Try parsing as JSON array first (Langfuse format)
        if (tagValue.startsWith('[')) {
          parsedTags = JSON.parse(tagValue);
        } else {
          parsedTags = tagValue.split(',').map(t => t.trim());
        }
      } catch {
        // Fallback to comma-separated
        parsedTags = tagValue.split(',').map(t => t.trim());
      }
    }

    // Determine comment text and author
    // In Langfuse: 'name' field contains the comment/annotation text
    // In standard format: 'comment' field contains the text, 'name' is the author
    const commentText = row.comment || row.name || '';
    const authorName = row.comment ? (row.name || 'Anonymous') : 'Langfuse';

    return {
      trace_id: row.trace_id || firstColValue || '',
      date: row.date || '',
      time: row.time || '',
      author: {
        display_name: authorName
      },
      comment: commentText,
      tags: parsedTags
    };
  });
}
