'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function MyPage() {
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'likes', 'sales'
  const [likedItems, setLikedItems] = useState([])
  const [salesItems, setSalesItems] = useState([])
  const router = useRouter()

  useEffect(() => {
    getProfile()
    if (activeTab === 'likes') {
      getLikedItems()
    } else if (activeTab === 'sales') {
      getSalesItems()
    }
  }, [activeTab])

  async function getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다')

      const { data, error } = await supabase
        .from('profiles')
        .select('username, email, avatar_url, phone, location')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setUsername(data.username || '')
      setEmail(data.email || '')
      setPhone(data.phone || '')
      setLocation(data.location || '')
      setAvatarUrl(data.avatar_url || '')
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function getLikedItems() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다')

      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select(`
          items (
            id,
            title,
            price,
            image_url,
            location,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (likesError) throw likesError

      setLikedItems(likes.map(like => like.items))
    } catch (error) {
      console.error('관심 목록 조회 오류:', error)
    }
  }

  async function getSalesItems() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다')

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setSalesItems(data)
    } catch (error) {
      console.error('판매 목록 조회 오류:', error)
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
        email,
        phone,
        location,
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

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/signin')
      router.refresh()
    } catch (error) {
      alert('로그아웃 중 오류가 발생했습니다.')
    }
  }

  // ItemCard 컴포넌트
  const ItemCard = ({ item }) => (
    <Link href={`/items/${item.id}`}>
      <div className="flex gap-3 p-4 border-b border-base-300">
        <div className="relative w-24 h-24 flex-shrink-0">
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover rounded-md"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-base mb-1">{item.title}</h3>
          <div className="text-sm text-gray-500">
            {item.location}
          </div>
          <div className="font-medium text-lg mt-1">
            {item.price?.toLocaleString()}원
          </div>
        </div>
      </div>
    </Link>
  )

  return (
    <div className="p-4">
      <div className="max-w-xl mx-auto">
        <div className="tabs tabs-boxed mb-4">
          <button 
            className={`tab ${activeTab === 'profile' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            프로필
          </button>
          <button 
            className={`tab ${activeTab === 'likes' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('likes')}
          >
            관심목록
          </button>
          <button 
            className={`tab ${activeTab === 'sales' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            판매목록
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="relative w-24 h-24">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="프로필 이미지"
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-base-300 flex items-center justify-center">
                    <span className="text-3xl">👤</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatar(e.target.files[0])}
                className="file-input file-input-bordered w-full max-w-xs"
              />
            </div>

            <div>
              <label className="label">닉네임</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label className="label">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full"
                disabled
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

            <div>
              <label className="label">동네 설정</label>
              <select 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">동네를 선택하세요</option>
                <option value="합정동">합정동</option>
                <option value="서교동">서교동</option>
                <option value="상수동">상수동</option>
                <option value="망원동">망원동</option>
                <option value="연남동">연남동</option>
              </select>
            </div>

            <button
              onClick={updateProfile}
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? '저장 중...' : '저장하기'}
            </button>

            <button
              onClick={handleSignOut}
              className="btn btn-outline btn-error w-full"
            >
              로그아웃
            </button>
          </div>
        )}

        {activeTab === 'likes' && (
          <div>
            <h2 className="text-xl font-bold mb-4">관심 목록</h2>
            <div className="divide-y divide-base-300">
              {likedItems.length > 0 ? (
                likedItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))
              ) : (
                <p className="text-center py-8 text-gray-500">
                  관심 목록이 비어있습니다
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div>
            <h2 className="text-xl font-bold mb-4">판매 목록</h2>
            <div className="divide-y divide-base-300">
              {salesItems.length > 0 ? (
                salesItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))
              ) : (
                <p className="text-center py-8 text-gray-500">
                  판매 중인 상품이 없습니다
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 