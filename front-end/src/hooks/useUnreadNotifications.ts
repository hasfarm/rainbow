import { useEffect, useState } from 'react';
import { fetchNotifications } from '@/pages/requests/api';

const POLL_INTERVAL_MS = 30000;

export function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadUnreadCount() {
      const token = localStorage.getItem('hrm_auth_token');
      if (!token) {
        if (isMounted) {
          setUnreadCount(0);
        }
        return;
      }

      try {
        const records = await fetchNotifications();
        if (isMounted) {
          setUnreadCount(records.filter((item) => !item.isRead).length);
        }
      } catch {
        if (isMounted) {
          setUnreadCount(0);
        }
      }
    }

    void loadUnreadCount();

    const intervalId = window.setInterval(() => {
      void loadUnreadCount();
    }, POLL_INTERVAL_MS);

    const handleFocus = () => {
      void loadUnreadCount();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return unreadCount;
}
