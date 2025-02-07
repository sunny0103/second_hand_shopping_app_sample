'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

export default function AddItemModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [image, setImage] = useState(null)
  const queryClient = useQueryClient()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // 1. 이미지를 Storage에 업로드
      const fileExt = image.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('item-images')
        .upload(filePath, image)

      if (uploadError) {
        throw uploadError
      }

      // 2. 이미지 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath)

      // 3. 현재 로그인한 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('로그인이 필요합니다.')
      }

      // 4. 상품 정보를 데이터베이스에 저장
      const { error: insertError } = await supabase
        .from('items')
        .insert([
          {
            title,
            price: Number(price),
            description,
            image_url: publicUrl,
            location,
            user_id: user.id,
            likes: 0,
            comments: 0
          }
        ])

      if (insertError) {
        throw insertError
      }

      // 성공 시 캐시 무효화 추가
      queryClient.invalidateQueries({ queryKey: ['items'] })
      
      setTitle('')
      setPrice('')
      setDescription('')
      setLocation('')
      setImage(null)
      onClose()
      
      alert('상품이 성공적으로 등록되었습니다!')
    } catch (error) {
      console.error('Error:', error)
      setError(error.message)
      alert('상품 등록 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">물건 등록하기</h3>
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">제목</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input input-bordered"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">가격</span>
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input input-bordered"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">설명</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea textarea-bordered"
              rows={4}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">위치</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input input-bordered"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">사진</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              className="file-input file-input-bordered"
              required
            />
          </div>

          <div className="modal-action">
            <button 
              type="button" 
              className="btn" 
              onClick={onClose}
              disabled={loading}
            >
              취소
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                '등록하기'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 