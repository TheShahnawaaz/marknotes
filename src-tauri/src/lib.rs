use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::UNIX_EPOCH;
use tauri_plugin_window_state::StateFlags;

#[derive(Serialize, Deserialize)]
pub struct NoteEntry {
    pub name: String,
    pub path: String,
    pub modified: u64, // Unix timestamp in seconds
}

#[tauri::command]
fn ensure_notes_dir(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_notes(folder: String) -> Result<Vec<NoteEntry>, String> {
    let dir = Path::new(&folder);
    if !dir.exists() {
        return Ok(vec![]);
    }

    let mut entries: Vec<NoteEntry> = fs::read_dir(dir)
        .map_err(|e| e.to_string())?
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let path = entry.path();
            if path.extension()?.to_str()? != "md" {
                return None;
            }
            let name = path.file_name()?.to_str()?.to_string();
            let modified = entry
                .metadata()
                .ok()?
                .modified()
                .ok()?
                .duration_since(UNIX_EPOCH)
                .ok()?
                .as_secs();
            Some(NoteEntry {
                name,
                path: path.to_str()?.to_string(),
                modified,
            })
        })
        .collect();

    // Sort by most recently modified first
    entries.sort_by(|a, b| b.modified.cmp(&a.modified));
    Ok(entries)
}

#[tauri::command]
fn read_note(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_note(path: String, content: String) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_note(path: String) -> Result<(), String> {
    fs::remove_file(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn rename_note(old_path: String, new_path: String) -> Result<(), String> {
    if Path::new(&new_path).exists() {
        return Err(format!("A note named '{}' already exists", new_path));
    }
    fs::rename(&old_path, &new_path).map_err(|e| e.to_string())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_window_state::Builder::new()
                .with_state_flags(StateFlags::SIZE | StateFlags::POSITION)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            ensure_notes_dir,
            list_notes,
            read_note,
            write_note,
            delete_note,
            rename_note,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
