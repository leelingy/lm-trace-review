import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DatasetUpload } from './components/DatasetUpload';
import { DatasetList } from './components/DatasetList';
import { TraceList } from './components/TraceList';
import { TraceDetail } from './components/TraceDetail';
import { dataService } from './services/dataService';

function AppContent() {
  const { isDbReady } = useApp();
  const [view, setView] = useState('datasets'); // 'datasets', 'upload', 'traces', 'detail'
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [selectedTrace, setSelectedTrace] = useState(null);
  const [allTraces, setAllTraces] = useState([]);

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
            <button
              onClick={() => setView('upload')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Upload Dataset
            </button>
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
