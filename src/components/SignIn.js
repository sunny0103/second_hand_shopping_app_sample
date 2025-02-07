'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleSignIn = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
      // 로그인 성공 시 메인 페이지로 이동
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
      <h1 className="text-2xl font-bold">로그인</h1>
      {error && (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      )}
      <form onSubmit={handleSignIn} className="w-full max-w-full mx-auto">
        <div className="form-control">
          <label className="label">
            <span className="label-text">이메일</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input input-bordered w-full text-white"
            required
          />
          <label className="label">
            <span className="label-text">비밀번호</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input input-bordered w-full"
            required
          />
          <label className="label">
            <a href="#" className="label-text-alt link link-hover">비밀번호를 잊으셨나요?</a>
          </label>
        </div>

        <div className="form-control">
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 
              <span className="loading loading-spinner"></span> 
              : '로그인'
            }
          </button>
        </div>
      </form>
    </div>
  )
} 