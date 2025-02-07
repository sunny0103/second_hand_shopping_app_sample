'use client'

import SignIn from '@/components/SignIn'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div className="min-h-screen hero bg-base-200">
      <div className="hero-content flex-col w-full max-w-md">
        <div className="card w-full shadow-2xl bg-base-100">
          <div className="card-body">
            <SignIn />
            <div className="divider">OR</div>
            <div className="text-center">
              <p className="text-sm">
                계정이 없으신가요?{' '}
                <Link href="/signup" className="link link-primary">
                  회원가입
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 