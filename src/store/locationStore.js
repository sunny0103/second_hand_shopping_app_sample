import { create } from 'zustand'

export const useLocationStore = create((set) => ({
  selectedLocation: '',
  setSelectedLocation: (location) => set({ selectedLocation: location }),
})) 