'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'

export default function ChatList() {
  const queryClient = useQueryClient()
  const { data: chatRooms, isLoading } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다')

      // 채팅방과 마지막 메시지를 한 번에 조회
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          item:items(id, title, image_url),
          seller:users!seller_id(id, email),
          buyer:users!buyer_id(id, email),
          messages:chat_messages(
            id,
            content,
            created_at,
            sender_id,
            is_read
          )
        `)
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // 데이터 가공
      return data.map(room => {
        const unreadMessages = room.messages.filter(
          msg => !msg.is_read && msg.sender_id !== user.id
        )
        const lastMessage = room.messages[0]

        return {
          ...room,
          unread_messages: unreadMessages.length,
          lastMessage
        }
      })
    },
    staleTime: 1000 * 60, // 1분 동안 캐시 유지
    cacheTime: 1000 * 60 * 5 // 5분 동안 캐시 보관
  })

  useEffect(() => {
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages'
      }, () => {
        queryClient.invalidateQueries(['chatRooms'])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  if (isLoading) {
    return <div className="p-4">로딩중...</div>
  }

  return (
    <div className="divide-y divide-base-300">
      {chatRooms?.map((room) => (
        <Link key={room.id} href={`/chat/${room.id}`}>
          <div className="flex items-center gap-4 p-4">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src={room.item.image_url}
                alt={room.item.title}
                fill
                className="object-cover rounded-full"
              />
              {room.unread_messages > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {room.unread_messages}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{room.item.title}</h3>
              <p className="text-sm text-gray-500 truncate">
                {room.lastMessage?.content || '새로운 채팅방입니다'}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
} 