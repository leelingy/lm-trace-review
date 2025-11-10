import { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { renderMarkdown } from '../utils/markdown';
import { useApp } from '../context/AppContext';
import { exportTracesToCSV, downloadCSV } from '../utils/csvExport';

export function TraceList({ dataset, onSelectTrace, onBack }) {
  const { traceTags, addTraceTag, commentTags } = useApp();
  const [traces, setTraces] = useState([]);
  const [comments, setComments] = useState([]);
  const [filteredTraces, setFilteredTraces] = useState([]);
  const [filters, setFilters] = useState({
    traceTag: '',
    commentTag: '',
    search: ''
  });
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    loadData();
  }, [dataset]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [traces, comments, filters, sortBy]);

  async function loadData() {
    const allTraces = await dataService.getTracesByDataset(dataset.id);
    const allComments = await dataService.getCommentsByDataset(dataset.id);
    setTraces(allTraces);
    setComments(allComments);
  }

  async function loadTraces() {
    const allTraces = await dataService.getTracesByDataset(dataset.id);
    setTraces(allTraces);
  }

  function applyFiltersAndSort() {
    let result = [...traces];

    // Apply trace tag filter
    if (filters.traceTag) {
      result = result.filter(trace => {
        const tags = trace.trace_tags ? trace.trace_tags.split(',').map(t => t.trim()) : [];
        return tags.includes(filters.traceTag);
      });
    }

    // Apply comment tag filter
    if (filters.commentTag) {
      const traceIdsWithCommentTag = comments
        .filter(comment => comment.tags && comment.tags.includes(filters.commentTag))
        .map(comment => comment.trace_id);

      result = result.filter(trace => traceIdsWithCommentTag.includes(trace.trace_id));
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(trace =>
        trace.trace_id.toLowerCase().includes(searchLower) ||
        trace.input.toLowerCase().includes(searchLower) ||
        trace.message.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date) - new Date(a.date);
      }
      return 0;
    });

    setFilteredTraces(result);
  }

  async function handleTagEdit(trace, newTags) {
    const updatedTrace = { ...trace, trace_tags: newTags };
    await dataService.updateTrace(updatedTrace);

    // Add new tags to global list
    const tags = newTags.split(',').map(t => t.trim()).filter(t => t);
    for (const tag of tags) {
      if (!traceTags.includes(tag)) {
        await addTraceTag(tag);
      }
    }

    await loadTraces();
  }

  function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  function handleExport() {
    // Export only the filtered traces
    const csvContent = exportTracesToCSV(filteredTraces, comments);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${dataset.name}_export_${timestamp}.csv`;
    downloadCSV(csvContent, filename);
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to All Datasets
            </button>
            <h1 className="text-2xl font-bold">{dataset.name}</h1>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search traces..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filters.traceTag}
            onChange={(e) => setFilters({ ...filters, traceTag: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Trace Tags</option>
            {traceTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>

          <select
            value={filters.commentTag}
            onChange={(e) => setFilters({ ...filters, commentTag: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Comment Tags</option>
            {commentTags.map(tag => (
              <option key={tag.id} value={tag.id}>{tag.label}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
          </select>
        </div>
      </div>

      {/* Trace Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trace ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                Input
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                Message
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trace Tags
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTraces.map((trace) => (
              <tr
                key={trace.id}
                onClick={() => onSelectTrace(trace)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                  {trace.trace_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {trace.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {trace.time}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {truncateText(trace.input, 80)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="markdown-content">
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(truncateText(trace.message, 120)) }} />
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <TraceTagEditor
                    trace={trace}
                    availableTags={traceTags}
                    onSave={(newTags) => handleTagEdit(trace, newTags)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTraces.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No traces found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}

function TraceTagEditor({ trace, availableTags, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(trace.trace_tags || '');

  function handleSave() {
    onSave(value);
    setIsEditing(false);
  }

  const tags = trace.trace_tags ? trace.trace_tags.split(',').map(t => t.trim()).filter(t => t) : [];

  if (isEditing) {
    return (
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
          placeholder="tag1, tag2"
          autoFocus
        />
        <button
          onClick={handleSave}
          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
        >
          Save
        </button>
        <button
          onClick={() => {
            setValue(trace.trace_tags || '');
            setIsEditing(false);
          }}
          className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex gap-1 flex-wrap items-center"
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {tags.map((tag, idx) => (
        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
          {tag}
        </span>
      ))}
      <button className="px-2 py-1 text-gray-400 hover:text-gray-600 text-xs">
        ✎ Edit
      </button>
    </div>
  );
}
