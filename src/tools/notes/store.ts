import { create } from "zustand";
import { NoteEntry, tauriCommands } from "@/lib/tauri";

interface NotesState {
  folderPath: string;
  notes: NoteEntry[];
  activeNoteId: string | null; // note path
  isLoading: boolean;

  setFolderPath: (path: string) => void;
  loadNotes: () => Promise<void>;
  setActiveNote: (path: string | null) => void;
  refreshNotes: () => Promise<void>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  folderPath: "",
  notes: [],
  activeNoteId: null,
  isLoading: false,

  setFolderPath: (path) => set({ folderPath: path, activeNoteId: null }),

  loadNotes: async () => {
    const { folderPath } = get();
    if (!folderPath) return;
    set({ isLoading: true });
    try {
      const notes = await tauriCommands.listNotes(folderPath);
      set({ notes });
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveNote: (path) => set({ activeNoteId: path }),

  refreshNotes: async () => {
    const { folderPath } = get();
    if (!folderPath) return;
    const notes = await tauriCommands.listNotes(folderPath);
    set({ notes });
  },
}));
