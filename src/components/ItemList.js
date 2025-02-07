'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import ItemCard from './ItemCard'
import { useLocationStore } from '@/store/locationStore'

export default function ItemList() {
  const { selectedLocation } = useLocationStore()
  
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['items', selectedLocation],
    queryFn: async () => {
      let query = supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (selectedLocation) {
        query = query.eq('location', selectedLocation)
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching items:', error)
        throw error
      }

      return data
    }
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>데이터를 불러오는데 실패했습니다.</span>
      </div>
    )
  }

  return (
    <div className="divide-y divide-base-300">
      {items?.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}