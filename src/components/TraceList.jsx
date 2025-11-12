import { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { renderMarkdown } from '../utils/markdown';
import { useApp } from '../context/AppContext';
import { exportTracesToCSV, exportCommentsForAnalysisCSV, downloadCSV } from '../utils/csvExport';

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
  const [sidePanelTrace, setSidePanelTrace] = useState(null);
  const [showMarkdown, setShowMarkdown] = useState(false);

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
        (trace.trace_id || '').toLowerCase().includes(searchLower) ||
        (trace.input || '').toLowerCase().includes(searchLower) ||
        (trace.message || '').toLowerCase().includes(searchLower)
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

  function handleExportForAnalysis() {
    // Export comments for analysis - one row per comment
    const csvContent = exportCommentsForAnalysisCSV(filteredTraces, comments);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${dataset.name}_comments_analysis_${timestamp}.csv`;
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
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Full
            </button>
            <button
              onClick={handleExportForAnalysis}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Export for Analysis
            </button>
          </div>
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
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTraces.map((trace) => {
              const traceComments = comments.filter(c => c.trace_id === trace.trace_id);
              return (
                <tr
                  key={trace.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSidePanelTrace(trace)}
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSidePanelTrace(trace);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        {traceComments.length > 0 ? `Comments (${traceComments.length})` : 'Comments'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTrace(trace);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredTraces.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No traces found matching your filters.
          </div>
        )}
      </div>

      {/* Side Panel */}
      {sidePanelTrace && (
        <div className="fixed inset-y-0 right-0 w-1/3 bg-white shadow-2xl border-l border-gray-200 overflow-y-auto z-50">
          <div className="p-6">
            {/* Close Button */}
            <button
              onClick={() => setSidePanelTrace(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Metadata */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4 pr-10">
                <h2 className="text-lg font-bold">Trace Metadata</h2>
                <button
                  onClick={() => onSelectTrace(sidePanelTrace)}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Full Details
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="font-semibold">Trace ID:</span> {sidePanelTrace.trace_id}</div>
                <div><span className="font-semibold">Date:</span> {sidePanelTrace.date}</div>
                <div><span className="font-semibold">Time:</span> {sidePanelTrace.time}</div>
                {sidePanelTrace.tool_called && (
                  <div><span className="font-semibold">Tool Called:</span> {sidePanelTrace.tool_called}</div>
                )}
                {sidePanelTrace.query_validity && (
                  <div><span className="font-semibold">Query Validity:</span> {sidePanelTrace.query_validity}</div>
                )}
                {sidePanelTrace.identified_entities && (
                  <div><span className="font-semibold">Identified Entities:</span> {sidePanelTrace.identified_entities}</div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Comments</h2>
                <button
                  onClick={() => setShowMarkdown(!showMarkdown)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-md hover:bg-gray-300 flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  {showMarkdown ? 'Plain Text' : 'Markdown'}
                </button>
              </div>
              <div className="space-y-4">
                {comments.filter(c => c.trace_id === sidePanelTrace.trace_id).map(comment => (
                  <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-sm">{comment.author?.display_name || 'Anonymous'}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {showMarkdown ? (
                      <div className="text-sm text-gray-700 markdown-content">
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.comment) }} />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">{comment.comment}</div>
                    )}
                    {comment.tags && comment.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {comment.tags.map((tagId) => {
                          const tag = commentTags.find(t => t.id === tagId);
                          return tag ? (
                            <span
                              key={tagId}
                              className="px-2 py-1 rounded text-xs"
                              style={{ backgroundColor: tag.color + '20', color: tag.color }}
                            >
                              {tag.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                ))}
                {comments.filter(c => c.trace_id === sidePanelTrace.trace_id).length === 0 && (
                  <div className="text-gray-500 text-sm">No comments yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
