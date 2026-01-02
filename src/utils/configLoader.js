// Load configuration files

export async function loadCommentTags() {
  try {
    const response = await fetch('/comment_tags.json');
    const data = await response.json();
    return data.comment_tags || [];
  } catch (error) {
    console.error('Error loading comment tags:', error);
    return [
      { id: 'clarification', label: 'Clarification', color: '#007AFF' },
      { id: 'bug', label: 'Bug', color: '#FF3B30' },
      { id: 'suggestion', label: 'Suggestion', color: '#FFCC00' },
      { id: 'validation', label: 'Validation', color: '#34C759' }
    ];
  }
}

export async function loadTraceTags() {
  try {
    const response = await fetch('/trace_tags.json');
    const data = await response.json();
    const tags = data.trace_tags || [];
    // Handle both object format (new) and string format (legacy)
    return tags.map(tag => {
      if (typeof tag === 'string') {
        return { id: tag, label: tag, color: '#007AFF' };
      }
      return tag;
    });
  } catch (error) {
    console.error('Error loading trace tags:', error);
    return [
      { id: 'finance', label: 'finance', color: '#007AFF' },
      { id: 'reasoning', label: 'reasoning', color: '#FF3B30' },
      { id: 'error-handling', label: 'error-handling', color: '#FFCC00' },
      { id: 'hallucination', label: 'hallucination', color: '#34C759' }
    ];
  }
}
