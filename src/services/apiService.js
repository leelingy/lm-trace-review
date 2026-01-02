// API Service for backend communication

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Dataset operations
  async createDataset(name) {
    return this.request('/datasets', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async getAllDatasets() {
    return this.request('/datasets');
  }

  async getDataset(id) {
    return this.request(`/datasets/${id}`);
  }

  async updateDataset(dataset) {
    return this.request(`/datasets/${dataset.id}`, {
      method: 'PUT',
      body: JSON.stringify(dataset),
    });
  }

  async deleteDataset(id) {
    return this.request(`/datasets/${id}`, {
      method: 'DELETE',
    });
  }

  async updateDatasetCounts(datasetId) {
    return this.request(`/datasets/${datasetId}/update-counts`, {
      method: 'POST',
    });
  }

  // Trace operations
  async addTrace(datasetId, traceData) {
    return this.request('/traces', {
      method: 'POST',
      body: JSON.stringify({ dataset_id: datasetId, ...traceData }),
    });
  }

  async getTracesByDataset(datasetId) {
    return this.request(`/datasets/${datasetId}/traces`);
  }

  async getTrace(id) {
    return this.request(`/traces/${id}`);
  }

  async updateTrace(trace) {
    return this.request(`/traces/${trace.id}`, {
      method: 'PUT',
      body: JSON.stringify(trace),
    });
  }

  async deleteTrace(id) {
    return this.request(`/traces/${id}`, {
      method: 'DELETE',
    });
  }

  async getTracesByTraceTag(tags) {
    // Support both single tag (string) and multiple tags (array)
    const tagString = Array.isArray(tags) ? tags.join(',') : tags;
    return this.request(`/traces/by-trace-tag/${encodeURIComponent(tagString)}`);
  }

  async getTracesByCommentTag(tags) {
    // Support both single tag (string) and multiple tags (array)
    const tagString = Array.isArray(tags) ? tags.join(',') : tags;
    return this.request(`/traces/by-comment-tag/${encodeURIComponent(tagString)}`);
  }

  // Comment operations
  async addComment(datasetId, commentData) {
    return this.request('/comments', {
      method: 'POST',
      body: JSON.stringify({ dataset_id: datasetId, ...commentData }),
    });
  }

  async getCommentsByDataset(datasetId) {
    return this.request(`/datasets/${datasetId}/comments`);
  }

  async getCommentsByTrace(traceId, datasetId) {
    const allComments = await this.getCommentsByDataset(datasetId);
    return allComments.filter(c => c.trace_id === traceId);
  }

  async getComment(id) {
    return this.request(`/comments/${id}`);
  }

  async updateComment(comment) {
    return this.request(`/comments/${comment.id}`, {
      method: 'PUT',
      body: JSON.stringify(comment),
    });
  }

  async deleteComment(id) {
    return this.request(`/comments/${id}`, {
      method: 'DELETE',
    });
  }

  // Config operations
  async getTraceTags() {
    const result = await this.request('/config/trace_tags');
    return result || [];
  }

  async addTraceTag(tag) {
    const tags = await this.getTraceTags();
    // Handle both string and object formats
    const tagId = typeof tag === 'string' ? tag : tag.id;
    const tagExists = tags.some(t => {
      const tId = typeof t === 'string' ? t : t.id;
      return tId === tagId;
    });
    if (!tagExists) {
      tags.push(tag);
      await this.request('/config/trace_tags', {
        method: 'PUT',
        body: JSON.stringify({ value: tags }),
      });
    }
  }

  async setTraceTags(tags) {
    await this.request('/config/trace_tags', {
      method: 'PUT',
      body: JSON.stringify({ value: tags }),
    });
  }

  // Bulk import
  async importTraces(datasetId, traces) {
    const promises = traces.map(trace => this.addTrace(datasetId, trace));
    await Promise.all(promises);
  }

  async importComments(datasetId, comments) {
    const promises = comments.map(comment => this.addComment(datasetId, comment));
    await Promise.all(promises);
  }
}

export const apiService = new ApiService();
