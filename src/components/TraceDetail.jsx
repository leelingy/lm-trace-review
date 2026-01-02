import { useState, useEffect, useRef } from 'react';
import { dataService } from '../services/dataService';
import { renderMarkdown, applyHighlights } from '../utils/markdown';
import { useApp } from '../context/AppContext';
import { getUserIdentity, hasUserIdentity } from '../utils/userIdentity';
import { UserIdentityModal } from './UserIdentityModal';

export function TraceDetail({ trace, dataset, onBack, onNavigate }) {
  const { commentTags, traceTags, addTraceTag } = useApp();
  const [comments, setComments] = useState([]);
  const [userIdentity, setUserIdentity] = useState(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [pendingHighlight, setPendingHighlight] = useState(null);
  const messageRef = useRef(null);

  useEffect(() => {
    loadComments();
    const identity = getUserIdentity();
    setUserIdentity(identity);
  }, [trace]);

  async function loadComments() {
    const traceComments = await dataService.getCommentsByTrace(trace.trace_id, dataset.id);
    setComments(traceComments);
  }

  function handleAddComment() {
    if (!hasUserIdentity()) {
      setShowIdentityModal(true);
      return;
    }
    setShowCommentForm(true);
  }

  function handleUserIdentityComplete(identity) {
    setUserIdentity(identity);
    setShowIdentityModal(false);
    setShowCommentForm(true);
  }

  async function handleCommentSubmit(commentData) {
    await dataService.addComment(dataset.id, {
      trace_id: trace.trace_id,
      author: userIdentity,
      ...commentData
    });
    await loadComments();
    setShowCommentForm(false);
    setPendingHighlight(null);
  }

  async function handleCommentDelete(commentId) {
    if (confirm('Are you sure you want to delete this comment?')) {
      await dataService.deleteComment(commentId);
      await loadComments();
    }
  }

  async function handleTagEdit(newTags) {
    const updatedTrace = { ...trace, trace_tags: newTags };
    await dataService.updateTrace(updatedTrace);

    // Add new tags to global list
    const tags = newTags.split(',').map(t => t.trim()).filter(t => t);
    for (const tag of tags) {
      if (!traceTags.includes(tag)) {
        await addTraceTag(tag);
      }
    }
  }

  // Text selection handler
  function handleTextSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText && messageRef.current?.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      const messageText = messageRef.current.textContent || '';

      // Calculate offset in the text content
      const preRange = range.cloneRange();
      preRange.selectNodeContents(messageRef.current);
      preRange.setEnd(range.startContainer, range.startOffset);
      const offset_start = preRange.toString().length;
      const offset_end = offset_start + selectedText.length;

      setPendingHighlight({
        text: selectedText,
        offset_start,
        offset_end,
        source: 'message'
      });

      // Show comment form
      if (!hasUserIdentity()) {
        setShowIdentityModal(true);
      } else {
        setShowCommentForm(true);
      }
    }
  }

  // Get highlights from comments
  const highlights = comments
    .filter(c => c.highlight)
    .map(c => c.highlight);

  // Render message with highlights
  const messageHtml = renderMarkdown(trace.message);
  const messageWithHighlights = applyHighlights(messageHtml, highlights);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to All Traces
            </button>
            <h1 className="text-xl font-bold">Trace: {trace.trace_id}</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate('prev')}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
            >
              ← Previous
            </button>
            <button
              onClick={() => onNavigate('next')}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Trace Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Input */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-2">INPUT</h2>
              <div className="text-gray-900 whitespace-pre-wrap">{trace.input}</div>
            </div>

            {/* Message */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-2">MESSAGE</h2>
              <div
                ref={messageRef}
                className="markdown-content"
                onMouseUp={handleTextSelection}
                dangerouslySetInnerHTML={{ __html: messageWithHighlights }}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Metadata & Comments */}
        <div className="w-2/5 border-l border-gray-200 bg-white overflow-auto">
          <div className="p-6 space-y-6">
            {/* Metadata */}
            <div>
              <h3 className="font-bold mb-3">Metadata</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Date:</span>{' '}
                  <span className="text-gray-900">{trace.date} {trace.time}</span>
                </div>
                {trace.latency && (
                  <div>
                    <span className="text-gray-500">Latency:</span>{' '}
                    <span className="text-gray-900">{trace.latency}</span>
                  </div>
                )}
                {trace.tool_called && (
                  <div>
                    <span className="text-gray-500">Tool Called:</span>{' '}
                    <span className="text-gray-900">{trace.tool_called}</span>
                  </div>
                )}
                {trace.query_validity && (
                  <div>
                    <span className="text-gray-500">Query Validity:</span>{' '}
                    <span className="text-gray-900">{trace.query_validity}</span>
                  </div>
                )}
                {trace.identified_entities && (
                  <div>
                    <span className="text-gray-500">Identified Entities:</span>{' '}
                    <span className="text-gray-900">{trace.identified_entities}</span>
                  </div>
                )}
              </div>

              {/* Trace Tags */}
              <div className="mt-4">
                <span className="text-gray-500 text-sm">Trace Tags:</span>
                <TraceTagEditor
                  trace={trace}
                  availableTags={traceTags}
                  onSave={handleTagEdit}
                />
              </div>
            </div>

            {/* Comments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Comments ({comments.length})</h3>
                <button
                  onClick={handleAddComment}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  + Add
                </button>
              </div>

              {userIdentity && (
                <div className="text-xs text-gray-500 mb-3">
                  Commenting as <strong>{userIdentity.display_name}</strong>
                </div>
              )}

              {showCommentForm && (
                <CommentForm
                  commentTags={commentTags}
                  highlight={pendingHighlight}
                  onSubmit={handleCommentSubmit}
                  onCancel={() => {
                    setShowCommentForm(false);
                    setPendingHighlight(null);
                  }}
                />
              )}

              <div className="space-y-4">
                {comments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    commentTags={commentTags}
                    onDelete={() => handleCommentDelete(comment.id)}
                  />
                ))}
              </div>

              {comments.length === 0 && !showCommentForm && (
                <div className="text-center text-gray-400 text-sm py-8">
                  No comments yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <UserIdentityModal
        isOpen={showIdentityModal}
        onComplete={handleUserIdentityComplete}
      />
    </div>
  );
}

function TraceTagEditor({ trace, availableTags, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  // Parse trace_tags string and find matching tag objects
  const currentTagIds = trace.trace_tags ? trace.trace_tags.split(',').map(t => t.trim()).filter(t => t) : [];
  const currentTags = currentTagIds.map(tagId => {
    // Try to find tag by id first, then by label (for backward compatibility)
    return availableTags.find(t => t.id === tagId || t.label === tagId) || { id: tagId, label: tagId, color: '#007AFF' };
  });

  function handleEditStart() {
    setSelectedTagIds(currentTagIds);
    setIsEditing(true);
  }

  function handleToggleTag(tag) {
    const tagId = typeof tag === 'string' ? tag : tag.id;
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(t => t !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  }

  function handleSave() {
    // Save as comma-separated string of tag IDs
    onSave(selectedTagIds.join(', '));
    setIsEditing(false);
  }

  function handleCancel() {
    setSelectedTagIds([]);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="mt-2">
        <div className="mb-2 text-xs text-gray-600">Select tags:</div>
        <div className="flex flex-wrap gap-2 mb-3 p-2 border border-gray-300 rounded bg-gray-50 max-h-32 overflow-y-auto">
          {availableTags.map((tag, idx) => {
            const tagId = typeof tag === 'string' ? tag : tag.id;
            const isSelected = selectedTagIds.includes(tagId);
            const tagColor = typeof tag === 'string' ? '#007AFF' : tag.color;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${
                  isSelected ? 'text-white' : 'border border-gray-300'
                }`}
                style={{
                  backgroundColor: isSelected ? tagColor : '#ffffff',
                  color: isSelected ? '#ffffff' : '#374151'
                }}
              >
                {isSelected && '✓ '}
                {typeof tag === 'string' ? tag : tag.label}
              </button>
            );
          })}
        </div>
        <div className="text-xs text-gray-500 mb-2">
          Selected: {selectedTagIds.length > 0 ? selectedTagIds.join(', ') : 'None'}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex gap-1 flex-wrap items-center">
        {currentTags.map((tag, idx) => {
          const tagColor = typeof tag === 'string' ? '#007AFF' : tag.color;
          const tagLabel = typeof tag === 'string' ? tag : tag.label;
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
        {currentTags.length === 0 && (
          <span className="text-xs text-gray-400">No tags</span>
        )}
        <button
          onClick={handleEditStart}
          className="px-2 py-1 text-gray-400 hover:text-gray-600 text-xs"
        >
          ✎ Edit
        </button>
      </div>
    </div>
  );
}

function CommentForm({ commentTags, highlight, onSubmit, onCancel }) {
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!comment.trim()) return;

    onSubmit({
      comment: comment.trim(),
      tags: selectedTags,
      highlight: highlight || undefined
    });

    setComment('');
    setSelectedTags([]);
  }

  function toggleTag(tagId) {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4">
      {highlight && (
        <div className="mb-2 text-xs bg-yellow-50 border border-yellow-200 p-2 rounded">
          <strong>Refers to:</strong> "{highlight.text.substring(0, 50)}..."
        </div>
      )}

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2"
        placeholder="Write your comment..."
        rows={3}
        autoFocus
      />

      <div className="mb-2">
        <div className="text-xs text-gray-500 mb-1">Tags:</div>
        <div className="flex flex-wrap gap-1">
          {commentTags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className="px-2 py-1 text-xs rounded"
              style={{
                backgroundColor: selectedTags.includes(tag.id) ? tag.color : '#f3f4f6',
                color: selectedTags.includes(tag.id) ? '#fff' : '#374151'
              }}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Save Comment
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function CommentCard({ comment, commentTags, onDelete }) {
  function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getTagColor(tagId) {
    const tag = commentTags.find(t => t.id === tagId);
    return tag ? tag.color : '#gray';
  }

  function getTagLabel(tagId) {
    const tag = commentTags.find(t => t.id === tagId);
    return tag ? tag.label : tagId;
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      {comment.highlight && (
        <div className="mb-2 text-xs bg-yellow-50 border border-yellow-200 p-2 rounded">
          <strong>Refers to:</strong> "{comment.highlight.text.substring(0, 50)}..."
        </div>
      )}

      <div className="text-sm text-gray-900 mb-2 markdown-content">
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.comment) }} />
      </div>

      {comment.tags && comment.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {comment.tags.map((tagId, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-xs rounded text-white"
              style={{ backgroundColor: getTagColor(tagId) }}
            >
              {getTagLabel(tagId)}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {comment.author?.display_name || 'Anonymous'} · {formatDate(comment.created_at)}
        </span>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
