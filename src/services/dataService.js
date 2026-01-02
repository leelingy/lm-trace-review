// Storage adapter - switches between IndexedDB and API backend
import { dataService as indexedDBService } from './indexedDBService';
import { apiService } from './apiService';

const STORAGE_BACKEND = import.meta.env.VITE_STORAGE_BACKEND || 'indexeddb';

class DataServiceAdapter {
  constructor() {
    // Select backend based on environment variable
    this.backend = STORAGE_BACKEND === 'api' ? apiService : indexedDBService;
    console.log(`Using ${STORAGE_BACKEND} backend`);
  }

  // Dataset operations
  async createDataset(name) {
    return this.backend.createDataset(name);
  }

  async getAllDatasets() {
    return this.backend.getAllDatasets();
  }

  async getDataset(id) {
    return this.backend.getDataset(id);
  }

  async updateDataset(dataset) {
    return this.backend.updateDataset(dataset);
  }

  async deleteDataset(id) {
    return this.backend.deleteDataset(id);
  }

  async updateDatasetCounts(datasetId) {
    return this.backend.updateDatasetCounts(datasetId);
  }

  // Trace operations
  async addTrace(datasetId, traceData) {
    return this.backend.addTrace(datasetId, traceData);
  }

  async getTracesByDataset(datasetId) {
    return this.backend.getTracesByDataset(datasetId);
  }

  async getTrace(id) {
    return this.backend.getTrace(id);
  }

  async updateTrace(trace) {
    return this.backend.updateTrace(trace);
  }

  async deleteTrace(id) {
    return this.backend.deleteTrace(id);
  }

  async getTracesByTraceTag(tag) {
    return this.backend.getTracesByTraceTag(tag);
  }

  async getTracesByCommentTag(tag) {
    return this.backend.getTracesByCommentTag(tag);
  }

  // Comment operations
  async addComment(datasetId, commentData) {
    return this.backend.addComment(datasetId, commentData);
  }

  async getCommentsByDataset(datasetId) {
    return this.backend.getCommentsByDataset(datasetId);
  }

  async getCommentsByTrace(traceId, datasetId) {
    return this.backend.getCommentsByTrace(traceId, datasetId);
  }

  async getComment(id) {
    return this.backend.getComment(id);
  }

  async updateComment(comment) {
    return this.backend.updateComment(comment);
  }

  async deleteComment(id) {
    return this.backend.deleteComment(id);
  }

  // Config operations
  async getTraceTags() {
    return this.backend.getTraceTags();
  }

  async addTraceTag(tag) {
    return this.backend.addTraceTag(tag);
  }

  async setTraceTags(tags) {
    return this.backend.setTraceTags(tags);
  }

  // Bulk import
  async importTraces(datasetId, traces) {
    return this.backend.importTraces(datasetId, traces);
  }

  async importComments(datasetId, comments) {
    return this.backend.importComments(datasetId, comments);
  }
}

export const dataService = new DataServiceAdapter();
