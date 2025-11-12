import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Dataset endpoints
app.get('/api/datasets', (req, res) => {
  try {
    const datasets = db.prepare('SELECT * FROM datasets ORDER BY lastUpdated DESC').all();
    res.json(datasets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/datasets/:id', (req, res) => {
  try {
    const dataset = db.prepare('SELECT * FROM datasets WHERE id = ?').get(req.params.id);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    res.json(dataset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/datasets', (req, res) => {
  try {
    const { name } = req.body;
    const result = db.prepare(
      'INSERT INTO datasets (name, lastUpdated, traceCount, commentCount) VALUES (?, ?, 0, 0)'
    ).run(name, new Date().toISOString());

    const dataset = db.prepare('SELECT * FROM datasets WHERE id = ?').get(result.lastInsertRowid);
    res.json(dataset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/datasets/:id', (req, res) => {
  try {
    const { name, traceCount, commentCount } = req.body;
    db.prepare(
      'UPDATE datasets SET name = ?, traceCount = ?, commentCount = ?, lastUpdated = ? WHERE id = ?'
    ).run(name, traceCount, commentCount, new Date().toISOString(), req.params.id);

    const dataset = db.prepare('SELECT * FROM datasets WHERE id = ?').get(req.params.id);
    res.json(dataset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/datasets/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM datasets WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trace endpoints
app.get('/api/datasets/:datasetId/traces', (req, res) => {
  try {
    const traces = db.prepare('SELECT * FROM traces WHERE dataset_id = ?').all(req.params.datasetId);
    res.json(traces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/traces/:id', (req, res) => {
  try {
    const trace = db.prepare('SELECT * FROM traces WHERE id = ?').get(req.params.id);
    if (!trace) {
      return res.status(404).json({ error: 'Trace not found' });
    }
    res.json(trace);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/traces', (req, res) => {
  try {
    const trace = req.body;
    console.log('Received trace data:', JSON.stringify(trace, null, 2));

    // Handle dataset_id being passed as object or number
    const datasetId = typeof trace.dataset_id === 'object' ? trace.dataset_id.id : trace.dataset_id;

    const result = db.prepare(`
      INSERT INTO traces (dataset_id, trace_id, date, time, input, message, tool_called, query_validity, identified_entities, trace_tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      datasetId,
      trace.trace_id || null,
      trace.date || null,
      trace.time || null,
      trace.input || null,
      trace.message || null,
      trace.tool_called || null,
      trace.query_validity || null,
      trace.identified_entities || null,
      trace.trace_tags || null
    );

    const newTrace = db.prepare('SELECT * FROM traces WHERE id = ?').get(result.lastInsertRowid);
    res.json(newTrace);
  } catch (error) {
    console.error('Error creating trace:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/traces/:id', (req, res) => {
  try {
    const trace = req.body;
    db.prepare(`
      UPDATE traces
      SET trace_id = ?, date = ?, time = ?, input = ?, message = ?, tool_called = ?,
          query_validity = ?, identified_entities = ?, trace_tags = ?
      WHERE id = ?
    `).run(
      trace.trace_id,
      trace.date,
      trace.time,
      trace.input,
      trace.message,
      trace.tool_called,
      trace.query_validity,
      trace.identified_entities,
      trace.trace_tags,
      req.params.id
    );

    const updatedTrace = db.prepare('SELECT * FROM traces WHERE id = ?').get(req.params.id);
    res.json(updatedTrace);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/traces/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM traces WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comment endpoints
app.get('/api/datasets/:datasetId/comments', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM comments WHERE dataset_id = ?').all(req.params.datasetId);
    const comments = rows.map(row => ({
      id: row.id,
      dataset_id: row.dataset_id,
      trace_id: row.trace_id,
      author: {
        display_name: row.author_display_name,
        email: row.author_email
      },
      comment: row.comment,
      tags: row.tags ? JSON.parse(row.tags) : [],
      highlight: row.highlight_text ? {
        text: row.highlight_text,
        offset_start: row.highlight_offset_start,
        offset_end: row.highlight_offset_end,
        source: row.highlight_source
      } : null,
      created_at: row.created_at
    }));
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/comments', (req, res) => {
  try {
    const comment = req.body;

    // Handle dataset_id being passed as object or number
    const datasetId = typeof comment.dataset_id === 'object' ? comment.dataset_id.id : comment.dataset_id;

    const result = db.prepare(`
      INSERT INTO comments (dataset_id, trace_id, author_display_name, author_email, comment, tags,
                           highlight_text, highlight_offset_start, highlight_offset_end, highlight_source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      datasetId,
      comment.trace_id,
      comment.author?.display_name,
      comment.author?.email,
      comment.comment,
      JSON.stringify(comment.tags || []),
      comment.highlight?.text,
      comment.highlight?.offset_start,
      comment.highlight?.offset_end,
      comment.highlight?.source,
      comment.created_at || new Date().toISOString()
    );

    const newComment = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);
    res.json({
      id: newComment.id,
      dataset_id: newComment.dataset_id,
      trace_id: newComment.trace_id,
      author: {
        display_name: newComment.author_display_name,
        email: newComment.author_email
      },
      comment: newComment.comment,
      tags: newComment.tags ? JSON.parse(newComment.tags) : [],
      highlight: newComment.highlight_text ? {
        text: newComment.highlight_text,
        offset_start: newComment.highlight_offset_start,
        offset_end: newComment.highlight_offset_end,
        source: newComment.highlight_source
      } : null,
      created_at: newComment.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/comments/:id', (req, res) => {
  try {
    const comment = req.body;
    db.prepare(`
      UPDATE comments
      SET comment = ?, tags = ?, highlight_text = ?, highlight_offset_start = ?,
          highlight_offset_end = ?, highlight_source = ?
      WHERE id = ?
    `).run(
      comment.comment,
      JSON.stringify(comment.tags || []),
      comment.highlight?.text,
      comment.highlight?.offset_start,
      comment.highlight?.offset_end,
      comment.highlight?.source,
      req.params.id
    );

    const row = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
    res.json({
      id: row.id,
      dataset_id: row.dataset_id,
      trace_id: row.trace_id,
      author: {
        display_name: row.author_display_name,
        email: row.author_email
      },
      comment: row.comment,
      tags: row.tags ? JSON.parse(row.tags) : [],
      highlight: row.highlight_text ? {
        text: row.highlight_text,
        offset_start: row.highlight_offset_start,
        offset_end: row.highlight_offset_end,
        source: row.highlight_source
      } : null,
      created_at: row.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/comments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Config endpoints
app.get('/api/config/:key', (req, res) => {
  try {
    const config = db.prepare('SELECT value FROM config WHERE key = ?').get(req.params.key);
    res.json(config ? JSON.parse(config.value) : null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/config/:key', (req, res) => {
  try {
    const { value } = req.body;
    db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run(
      req.params.key,
      JSON.stringify(value)
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update dataset counts
app.post('/api/datasets/:id/update-counts', (req, res) => {
  try {
    console.log('Updating counts for dataset:', req.params.id);

    const traceCount = db.prepare('SELECT COUNT(*) as count FROM traces WHERE dataset_id = ?')
      .get(req.params.id).count;
    const commentCount = db.prepare('SELECT COUNT(*) as count FROM comments WHERE dataset_id = ?')
      .get(req.params.id).count;

    console.log(`Trace count: ${traceCount}, Comment count: ${commentCount}`);

    db.prepare('UPDATE datasets SET traceCount = ?, commentCount = ?, lastUpdated = ? WHERE id = ?')
      .run(traceCount, commentCount, new Date().toISOString(), req.params.id);

    const dataset = db.prepare('SELECT * FROM datasets WHERE id = ?').get(req.params.id);

    if (!dataset) {
      console.error('Dataset not found:', req.params.id);
      return res.status(404).json({ error: 'Dataset not found' });
    }

    console.log('Returning dataset:', dataset);
    res.json(dataset);
  } catch (error) {
    console.error('Error updating counts:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
