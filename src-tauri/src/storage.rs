use crate::models::EyeZenState;
use std::{
    fs,
    io::Write,
    path::{Path, PathBuf},
};
use tauri::Manager;

const MAX_SETTINGS_BYTES: usize = 128_000;

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
    let metadata = fs::metadata(path).map_err(|e| format!("Cannot inspect settings: {e}"))?;
    if metadata.len() > MAX_SETTINGS_BYTES as u64 {
        return Err("Settings file exceeds the 128 KB safety limit".into());
    }
    let bytes = fs::read(path).map_err(|e| format!("Cannot read settings: {e}"))?;
    let state: EyeZenState =
        serde_json::from_slice(&bytes).map_err(|e| format!("Invalid settings file: {e}"))?;
    state.validate()?;
    Ok(state)
}

pub fn save(path: &Path, state: &EyeZenState) -> Result<(), String> {
    state.validate()?;
    // Validate the serialized bytes *before* touching existing settings. Otherwise a
    // valid in-memory state could be saved but rejected on the very next launch.
    let data = serde_json::to_vec_pretty(state).map_err(|e| e.to_string())?;
    if data.len() > MAX_SETTINGS_BYTES {
        return Err("Settings exceed the 128 KB safety limit; nothing was saved".into());
    }
    let parent = path.parent().ok_or("Invalid configuration path")?;
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
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
    // After interrupted Windows replacement, the last committed settings may
    // survive as settings.json.previous while settings.json is absent.
    if !path.exists() {
        let previous = path.with_extension("json.previous");
        if previous.exists() {
            let original = load(&previous)?;
            save(path, &original)?;
            return Ok(original);
        }
    }
    match load(path) {
        Ok(state) => Ok(state),
        Err(error) => {
            if !path.exists() {
                return Err(error);
            }
            let timestamp = chrono::Utc::now()
                .timestamp_nanos_opt()
                .ok_or("Invalid backup timestamp")?;
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
    fn recovers_previous_settings_after_interrupted_replace() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("settings.json");
        let previous = path.with_extension("json.previous");
        let state = EyeZenState::default();
        fs::write(&previous, serde_json::to_vec(&state).unwrap()).unwrap();
        assert_eq!(recover(&path).unwrap(), state);
        assert!(path.exists());
    }
    #[test]
    fn oversize_data_is_not_loaded() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("settings.json");
        fs::write(&path, vec![b'x'; 128_001]).unwrap();
        assert!(load(&path).is_err());
    }
    #[test]
    fn rejects_oversized_valid_state_before_replacing_settings() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("settings.json");
        let original = EyeZenState::default();
        save(&path, &original).unwrap();
        let bytes_before = fs::read(&path).unwrap();

        // Individually valid names and IDs can still expand when JSON escapes
        // control characters. Exercise the limit against actual serialized bytes.
        let mut large = EyeZenState::default();
        let template = large.profiles[0].clone();
        large.profiles = (0..100)
            .map(|i| {
                let mut profile = template.clone();
                profile.id = format!("{i:02}{}", "\0".repeat(68));
                profile.name = "\0".repeat(80);
                profile
            })
            .collect();
        large.active_profile_id = large.profiles[0].id.clone();
        large.schedules = (0..100)
            .map(|i| crate::models::ScheduleRule {
                id: format!("{i:02}{}", "\0".repeat(68)),
                profile_id: large.profiles[i].id.clone(),
                weekdays: vec![0, 1, 2, 3, 4, 5, 6],
                start: "09:00".into(),
                end: "17:00".into(),
                priority: 1,
                enabled: true,
            })
            .collect();

        assert!(large.validate().is_ok());
        assert!(serde_json::to_vec_pretty(&large).unwrap().len() > MAX_SETTINGS_BYTES);
        assert!(save(&path, &large).unwrap_err().contains("128 KB"));
        assert_eq!(fs::read(&path).unwrap(), bytes_before);
        assert_eq!(load(&path).unwrap(), original);
    }

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
