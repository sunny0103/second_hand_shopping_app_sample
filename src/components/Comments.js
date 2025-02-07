import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function Comments({ itemId, item }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 10;
  const queryClient = useQueryClient();

  // 댓글 목록 조회
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', itemId],
    queryFn: async () => {
      // 현재 로그인한 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      // 댓글 데이터 조회
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // 상품 작성자 정보 조회
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select('user_id')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      // 프로필 정보 조회
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, avatar_url, username')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // 댓글과 프로필 정보 합치기
      const commentsWithProfiles = commentsData.map(comment => {
        const profile = profilesData.find(p => p.id === comment.user_id);
        const isAuthor = user ? comment.user_id === user.id : false;  // 현재 로그인한 사용자와 댓글 작성자 비교
        return {
          ...comment,
          profile: profile || { email: '알 수 없음' },
          isAuthor
        };
      });

      return commentsWithProfiles;
    }
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil((comments?.length || 0) / commentsPerPage);
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = comments?.slice(indexOfFirstComment, indexOfLastComment);

  // 페이지 번호 배열 생성
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPageNumbers = 5; // 한 번에 표시할 최대 페이지 번호 수
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbers / 2));
    let endPage = Math.min(totalPages, startPage + maxPageNumbers - 1);
    
    if (endPage - startPage + 1 < maxPageNumbers) {
      startPage = Math.max(1, endPage - maxPageNumbers + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  // 댓글 작성
  const addCommentMutation = useMutation({
    mutationFn: async (newComment) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      // 현재 아이템의 작성자 정보 조회
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select('user_id, title')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      // 댓글 추가
      const { data: commentData, error: commentError } = await supabase
        .from('comments')
        .insert([
          {
            user_id: user.id,
            item_id: itemId,
            content: newComment
          }
        ])
        .select()
        .single();

      if (commentError) throw commentError;

      // 자신의 글이 아닐 경우에만 알림 생성
      if (itemData.user_id !== user.id) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert([
            {
              user_id: itemData.user_id,
              item_id: itemId,
              comment_id: commentData.id,
              message: `새로운 댓글이 달렸습니다: ${newComment.substring(0, 30)}${newComment.length > 30 ? '...' : ''}`,
            }
          ]);

        if (notificationError) throw notificationError;
      }

      // items 테이블의 comments 카운트 증가
      const { error: updateError } = await supabase
        .from('items')
        .update({ comments: (itemData.comments || 0) + 1 })
        .eq('id', itemId);

      if (updateError) throw updateError;

      return commentData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', itemId]);
      queryClient.invalidateQueries(['item', itemId]);
      setContent('');
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error('Comment submission error:', error);
      alert(error.message);
      setIsSubmitting(false);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    addCommentMutation.mutate(content);
  };

  if (isLoading) {
    return <div className="p-4">댓글을 불러오는 중...</div>;
  }

  return (
    <div className="p-4 pb-5">
      <h3 className="text-lg font-semibold mb-4">댓글 {comments?.length || 0}</h3>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 입력하세요"
            className="input input-bordered flex-1"
            disabled={isSubmitting}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? (
              <span className="loading loading-spinner"></span>
            ) : '작성'}
          </button>
        </div>
      </form>

      <div className="space-y-4 h-[400px] overflow-y-auto mb-4">
        {currentComments?.map((comment) => (
          <div key={comment.id} className="border-b border-base-300 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="font-semibold text-sm flex items-center">
                {comment.profile?.avatar_url ? (
                  <>
                    <img 
                      src={comment.profile.avatar_url} 
                      alt="프로필" 
                      className="w-6 h-6 rounded-full"
                    />
                    {comment.isAuthor && (
                      <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">작성자</span>
                    )}
                  </>
                ) : (
                  <div className="flex items-center">
                    <span>{comment.profile?.username || comment.profile?.email || '알 수 없음'}</span>
                    {comment.isAuthor && (
                      <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">작성자</span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: ko
                })}
              </div>
            </div>
            <p className="text-white text-sm">{comment.content}</p>
          </div>
        ))}
      </div>

      {/* 페이지네이션 컨트롤 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mb-16">
          <button
            className="btn btn-sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            {'<<'}
          </button>
          <button
            className="btn btn-sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            {'<'}
          </button>
          
          {getPageNumbers().map(number => (
            <button
              key={number}
              className={`btn btn-sm ${currentPage === number ? 'btn-primary' : ''}`}
              onClick={() => setCurrentPage(number)}
            >
              {number}
            </button>
          ))}
          
          <button
            className="btn btn-sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            {'>'}
          </button>
          <button
            className="btn btn-sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            {'>>'}
          </button>
        </div>
      )}
    </div>
  );
} 