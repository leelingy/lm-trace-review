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
    return data.trace_tags || [];
  } catch (error) {
    console.error('Error loading trace tags:', error);
    return ['finance', 'reasoning', 'error-handling', 'hallucination'];
  }
}
