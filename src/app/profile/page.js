import ProfileEdit from '@/components/ProfileEdit'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'

export default function ProfilePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-16">
        <ProfileEdit />
      </main>
      <BottomNav />
    </>
  )
} 