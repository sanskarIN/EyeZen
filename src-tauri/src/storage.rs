use crate::models::EyeZenState;
use std::{
    fs,
    io::Write,
    path::{Path, PathBuf},
};
use tauri::Manager;

pub fn state_path<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> Result<PathBuf, String> {
    app.path()
        .app_config_dir()
        .map(|p| p.join("settings.json"))
        .map_err(|e| e.to_string())
}

pub fn load(path: &Path) -> Result<EyeZenState, String> {
    if !path.exists() {
        return Ok(EyeZenState::default());
    }
    let bytes = fs::read(path).map_err(|e| format!("Cannot read settings: {e}"))?;
    let state: EyeZenState =
        serde_json::from_slice(&bytes).map_err(|e| format!("Invalid settings file: {e}"))?;
    state.validate()?;
    Ok(state)
}

pub fn save(path: &Path, state: &EyeZenState) -> Result<(), String> {
    state.validate()?;
    let parent = path.parent().ok_or("Invalid configuration path")?;
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    let data = serde_json::to_vec_pretty(state).map_err(|e| e.to_string())?;
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_nanos();
    let tmp = parent.join(format!(".settings-{stamp}.tmp"));
    let result = (|| -> std::io::Result<()> {
        let mut file = fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&tmp)?;
        file.write_all(&data)?;
        file.sync_all()?;
        #[cfg(target_os = "windows")]
        if path.exists() {
            // Windows may not replace a destination with rename; retain a recoverable backup.
            let backup = path.with_extension("json.previous");
            if backup.exists() {
                fs::remove_file(&backup)?;
            }
            fs::rename(path, &backup)?;
            if let Err(error) = fs::rename(&tmp, path) {
                let _ = fs::rename(&backup, path);
                return Err(error);
            }
            return Ok(());
        }
        fs::rename(&tmp, path)
    })();
    if result.is_err() {
        let _ = fs::remove_file(&tmp);
    }
    result.map_err(|e| format!("Unable to save settings: {e}"))
}

pub fn recover(path: &Path) -> Result<EyeZenState, String> {
    match load(path) {
        Ok(state) => Ok(state),
        Err(error) => {
            if !path.exists() {
                return Err(error);
            }
            let timestamp = chrono::Utc::now().timestamp();
            let corrupt = path.with_extension(format!("corrupt-{timestamp}.json"));
            fs::rename(path, corrupt).map_err(|e| format!("{error}; backup failed: {e}"))?;
            let state = EyeZenState::default();
            save(path, &state)?;
            Ok(state)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn save_load_and_recover() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("settings.json");
        save(&path, &EyeZenState::default()).unwrap();
        assert_eq!(load(&path).unwrap(), EyeZenState::default());
        fs::write(&path, "{invalid").unwrap();
        assert!(load(&path).is_err());
        assert!(recover(&path).is_ok());
        assert!(dir.path().read_dir().unwrap().any(|e| e
            .unwrap()
            .file_name()
            .to_string_lossy()
            .contains("corrupt")));
    }
}
