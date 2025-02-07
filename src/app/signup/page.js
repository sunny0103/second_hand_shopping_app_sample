'use client'

import SignUp from '@/components/SignUp'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <div className="min-h-screen hero bg-base-200">
      <div className="hero-content flex-col w-full max-w-sm">
        <div className="card w-full shadow-2xl bg-base-100">
          <div className="card-body">
            <SignUp />
            <div className="divider">OR</div>
            <div className="text-center">
              <p className="text-sm">
                이미 계정이 있으신가요?{' '}
                <Link href="/signin" className="link link-primary">
                  로그인
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 