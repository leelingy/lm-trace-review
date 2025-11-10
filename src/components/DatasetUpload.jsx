import { useState } from 'react';
import { parseCSV, validateTraceCSV, validateCommentCSV, normalizeTraceData, normalizeCommentData } from '../utils/csvParser';
import { dataService } from '../services/dataService';
import { useApp } from '../context/AppContext';

export function DatasetUpload({ onComplete }) {
  const { refreshDatasets } = useApp();
  const [datasetName, setDatasetName] = useState('');
  const [traceFile, setTraceFile] = useState(null);
  const [commentFile, setCommentFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  async function handleUpload() {
    if (!datasetName.trim()) {
      setError('Please enter a dataset name');
      return;
    }

    if (!traceFile) {
      setError('Please select a trace CSV file');
      return;
    }

    setIsUploading(true);
    setError('');
    setProgress('Parsing trace CSV...');

    try {
      // Parse trace CSV
      const traceData = await parseCSV(traceFile);
      const traceValidation = validateTraceCSV(traceData);
      if (!traceValidation.valid) {
        throw new Error(traceValidation.error);
      }

      // Parse comment CSV if provided
      let commentData = [];
      if (commentFile) {
        setProgress('Parsing comment CSV...');
        commentData = await parseCSV(commentFile);
        const commentValidation = validateCommentCSV(commentData);
        if (!commentValidation.valid) {
          throw new Error(commentValidation.error);
        }
      }

      // Create dataset
      setProgress('Creating dataset...');
      const datasetId = await dataService.createDataset(datasetName);

      // Import traces
      setProgress(`Importing ${traceData.length} traces...`);
      const normalizedTraces = normalizeTraceData(traceData);
      await dataService.importTraces(datasetId, normalizedTraces);

      // Import comments
      if (commentData.length > 0) {
        setProgress(`Importing ${commentData.length} comments...`);
        const normalizedComments = normalizeCommentData(commentData);
        await dataService.importComments(datasetId, normalizedComments);
      }

      // Update dataset counts
      await dataService.updateDatasetCounts(datasetId);

      setProgress('Upload complete!');
      await refreshDatasets();

      // Reset form
      setTimeout(() => {
        setDatasetName('');
        setTraceFile(null);
        setCommentFile(null);
        setProgress('');
        if (onComplete) onComplete(datasetId);
      }, 1000);

    } catch (err) {
      setError(err.message);
      setProgress('');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Upload New Dataset</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dataset Name
          </label>
          <input
            type="text"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Production Traces - Nov 2025"
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trace CSV (Required)
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setTraceFile(e.target.files[0])}
            className="w-full"
            disabled={isUploading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Must include: trace_id, date, time, input, message
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comment CSV (Optional)
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setCommentFile(e.target.files[0])}
            className="w-full"
            disabled={isUploading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Must include: trace_id, comment
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {progress && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
            {progress}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {isUploading ? 'Uploading...' : 'Upload Dataset'}
        </button>
      </div>
    </div>
  );
}
