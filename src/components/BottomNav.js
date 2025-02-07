'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, MessageCircle, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function BottomNav() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact' })
        .eq('is_read', false)
        .neq('sender_id', user.id);

      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    // 실시간 업데이트를 위한 구독
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages'
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300">
      <div className="flex justify-around items-center h-16">
        <Link href="/" className="flex flex-col items-center">
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">홈</span>
        </Link>
        
        <Link href="/chat" className="flex flex-col items-center relative">
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
          <span className="text-xs mt-1">채팅</span>
        </Link>
        
        <Link href="/mypage" className="flex flex-col items-center">
          <User className="h-6 w-6" />
          <span className="text-xs mt-1">마이페이지</span>
        </Link>
      </div>
    </div>
  );
} 