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

        // Use only tags from JSON file (JSON file is the source of truth)
        // Sync database to match JSON file exactly
        setTraceTags(tTags);
        await dataService.setTraceTags(tTags);

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
    // Handle both string and object formats
    const tagObj = typeof tag === 'string' 
      ? { id: tag, label: tag, color: '#007AFF' }
      : tag;
    
    const tagExists = traceTags.some(t => t.id === tagObj.id);
    if (!tagExists) {
      const newTags = [...traceTags, tagObj];
      setTraceTags(newTags);
      await dataService.addTraceTag(tagObj);
    }
  }

  async function removeTraceTag(tag) {
    // Handle both string and object formats
    const tagId = typeof tag === 'string' ? tag : tag.id;
    const newTags = traceTags.filter(t => t.id !== tagId);
    setTraceTags(newTags);
    await dataService.setTraceTags(newTags);
  }

  const value = {
    isDbReady,
    commentTags,
    traceTags,
    addTraceTag,
    removeTraceTag,
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
