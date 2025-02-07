'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import AddItemModal from './AddItemModal'

export default function AddItemButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-4 btn btn-primary rounded-xl shadow-lg"
      >
        <Plus className="h-4 w-4" />
      </button>

      <AddItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
} 