'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfileEdit() {
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const router = useRouter()

  useEffect(() => {
    getProfile()
  }, [])

  async function getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다')

      const { data, error } = await supabase
        .from('profiles')
        .select('username, email,  avatar_url, phone')
        .eq('id', user.id)
        .single()


      if (error) throw error

      setUsername(data.username || '')
      setPhone(data.phone || '')
      setAvatarUrl(data.avatar_url || '')
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다')

      // 아바타 이미지 업로드
      let avatar_url = avatarUrl
      if (avatar) {
        const fileExt = avatar.name.split('.').pop()
        const fileName = `${user.id}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatar, { upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)
          
        avatar_url = publicUrl
      }

      // 프로필 정보 업데이트
      const updates = {
        id: user.id,
        username,
        phone,
        avatar_url,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(updates)

      if (error) throw error
      alert('프로필이 업데이트되었습니다.')
      router.refresh()
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">프로필 수정</h2>
        <div className="space-y-4">
          <div>
            <label className="label">프로필 이미지</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files[0])}
              className="file-input file-input-bordered w-full"
            />
          </div>

          <div>
            <label className="label">사용자 이름</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>

          <div>
            <label className="label">전화번호</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>

          <button
            onClick={updateProfile}
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  )
} 