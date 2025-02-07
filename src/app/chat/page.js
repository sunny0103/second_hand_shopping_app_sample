import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import ChatList from '@/components/ChatList'

export default function ChatPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-16">
        <ChatList />
      </main>
      <BottomNav />
    </>
  )
} 