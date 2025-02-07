'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      
      // 회원가입 성공 시 메인 페이지로 이동
      alert('가입 확인 이메일을 확인해주세요.')
      router.push('/')
      router.refresh()
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">회원가입</h1>
      {error && (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      )}
      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">이메일</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input input-bordered"
            required
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">비밀번호</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input input-bordered"
            required
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">비밀번호 확인</span>
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input input-bordered"
            required
          />
        </div>
        <div className="form-control mt-6">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 
              <span className="loading loading-spinner"></span> 
              : '회원가입'
            }
          </button>
        </div>
      </form>
    </div>
  )
} 