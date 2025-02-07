'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import ItemDetail from '@/components/ItemDetail'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Heart } from 'lucide-react'

export default function ItemPage() {
  const params = useParams()
  const itemId = params.id
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isLiking, setIsLiking] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  
  const { data: item, isLoading, error } = useQuery({
    queryKey: ['item', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single()

      if (error) throw error
      return data
    }
  })

  useEffect(() => {
    checkLikeStatus()
  }, [itemId])

  const checkLikeStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: likes } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('item_id', itemId)

      setIsLiked(likes && likes.length > 0)
    } catch (error) {
      console.error('Error checking like status:', error)
    }
  }

  const handleLike = async () => {
    if (!item) return // item이 없으면 함수 실행하지 않음

    try {
      setIsLiking(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('로그인이 필요합니다.')
        return
      }

      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', itemId)

        await supabase
          .from('items')
          .update({ likes: item.likes - 1 })
          .eq('id', itemId)
        
        setIsLiked(false)
      } else {
        await supabase
          .from('likes')
          .insert([
            {
              user_id: user.id,
              item_id: itemId
            }
          ])

        await supabase
          .from('items')
          .update({ likes: item.likes + 1 })
          .eq('id', itemId)
        
        setIsLiked(true)
      }

      queryClient.invalidateQueries(['item', itemId])
      queryClient.invalidateQueries(['items'])
    } catch (error) {
      console.error('Error handling like:', error)
      alert('좋아요 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLiking(false)
    }
  }

  const incrementViewsMutation = useMutation({
    mutationFn: async () => {
      const { data: currentItem } = await supabase
        .from('items')
        .select('views')
        .eq('id', itemId)
        .single()
      
      const { data, error } = await supabase
        .from('items')
        .update({ 
          views: (currentItem?.views || 0) + 1 
        })
        .eq('id', itemId)
        .select()
      
      if (error) {
        console.error('Error incrementing views:', error)
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['item', itemId])
    },
    onError: (error) => {
      console.error('Mutation error:', error)
    }
  })

  useEffect(() => {
    if (item?.id && !isLoading) {
      incrementViewsMutation.mutate()
    }
  }, [item?.id])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="alert alert-error">
          <span>데이터를 불러오는데 실패했습니다: {error.message}</span>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="p-4">
        <div className="alert alert-error">
          상품을 찾을 수 없습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 left-0 right-0 bg-base-100 border-b border-base-300 z-50">
        <div className="flex items-center h-14 px-4">
          <button 
            onClick={() => router.back()} 
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="flex-1 text-center font-semibold">상품 상세</h1>
          <div className="w-10"></div>
        </div>
      </header>
      
      <main className="flex-1">
        <ItemDetail item={item} isLiked={isLiked} setIsLiked={setIsLiked} />
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300">
        <div className="flex gap-2 p-4 max-w-4xl mx-auto">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className="btn w-1/4"
          >
            <Heart 
              className={`h-6 w-6 ${isLiking ? 'animate-pulse' : ''} ${
                isLiked ? 'fill-current text-red-500' : ''
              }`} 
            />
            좋아요
          </button>
          <button 
            onClick={() => {
              const handleStartChat = async () => {
                try {
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) {
                    alert('로그인이 필요합니다')
                    return
                  }

                  // 판매자와 동일한 사용자인지 확인
                  if (user.id === item.user_id) {
                    alert('자신의 상품에는 채팅을 할 수 없습니다')
                    return
                  }

                  // 이미 존재하는 채팅방 확인
                  const { data: existingRoom } = await supabase
                    .from('chat_rooms')
                    .select('id')
                    .eq('item_id', item.id)
                    .eq('buyer_id', user.id)
                    .single()

                  if (existingRoom) {
                    router.push(`/chat/${existingRoom.id}`)
                    return
                  }

                  // 새 채팅방 생성
                  const { data: newRoom, error } = await supabase
                    .from('chat_rooms')
                    .insert([
                      {
                        item_id: item.id,
                        seller_id: item.user_id,
                        buyer_id: user.id
                      }
                    ])
                    .select()
                    .single()

                  if (error) throw error

                  router.push(`/chat/${newRoom.id}`)
                } catch (error) {
                  console.error('Error starting chat:', error)
                  alert('채팅방 생성 중 오류가 발생했습니다')
                }
              }
              handleStartChat()
            }}
            className="btn btn-primary w-3/4"
          >
            채팅하기
          </button>
        </div>
      </div>
    </div>
  )
} 