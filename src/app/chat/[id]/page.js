'use client'

import { useParams } from 'next/navigation'
import ChatRoom from '@/components/ChatRoom'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ChatPage() {
  const params = useParams()

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 left-0 right-0 bg-base-100 border-b border-base-300 z-50">
        <div className="flex items-center h-14 px-4">
          <Link href="/chat" className="btn btn-ghost btn-circle">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="flex-1 text-center font-semibold">채팅</h1>
          <div className="w-10"></div>
        </div>
      </header>
      
      <main className="flex-1">
        <ChatRoom roomId={params?.id} />
      </main>
    </div>
  )
} 