# LM Trace Review Interface

A lightweight web interface for reviewing, annotating, and managing LM (Language Model) trace data.

## Features

- **Dataset Management**: Upload and manage multiple trace datasets
- **CSV Import**: Import traces and comments from CSV files
- **Trace Viewing**: Browse traces with filtering and sorting
- **Commenting**: Add, edit, and delete comments on traces
- **Text Highlighting**: Highlight specific text in messages and attach comments
- **Markdown Support**: Full markdown rendering for messages and comments
- ** Management**: Organize traces and comments with customizable tags
- **Session Identity**: Simple user identification without authentication
- **Persistent Storage**: All data stored locally using IndexedDB

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 3. Upload Your First Dataset

1. Click "+ Upload Dataset"
2. Enter a dataset name
3. Upload a trace CSV file (required)
4. Optionally upload a comment CSV file
5. Click "Upload Dataset"

## CSV Format Requirements

### Trace CSV Format

Required columns:
- `trace_id`: Unique identifier for the trace
- `date`: Date of the trace (e.g., "2025-11-07")
- `time`: Time of the trace (e.g., "14:30:00")
- `input`: The model input or prompt
- `message`: The model output (supports markdown)

Optional columns:
- `tool_called`: Tool used (if any)
- `query_validity`: Query validity status
- `identified_entities`: Extracted entities
- `trace_tags`: Comma-separated tags

Example:
```csv
trace_id,date,time,input,message,tool_called,query_validity,identified_entities,trace_tags
T001,2025-11-07,14:30:00,"What is the GDP?","The GDP is...",calculator,Valid,"GDP",finance
```

### Comment CSV Format

Required columns:
- `trace_id`: Associated trace ID
- `comment`: Comment text (supports markdown)

Optional columns:
- `date`: Comment date
- `time`: Comment time
- `name`: Comment author name
- `tags`: Comma-separated tag IDs (e.g., "clarification,bug")

Example:
```csv
trace_id,comment,name,tags
T001,"This needs clarification on the time period.",Lee Ling,clarification
```

## Using the Application

### Viewing Traces

1. Select a dataset from the "All Datasets" view
2. Browse traces in the table view
3. Use filters to narrow down traces by tag or search term
4. Click on a trace to view details

### Adding Comments

1. Open a trace detail view
2. Click "+ Add" in the comments section
3. If first time, enter your display name
4. Write your comment (markdown supported)
5. Select tags (optional)
6. Click "Save Comment"

### Highlighting Text

1. In trace detail view, select text in the message area
2. A comment form will appear
3. Enter your comment referring to the selected text
4. The highlighted text will be visually marked
5. Hover over highlights to see associated comments

### Editing Trace Tags

1. In trace list or detail view, click "Edit" next to trace tags
2. Enter comma-separated tags
3. New tags are automatically added to the global tag list
4. Click "Save"

## Configuration

### Comment Tags

Edit `/public/comment_tags.json` to customize comment tags:

```json
{
  "comment_tags": [
    { "id": "clarification", "label": "Clarification", "color": "#007AFF" },
    { "id": "bug", "label": "Bug", "color": "#FF3B30" }
  ]
}
```

### Trace Tags

Edit `/public/trace_tags.json` to set initial trace tags:

```json
{
  "trace_tags": ["finance", "reasoning", "error-handling"]
}
```

Note: Users can add new trace tags at runtime through the UI.

## Data Storage

All data is stored locally in your browser using IndexedDB:
- Datasets persist across sessions
- Comments and highlights are saved automatically
- No server required

To clear all data: Open browser DevTools → Application → IndexedDB → Delete "lm-trace-review-db"

## Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory. You can deploy these to any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- IndexedDB
- Papa Parse (CSV parsing)
- Marked (Markdown rendering)
- DOMPurify (XSS protection)

## Future Enhancements

See PRD section 11 for planned features including:
- Multi-highlight support per comment
- Real-time collaboration
- Export functionality
- Analytics dashboard
