import { useCallback, useEffect, useState } from 'react';
import { userService } from '../services';
import type { User } from '../models';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    userService.getOrCreate().then((u) => {
      if (mounted) {
        setUser(u);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { user, loading };
}
