import { db, STORES } from '../utils/db';

class DataService {
  // Dataset operations
  async createDataset(name) {
    const dataset = {
      name,
      lastUpdated: new Date().toISOString(),
      traceCount: 0,
      commentCount: 0
    };
    return await db.add(STORES.DATASETS, dataset);
  }

  async getAllDatasets() {
    return await db.getAll(STORES.DATASETS);
  }

  async getDataset(id) {
    return await db.get(STORES.DATASETS, id);
  }

  async updateDataset(dataset) {
    dataset.lastUpdated = new Date().toISOString();
    return await db.put(STORES.DATASETS, dataset);
  }

  async deleteDataset(id) {
    // Delete dataset and all associated traces and comments
    const traces = await db.getByIndex(STORES.TRACES, 'dataset_id', id);
    const comments = await db.getByIndex(STORES.COMMENTS, 'dataset_id', id);

    for (const trace of traces) {
      await db.delete(STORES.TRACES, trace.id);
    }

    for (const comment of comments) {
      await db.delete(STORES.COMMENTS, comment.id);
    }

    return await db.delete(STORES.DATASETS, id);
  }

  async updateDatasetCounts(datasetId) {
    const dataset = await this.getDataset(datasetId);
    if (!dataset) return;

    const traces = await db.getByIndex(STORES.TRACES, 'dataset_id', datasetId);
    const comments = await db.getByIndex(STORES.COMMENTS, 'dataset_id', datasetId);

    dataset.traceCount = traces.length;
    dataset.commentCount = comments.length;

    await this.updateDataset(dataset);
  }

  // Trace operations
  async addTrace(datasetId, traceData) {
    const trace = {
      dataset_id: datasetId,
      ...traceData
    };
    const id = await db.add(STORES.TRACES, trace);
    await this.updateDatasetCounts(datasetId);
    return id;
  }

  async getTracesByDataset(datasetId) {
    return await db.getByIndex(STORES.TRACES, 'dataset_id', datasetId);
  }

  async getTrace(id) {
    return await db.get(STORES.TRACES, id);
  }

  async updateTrace(trace) {
    return await db.put(STORES.TRACES, trace);
  }

  async deleteTrace(id) {
    const trace = await db.get(STORES.TRACES, id);
    if (trace) {
      // Delete associated comments
      const comments = await this.getCommentsByTrace(trace.trace_id, trace.dataset_id);
      for (const comment of comments) {
        await db.delete(STORES.COMMENTS, comment.id);
      }

      await db.delete(STORES.TRACES, id);
      await this.updateDatasetCounts(trace.dataset_id);
    }
  }

  // Comment operations
  async addComment(datasetId, commentData) {
    const comment = {
      dataset_id: datasetId,
      created_at: new Date().toISOString(),
      ...commentData
    };
    const id = await db.add(STORES.COMMENTS, comment);
    await this.updateDatasetCounts(datasetId);
    return id;
  }

  async getCommentsByDataset(datasetId) {
    return await db.getByIndex(STORES.COMMENTS, 'dataset_id', datasetId);
  }

  async getCommentsByTrace(traceId, datasetId) {
    const allComments = await db.getByIndex(STORES.COMMENTS, 'dataset_id', datasetId);
    return allComments.filter(c => c.trace_id === traceId);
  }

  async getComment(id) {
    return await db.get(STORES.COMMENTS, id);
  }

  async updateComment(comment) {
    return await db.put(STORES.COMMENTS, comment);
  }

  async deleteComment(id) {
    const comment = await db.get(STORES.COMMENTS, id);
    if (comment) {
      await db.delete(STORES.COMMENTS, id);
      await this.updateDatasetCounts(comment.dataset_id);
    }
  }

  // Config operations
  async getTraceTags() {
    const config = await db.get(STORES.CONFIG, 'trace_tags');
    return config ? config.value : [];
  }

  async addTraceTag(tag) {
    let tags = await this.getTraceTags();
    if (!tags.includes(tag)) {
      tags.push(tag);
      await db.put(STORES.CONFIG, { key: 'trace_tags', value: tags });
    }
  }

  async setTraceTags(tags) {
    await db.put(STORES.CONFIG, { key: 'trace_tags', value: tags });
  }

  // Bulk import
  async importTraces(datasetId, traces) {
    for (const trace of traces) {
      await this.addTrace(datasetId, trace);
    }
  }

  async importComments(datasetId, comments) {
    for (const comment of comments) {
      await this.addComment(datasetId, comment);
    }
  }
}

export const dataService = new DataService();
