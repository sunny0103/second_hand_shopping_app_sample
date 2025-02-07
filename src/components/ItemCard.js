import Image from 'next/image';
import Link from 'next/link';

export default function ItemCard({ item }) {
  return (
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
            {item.price.toLocaleString()}원
          </div>
          <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
            <span>조회수 {item.views}</span>
            <span>좋아요 {item.likes}</span>
            <span>댓글 {item.comments}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}