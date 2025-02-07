'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';

export default function SearchModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchItems();
    } else {
      setResults([]);
    }
  }, [debouncedSearchTerm]);

  const searchItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select('id, title, price, location')
        .ilike('title', `%${debouncedSearchTerm}%`)
        .limit(10);

      if (error) throw error;
      setResults(data);
    } catch (error) {
      console.error('검색 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemClick = (itemId) => {
    router.push(`/items/${itemId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="fixed top-0 left-0 right-0 bg-base-100 p-4">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="검색어를 입력하세요"
            className="input input-bordered flex-1"
            autoFocus
          />
          <button onClick={onClose} className="btn btn-ghost btn-circle">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-120px)] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <span className="loading loading-spinner"></span>
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-base-300">
              {results.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className="py-3 cursor-pointer hover:bg-base-200"
                >
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {item.location} · {item.price.toLocaleString()}원
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm && !isLoading ? (
            <div className="text-center py-4 text-gray-500">
              검색 결과가 없습니다
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
} 