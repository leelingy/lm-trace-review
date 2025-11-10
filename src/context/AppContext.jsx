import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../utils/db';
import { dataService } from '../services/dataService';
import { loadCommentTags, loadTraceTags } from '../utils/configLoader';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [isDbReady, setIsDbReady] = useState(false);
  const [commentTags, setCommentTags] = useState([]);
  const [traceTags, setTraceTags] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [currentDataset, setCurrentDataset] = useState(null);

  useEffect(() => {
    async function initializeApp() {
      try {
        const storageBackend = import.meta.env.VITE_STORAGE_BACKEND || 'indexeddb';

        // Initialize IndexedDB only if using it as backend
        if (storageBackend === 'indexeddb') {
          await db.init();
        }
        setIsDbReady(true);

        // Load configurations
        const cTags = await loadCommentTags();
        const tTags = await loadTraceTags();
        setCommentTags(cTags);

        // Check if trace tags are in DB, otherwise use config
        const dbTags = await dataService.getTraceTags();
        if (dbTags.length > 0) {
          setTraceTags(dbTags);
        } else {
          setTraceTags(tTags);
          await dataService.setTraceTags(tTags);
        }

        // Load datasets
        await refreshDatasets();
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    }

    initializeApp();
  }, []);

  async function refreshDatasets() {
    const allDatasets = await dataService.getAllDatasets();
    setDatasets(allDatasets);
  }

  async function addTraceTag(tag) {
    if (!traceTags.includes(tag)) {
      const newTags = [...traceTags, tag];
      setTraceTags(newTags);
      await dataService.addTraceTag(tag);
    }
  }

  const value = {
    isDbReady,
    commentTags,
    traceTags,
    addTraceTag,
    datasets,
    refreshDatasets,
    currentDataset,
    setCurrentDataset
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
