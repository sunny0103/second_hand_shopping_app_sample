import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useNotificationSocket(onNewNotification) {
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            onNewNotification(payload.new);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    setupSubscription();
  }, [onNewNotification]);
} 