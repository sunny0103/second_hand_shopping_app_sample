'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { Send } from 'lucide-react'

export default function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef(null)
  const queryClient = useQueryClient()
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()
  }, [])

  const { data: room } = useQuery({
    queryKey: ['chatRoom', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          item:items(*),
          seller:users!seller_id(*),
          buyer:users!buyer_id(*)
        `)
        .eq('id', roomId)
        .single()

      if (error) throw error
      return data
    }
  })

  const { data: messages } = useQuery({
    queryKey: ['messages', roomId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다')

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, sender:users(*)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // 메시지를 읽음으로 표시
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .neq('sender_id', user.id)

      return data
    },
    // 실시간 업데이트를 위한 설정 변경
    refetchInterval: 1000, // 1초마다 자동으로 새로운 메시지 확인
    staleTime: 0, // 데이터를 항상 최신으로 유지
    cacheTime: Infinity
  })

  const sendMessage = useMutation({
    mutationFn: async (content) => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('로그인이 필요합니다')

        const { error } = await supabase
          .from('chat_messages')
          .insert([
            {
              room_id: roomId,
              sender_id: user.id,
              content
            }
          ])

        if (error) throw error
      } catch (error) {
        console.error('메시지 전송 오류:', error)
        throw new Error('메시지 전송에 실패했습니다')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', roomId])
      setMessage('')
    },
    onError: (error) => {
      alert(error.message)
    }
  })

  useEffect(() => {
    const channel = supabase
      .channel(`room=${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        // 메시지 목록을 즉시 갱신
        queryClient.invalidateQueries(['messages', roomId])
        
        // 새 메시지가 도착했고, 내가 보낸 메시지가 아닌 경우에만 읽음 처리
        if (payload.eventType === 'INSERT' && payload.new.sender_id !== currentUser?.id) {
          supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('id', payload.new.id)
          
          // 스크롤을 아래로 이동
          scrollToBottom()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, queryClient, currentUser])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!message.trim()) return
    sendMessage.mutate(message)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((msg) => {
          const isMyMessage = msg.sender_id === currentUser?.id
          return (
            <div
              key={msg.id}
              className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] break-words rounded-lg p-3 
                ${isMyMessage ? 'bg-primary text-white' : 'bg-base-200'}`}
              >
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-base-300">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="메시지를 입력하세요"
            className="input input-bordered flex-1"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!message.trim() || sendMessage.isLoading}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  )
} 