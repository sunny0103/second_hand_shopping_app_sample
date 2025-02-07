'use client'

import { Search, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import SearchModal from './SearchModal';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLocationStore } from '@/store/locationStore'

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [locations, setLocations] = useState([]);
  const router = useRouter();
  const { selectedLocation, setSelectedLocation } = useLocationStore()

  // 알림 데이터 가져오기
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('notifications')
          .select(`
            id,
            message,
            is_read,
            created_at,
            items (
              id,
              title
            ),
            comments (
              id,
              content
            )
          `)
          .eq('user_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotifications(data || []);
      } catch (error) {
        console.error('알림을 가져오는데 실패했습니다:', error);
      }
    };

    fetchNotifications();
  }, []);

  // 새로운 알림 처리
  const handleNewNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  // 웹소켓 연결
  useNotificationSocket(handleNewNotification);

  // 알림 클릭 처리
  const handleNotificationClick = async (notification) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);

      if (error) throw error;

      // 알림 목록에서 해당 알림 제거
      setNotifications(prev => 
        prev.filter(n => n.id !== notification.id)
      );

      // 해당 아이템으로 이동
      router.push(`/items/${notification.item_id}`);
      setShowNotifications(false);
    } catch (error) {
      console.error('알림 처리 중 오류 발생:', error);
    }
  };

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('location')
          .not('location', 'is', null);

        if (error) throw error;

        // 중복 제거하고 정렬
        const uniqueLocations = [...new Set(data.map(item => item.location))]
          .filter(Boolean)
          .sort();

        setLocations(uniqueLocations);
      } catch (error) {
        console.error('동네 목록을 가져오는데 실패했습니다:', error);
      }
    };

    fetchLocations();
  }, []);

  return (
    <header className="sticky top-0 left-0 right-0 bg-base-100 border-b border-base-300 z-50">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex-1 max-w-[140px]">
          <select 
            className="select select-bordered select-sm w-full"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="">전체 동네</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className="btn btn-ghost btn-circle"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </button>
          <div className="relative">
            <button 
              className="btn btn-ghost btn-circle"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
              <Bell className="h-5 w-5" />
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-base-100 rounded-lg shadow-lg border border-base-300">
                <div className="p-4">
                  {notifications.length > 0 ? (
                    <div className="space-y-2">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className="p-2 hover:bg-base-200 rounded-lg cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <p className="text-sm">{notification.message}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">새로운 알림이 없습니다</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
} 