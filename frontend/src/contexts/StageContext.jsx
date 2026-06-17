import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const StageContext = createContext();

export const useStages = () => useContext(StageContext);

export const StageProvider = ({ children }) => {
  const [stages, setStages] = useState({
    1: { name: 'COO' },
    2: { name: 'Finance' },
    3: { name: 'IT' }
  });
  const [loading, setLoading] = useState(true);

  const fetchStages = async () => {
    try {
      const res = await api.get('/stages/');
      const stagesMap = {};
      res.data.forEach(stage => {
        stagesMap[stage.stage_number] = stage;
      });
      setStages(prev => ({ ...prev, ...stagesMap }));
    } catch (err) {
      console.error("Failed to fetch stages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

  return (
    <StageContext.Provider value={{ stages, fetchStages, loading }}>
      {children}
    </StageContext.Provider>
  );
};
