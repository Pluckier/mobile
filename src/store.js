import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ZOOM_CONFIGS } from './constants/zoomConfig';

export const useZoomStore = create(
  persist(
    (set) => ({
      zoomIndex: 1,
      setZoomIndex: (zoomIndex) => set({ zoomIndex }),
      toggleZoom: () =>
        set((state) => ({
          zoomIndex: (state.zoomIndex + 1) % ZOOM_CONFIGS.length,
        })),
    }),
    {
      name: 'zoom-level-storage',
      storage: createJSONStorage(() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage;
        }
        return AsyncStorage;
      }),
    }
  )
);

export const useStore = useZoomStore;
export default useZoomStore;
