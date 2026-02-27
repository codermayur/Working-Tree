import { useState, useEffect, useCallback } from 'react';
import { fetchSchemes, getCategories } from '../services/schemes.service';

export function useSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchSchemes();
      setSchemes(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.message || 'Failed to load schemes');
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = getCategories(schemes);

  return { schemes, categories, loading, error, refetch: load };
}
