import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DatasetUpload } from './components/DatasetUpload';
import { DatasetList } from './components/DatasetList';
import { TraceList } from './components/TraceList';
import { TraceDetail } from './components/TraceDetail';
import { CrossDatasetView } from './components/CrossDatasetView';
import { dataService } from './services/dataService';

function AppContent() {
  const { isDbReady, traceTags, commentTags } = useApp();
  const [view, setView] = useState('datasets'); // 'datasets', 'upload', 'traces', 'detail', 'cross-dataset'
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [selectedTrace, setSelectedTrace] = useState(null);
  const [allTraces, setAllTraces] = useState([]);
  const [selectedTagType, setSelectedTagType] = useState(null);
  const [selectedTagValues, setSelectedTagValues] = useState([]);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [tempSelectedTags, setTempSelectedTags] = useState({ trace: [], comment: [] });

  async function handleSelectDataset(dataset) {
    setSelectedDataset(dataset);
    const traces = await dataService.getTracesByDataset(dataset.id);
    setAllTraces(traces);
    setView('traces');
  }

  async function handleSelectTrace(trace) {
    setSelectedTrace(trace);
    setView('detail');
  }

  function handleNavigateTrace(direction) {
    const currentIndex = allTraces.findIndex(t => t.id === selectedTrace.id);
    if (direction === 'next' && currentIndex < allTraces.length - 1) {
      setSelectedTrace(allTraces[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setSelectedTrace(allTraces[currentIndex - 1]);
    }
  }

  function handleBackToDatasets() {
    setView('datasets');
    setSelectedDataset(null);
    setSelectedTrace(null);
    setAllTraces([]);
    setSelectedTagType(null);
    setSelectedTagValues([]);
    setShowTagFilter(false);
    setTempSelectedTags({ trace: [], comment: [] });
  }

  function handleToggleTag(tagType, tagId) {
    setTempSelectedTags(prev => {
      const currentTags = prev[tagType];
      const newTags = currentTags.includes(tagId)
        ? currentTags.filter(t => t !== tagId)
        : [...currentTags, tagId];
      return { ...prev, [tagType]: newTags };
    });
  }

  function handleApplyFilter() {
    // Determine which tag type has selections
    if (tempSelectedTags.trace.length > 0) {
      setSelectedTagType('trace');
      setSelectedTagValues(tempSelectedTags.trace);
      setView('cross-dataset');
      setShowTagFilter(false);
    } else if (tempSelectedTags.comment.length > 0) {
      setSelectedTagType('comment');
      setSelectedTagValues(tempSelectedTags.comment);
      setView('cross-dataset');
      setShowTagFilter(false);
    }
  }

  function handleClearFilter() {
    setTempSelectedTags({ trace: [], comment: [] });
  }

  function handleBackToTraces() {
    setView('traces');
    setSelectedTrace(null);
  }

  async function handleUploadComplete(datasetId) {
    const dataset = await dataService.getDataset(datasetId);
    handleSelectDataset(dataset);
  }

  if (!isDbReady) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Navigation */}
      {view === 'datasets' && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">LM Trace Review</h1>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowTagFilter(!showTagFilter)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter by Tag
                </button>
                {showTagFilter && (
                  <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Trace Tags (select multiple)</h3>
                      <div className="flex flex-wrap gap-2">
                        {traceTags.map((tag) => {
                          const tagId = typeof tag === 'string' ? tag : tag.id;
                          const tagLabel = typeof tag === 'string' ? tag : tag.label;
                          const tagColor = typeof tag === 'string' ? '#007AFF' : tag.color;
                          const isSelected = tempSelectedTags.trace.includes(tagId);
                          return (
                            <button
                              key={tagId}
                              onClick={() => handleToggleTag('trace', tagId)}
                              className={`px-3 py-1 rounded text-sm transition-all ${
                                isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : 'opacity-60 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: tagColor, color: 'white' }}
                            >
                              {isSelected && '✓ '}
                              {tagLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Comment Tags (select multiple)</h3>
                      <div className="flex flex-wrap gap-2">
                        {commentTags.map((tag) => {
                          const isSelected = tempSelectedTags.comment.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              onClick={() => handleToggleTag('comment', tag.id)}
                              className={`px-3 py-1 rounded text-sm transition-all ${
                                isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : 'opacity-60 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: tag.color, color: 'white' }}
                            >
                              {isSelected && '✓ '}
                              {tag.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-3 p-2 bg-gray-50 rounded">
                      Selected: {tempSelectedTags.trace.length + tempSelectedTags.comment.length} tag(s)
                      {tempSelectedTags.trace.length > 0 && tempSelectedTags.comment.length > 0 && (
                        <span className="text-orange-600 ml-2">⚠ Only one tag type can be filtered at a time</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleApplyFilter}
                        disabled={tempSelectedTags.trace.length === 0 && tempSelectedTags.comment.length === 0}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Apply Filter
                      </button>
                      <button
                        onClick={handleClearFilter}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setShowTagFilter(false)}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setView('upload')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + Upload Dataset
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'upload' && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <button
            onClick={() => setView('datasets')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Datasets
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'datasets' && (
          <div className="p-6">
            <DatasetList onSelectDataset={handleSelectDataset} />
          </div>
        )}

        {view === 'upload' && (
          <div className="p-6">
            <DatasetUpload onComplete={handleUploadComplete} />
          </div>
        )}

        {view === 'traces' && selectedDataset && (
          <TraceList
            dataset={selectedDataset}
            onSelectTrace={handleSelectTrace}
            onBack={handleBackToDatasets}
          />
        )}

        {view === 'detail' && selectedTrace && selectedDataset && (
          <TraceDetail
            trace={selectedTrace}
            dataset={selectedDataset}
            onBack={handleBackToTraces}
            onNavigate={handleNavigateTrace}
          />
        )}

        {view === 'cross-dataset' && selectedTagType && selectedTagValues.length > 0 && (
          <CrossDatasetView
            tagType={selectedTagType}
            tagValues={selectedTagValues}
            onBack={handleBackToDatasets}
            onSelectTrace={handleSelectTrace}
          />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
