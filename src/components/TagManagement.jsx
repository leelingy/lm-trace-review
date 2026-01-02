import { useState } from 'react';
import { useApp } from '../context/AppContext';

export function TagManagement({ isOpen, onClose }) {
  const { traceTags, addTraceTag, removeTraceTag } = useApp();
  const [newTag, setNewTag] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (!isOpen) return null;

  async function handleAddTag(e) {
    e.preventDefault();
    const trimmedTag = newTag.trim();
    if (trimmedTag) {
      await addTraceTag(trimmedTag);
      setNewTag('');
    }
  }

  async function handleRemoveTag(tag) {
    await removeTraceTag(tag);
    setConfirmDelete(null);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold">Manage Trace Tags</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Add New Tag */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Add New Tag</h3>
            <form onSubmit={handleAddTag} className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter new tag name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Tag
              </button>
            </form>
          </div>

          {/* Existing Tags */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              All Tags ({traceTags.length})
            </h3>
            <div className="space-y-2">
              {traceTags.map((tag, idx) => {
                const tagId = typeof tag === 'string' ? tag : tag.id;
                const tagLabel = typeof tag === 'string' ? tag : tag.label;
                const tagColor = typeof tag === 'string' ? '#007AFF' : tag.color;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="px-3 py-1 rounded text-sm font-medium"
                        style={{ backgroundColor: tagColor + '20', color: tagColor }}
                      >
                        {tagLabel}
                      </span>
                    </div>
                    {confirmDelete === tagId ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Are you sure?</span>
                        <button
                          onClick={() => handleRemoveTag(tagId)}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(tagId)}
                        className="px-3 py-1 text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
              {traceTags.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No tags available. Add your first tag above.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
