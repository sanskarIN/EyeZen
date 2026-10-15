# Privacy and local storage

EyeZen is designed without sign-in, analytics, advertising or background surveillance.

## What EyeZen stores

The desktop application writes EyeZen settings to a JSON file in the operating system's app configuration directory (derived by Tauri for identifier in.sanskar.eyezen). Data includes theme selection, accent, font scale, accessibility settings, profiles, schedules, break reminder preferences, and the chosen active profile.

It does not need browser history, screenshots, microphone/camera recording, application lists, location, network cloud storage or keystroke histories.

## Network

The application itself does not require a cloud service for its core features. The React styles do not load remote fonts or remote scripts. Developer dependency installation and GitHub CI require a network connection. A link to the public repository can be opened manually from the About screen.

## Notifications and shortcuts

If enabled by the user, the notification plugin contacts the OS notification subsystem, not a remote server. Optional global shortcut registration operates through a Tauri plugin; no keystroke log is collected or persisted.

## Export, import and deletion

User-requested exports contain the chosen settings/profile in readable JSON. The user chooses whether to share such files. Imports reject invalid size/shape/ranges and unsupported schema versions. Reset restores the application's default state and writes the new state to the config file. Damaged settings are renamed to a timestamped corrupt backup for recovery; the user may delete these backups manually.

Uninstall behavior varies by OS and package manager; configurations may remain after app removal. See your OS application data locations when removing user data.

## Known limits

There are no cloud sync or automatic cross-device backups. No assurances are made about security of an unlocked local operating system account or external software with access to the config directory. Use OS disk encryption and account protections where appropriate.
