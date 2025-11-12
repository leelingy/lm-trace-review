// CSV Export utilities

export function exportTracesToCSV(traces, comments) {
  // Group comments by trace_id
  const commentsByTrace = {};
  comments.forEach(comment => {
    if (!commentsByTrace[comment.trace_id]) {
      commentsByTrace[comment.trace_id] = [];
    }
    commentsByTrace[comment.trace_id].push(comment);
  });

  // Find max number of comments for any trace
  let maxComments = 0;
  Object.values(commentsByTrace).forEach(traceComments => {
    if (traceComments.length > maxComments) {
      maxComments = traceComments.length;
    }
  });

  // Build header row
  const baseHeaders = [
    'trace_id',
    'date',
    'time',
    'input',
    'message',
    'tool_called',
    'query_validity',
    'identified_entities',
    'trace_tags'
  ];

  const commentHeaders = [];
  for (let i = 1; i <= maxComments; i++) {
    commentHeaders.push(
      `comment_${i}`,
      `comment_${i}_author`,
      `comment_${i}_tags`,
      `comment_${i}_date`,
      `comment_${i}_highlight`
    );
  }

  const headers = [...baseHeaders, ...commentHeaders];

  // Build data rows
  const rows = traces.map(trace => {
    const row = [
      trace.trace_id || '',
      trace.date || '',
      trace.time || '',
      trace.input || '',
      trace.message || '',
      trace.tool_called || '',
      trace.query_validity || '',
      trace.identified_entities || '',
      trace.trace_tags || ''
    ];

    // Add comments
    const traceComments = commentsByTrace[trace.trace_id] || [];
    for (let i = 0; i < maxComments; i++) {
      const comment = traceComments[i];
      if (comment) {
        row.push(
          comment.comment || '',
          comment.author?.display_name || '',
          comment.tags ? comment.tags.join(', ') : '',
          comment.created_at || '',
          comment.highlight ? comment.highlight.text : ''
        );
      } else {
        // Empty columns for missing comments
        row.push('', '', '', '', '');
      }
    }

    return row;
  });

  // Convert to CSV string
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => escapeCSVCell(cell)).join(','))
    .join('\n');

  return csvContent;
}

function escapeCSVCell(cell) {
  // Convert to string
  const str = String(cell);

  // If cell contains comma, newline, or quote, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

// Export for comment analysis - one row per comment with trace info
export function exportCommentsForAnalysisCSV(traces, comments) {
  const headers = [
    'trace_id',
    'trace_tags',
    'input',
    'comment',
    'comment_author',
    'comment_tags',
    'comment_date'
  ];

  const rows = [];

  // Create one row per comment
  comments.forEach(comment => {
    const trace = traces.find(t => t.trace_id === comment.trace_id);
    if (trace) {
      rows.push([
        trace.trace_id || '',
        trace.trace_tags || '',
        trace.input || '',
        comment.comment || '',
        comment.author?.display_name || '',
        comment.tags ? comment.tags.join(', ') : '',
        comment.created_at || ''
      ]);
    }
  });

  // Convert to CSV string
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => escapeCSVCell(cell)).join(','))
    .join('\n');

  return csvContent;
}

export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
