import Image from 'next/image';
import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import Comments from './Comments';
import { useRouter } from 'next/navigation';

export default function ItemDetail({ item }) {
  const [isLiking, setIsLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  // 초기 좋아요 상태 확인
  useEffect(() => {
    checkLikeStatus();
  }, []);

  const checkLikeStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
  
      const { data: likes } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('item_id', item.id);
  
      setIsLiked(likes && likes.length > 0);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };
  
  const handleLike = async () => {
    try {
      setIsLiking(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }

      if (isLiked) {
        // 좋아요 취소
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', item.id);

        // items 테이블의 likes 직접 업데이트
        await supabase
          .from('items')
          .update({ likes: item.likes - 1 })
          .eq('id', item.id);
        
        setIsLiked(false);
      } else {
        // 좋아요 추가
        await supabase
          .from('likes')
          .insert([
            {
              user_id: user.id,
              item_id: item.id
            }
          ]);

        // items 테이블의 likes 직접 업데이트
        await supabase
          .from('items')
          .update({ likes: item.likes + 1 })
          .eq('id', item.id);
        
        setIsLiked(true);
      }

      // 캐시 무효화하여 UI 업데이트
      queryClient.invalidateQueries(['item', item.id]);
      queryClient.invalidateQueries(['items']); // 목록도 업데이트
    } catch (error) {
      console.error('Error handling like:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLiking(false);
    }
  };
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


  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-4">
        <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px]">
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-contain rounded-lg"
            priority
          />
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-4">{item.title}</h1>
          <div className="text-gray-500">{item.location}</div>
          <div className="text-2xl font-bold mb-4">
            {item.price.toLocaleString()}원
          </div>
          <p className="text-gray-700 whitespace-pre-line">
            {item.description}  
          </p>
        </div>

        <div className="flex gap-4 text-gray-500 border-t pt-4">
          <div className="flex items-center gap-1">
            <span>조회수 {item.views}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>관심 {item.likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>댓글 {item.comments}</span>
          </div>
        </div>
      </div>
      
      <div className="border-t border-base-300">
        <Comments itemId={item.id} item={item} />
      </div>

      <button 
        onClick={handleStartChat} 
        className="btn btn-primary w-3/4"
      >
        채팅하기
      </button>
    </div>

  );
}