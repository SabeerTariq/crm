import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useUserBoards = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBoards = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/boards');
      setBoards(response.data.boards || []);
    } catch (err) {
      console.error('Error fetching boards:', err);
      setError('Failed to fetch boards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  return { boards, loading, error, refetch: fetchBoards };
};


