import { create } from "zustand";

interface YoutubeMiniplayerState {
  url: string | null;
  title: string | undefined;
  open: (url: string, title?: string) => void;
  close: () => void;
}

export const useYoutubeMiniplayerStore = create<YoutubeMiniplayerState>(
  (set) => ({
    url: null,
    title: undefined,
    open: (url, title) => set({ url, title }),
    close: () => set({ url: null, title: undefined }),
  }),
);
