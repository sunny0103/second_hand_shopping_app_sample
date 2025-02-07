import Image from "next/image";
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ItemList from '@/components/ItemList';
import AddItemButton from '@/components/AddItemButton';

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-16">
        <ItemList />
        <AddItemButton />
      </main>
      <BottomNav />
    </>
  );
}
