import { invoke } from "@tauri-apps/api/core";

export interface NoteEntry {
  name: string;
  path: string;
  modified: number; // Unix timestamp in seconds
}

export const tauriCommands = {
  ensureNotesDir: (path: string) =>
    invoke<void>("ensure_notes_dir", { path }),

  listNotes: (folder: string) =>
    invoke<NoteEntry[]>("list_notes", { folder }),

  readNote: (path: string) =>
    invoke<string>("read_note", { path }),

  writeNote: (path: string, content: string) =>
    invoke<void>("write_note", { path, content }),

  deleteNote: (path: string) =>
    invoke<void>("delete_note", { path }),

  renameNote: (oldPath: string, newPath: string) =>
    invoke<void>("rename_note", { oldPath, newPath }),
};
