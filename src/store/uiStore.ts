import { create } from 'zustand'

/** حالة واجهة عابرة مشتركة بين مكوّنات متباعدة (لا تُحفظ). */
interface UiState {
  paletteOpen: boolean
  setPaletteOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()((set) => ({
  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
}))
