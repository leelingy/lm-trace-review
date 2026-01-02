import { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { renderMarkdown } from '../utils/markdown';
import { useApp } from '../context/AppContext';

export function CrossDatasetView({ tagType, tagValues, onBack, onSelectTrace }) {
  const { traceTags, commentTags } = useApp();
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidePanelTrace, setSidePanelTrace] = useState(null);
  const [sidePanelComments, setSidePanelComments] = useState([]);
  const [showMarkdown, setShowMarkdown] = useState(false);

  useEffect(() => {
    loadTraces();
  }, [tagType, tagValues]);

  useEffect(() => {
    if (sidePanelTrace) {
      loadCommentsForTrace(sidePanelTrace);
    }
  }, [sidePanelTrace]);

  async function loadTraces() {
    setLoading(true);
    try {
      let result;
      if (tagType === 'trace') {
        result = await dataService.getTracesByTraceTag(tagValues);
      } else if (tagType === 'comment') {
        result = await dataService.getTracesByCommentTag(tagValues);
      }
      setTraces(result || []);
    } catch (error) {
      console.error('Error loading traces:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCommentsForTrace(trace) {
    try {
      const comments = await dataService.getCommentsByDataset(trace.dataset_id);
      const traceComments = comments.filter(c => c.trace_id === trace.trace_id);
      setSidePanelComments(traceComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      setSidePanelComments([]);
    }
  }

  function getTagDisplayText() {
    if (Array.isArray(tagValues)) {
      return tagValues.map((tagId) => {
        if (tagType === 'trace') {
          const tag = traceTags.find(t => {
            const tId = typeof t === 'string' ? t : t.id;
            return tId === tagId;
          });
          return tag && typeof tag !== 'string' ? tag.label : tagId;
        } else {
          const tag = commentTags.find(t => t.id === tagId);
          return tag ? tag.label : tagId;
        }
      }).join(', ');
    }
    return tagValues;
  }

  function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading traces...</div>
      </div>
    );
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
            <h1 className="text-2xl font-bold">
              Traces with {tagType} {Array.isArray(tagValues) && tagValues.length > 1 ? 'tags' : 'tag'}: <span className="text-blue-600">{getTagDisplayText()}</span>
            </h1>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Showing {traces.length} trace{traces.length !== 1 ? 's' : ''} across all datasets
        </div>
      </div>

      {/* Trace Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dataset
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trace ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Latency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trace Tags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                Input
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                Message
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {traces.map((trace) => (
              <tr
                key={trace.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => setSidePanelTrace(trace)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {trace.dataset_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                  {trace.trace_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {trace.latency || '-'}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-1 flex-wrap">
                    {trace.trace_tags && trace.trace_tags.split(',').map((tagId, idx) => {
                      const trimmedTagId = tagId.trim();
                      const tag = traceTags.find(t => {
                        const tId = typeof t === 'string' ? t : t.id;
                        return tId === trimmedTagId;
                      });
                      const tagColor = tag && typeof tag !== 'string' ? tag.color : '#007AFF';
                      const tagLabel = tag && typeof tag !== 'string' ? tag.label : trimmedTagId;
                      return (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: tagColor + '20', color: tagColor }}
                        >
                          {tagLabel}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {truncateText(trace.input, 80)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="markdown-content">
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(truncateText(trace.message, 120)) }} />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSidePanelTrace(trace);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {traces.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No traces found with {tagType} {Array.isArray(tagValues) && tagValues.length > 1 ? 'tags' : 'tag'} "{getTagDisplayText()}".
          </div>
        )}
      </div>

      {/* Side Panel */}
      {sidePanelTrace && (
        <div className="fixed inset-y-0 right-0 w-2/5 bg-white shadow-2xl border-l border-gray-200 overflow-y-auto z-50">
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
              <h2 className="text-lg font-bold mb-4">Trace Metadata</h2>
              <div className="space-y-2 text-sm">
                <div><span className="font-semibold">Dataset:</span> {sidePanelTrace.dataset_name}</div>
                <div><span className="font-semibold">Trace ID:</span> {sidePanelTrace.trace_id}</div>
                <div><span className="font-semibold">Date:</span> {sidePanelTrace.date}</div>
                <div><span className="font-semibold">Time:</span> {sidePanelTrace.time}</div>
                {sidePanelTrace.latency && (
                  <div><span className="font-semibold">Latency:</span> {sidePanelTrace.latency}</div>
                )}
                {sidePanelTrace.tool_called && (
                  <div><span className="font-semibold">Tool Called:</span> {sidePanelTrace.tool_called}</div>
                )}
                {sidePanelTrace.query_validity && (
                  <div><span className="font-semibold">Query Validity:</span> {sidePanelTrace.query_validity}</div>
                )}
                {sidePanelTrace.identified_entities && (
                  <div><span className="font-semibold">Identified Entities:</span> {sidePanelTrace.identified_entities}</div>
                )}
                {sidePanelTrace.trace_tags && (
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">Tags:</span>
                    <div className="flex flex-wrap gap-1">
                      {sidePanelTrace.trace_tags.split(',').map((tagId, idx) => {
                        const trimmedTagId = tagId.trim();
                        const tag = traceTags.find(t => {
                          const tId = typeof t === 'string' ? t : t.id;
                          return tId === trimmedTagId;
                        });
                        const tagColor = tag && typeof tag !== 'string' ? tag.color : '#007AFF';
                        const tagLabel = tag && typeof tag !== 'string' ? tag.label : trimmedTagId;
                        return (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded text-xs"
                            style={{ backgroundColor: tagColor + '20', color: tagColor }}
                          >
                            {tagLabel}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            {sidePanelTrace.input && (
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-2">Input</h2>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {sidePanelTrace.input}
                  </div>
                </div>
              </div>
            )}

            {/* Message */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold">Message</h2>
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
              <div className="p-4 bg-gray-50 rounded-lg">
                {showMarkdown ? (
                  <div className="text-sm text-gray-700 markdown-content">
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(sidePanelTrace.message) }} />
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {sidePanelTrace.message}
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <h2 className="text-lg font-bold mb-4">Comments</h2>
              <div className="space-y-4">
                {sidePanelComments.map(comment => (
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
                {sidePanelComments.length === 0 && (
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
