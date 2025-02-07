import MyPage from '@/components/MyPage'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'

export default function MyPageRoute() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-16">
        <MyPage />
      </main>
      <BottomNav />
    </>
  )
} 