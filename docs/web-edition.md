# EyeZen Web v1.2.0 — User guide

## Open the web app
- App: https://sanskarin.github.io/EyeZen/
- Documentation: https://sanskarin.github.io/EyeZen/docs/
- Desktop releases: https://github.com/sanskarIN/EyeZen/releases/latest

EyeZen Web is a static React application hosted on GitHub Pages. It has no account, remote database, analytics or backend required for local functionality. Local storage may be unavailable in private browsing and can be cleared by the browser.

## Available web features

1. **Dashboard:** Active profile, theme, local schedule state, quick profile switch, break reminder overview.
2. **Theme Studio:** Ten presets: Light, Dark, System, Warm Dark, Warm Light, Sepia Reading, Midnight, AMOLED-Inspired, High Contrast and Grayscale. Configure an accent.
3. **Profiles:** Nine built-in work presets (Coding, Reading, Office Work, General Productivity, Gaming, Video Editing, Photo Editing, Evening Comfort, Accessibility) plus create, rename, edit, delete and select.
4. **Automation:** Weekday schedules, start/end times including overnight rules, priority and manual override while the tab runs.
5. **Break Assistant:** Optional intervals and quiet hours, in-tab reminders and countdown, dismissal, early finish and opt-in browser notifications where supported.
6. **Accessibility:** Theme contrast choices, text scale, reduced motion, semantic form labels.
7. **Settings:** Private local-storage persistence and schema-validated import/export of full settings or individual profiles.

## Persistent settings and backups

The web edition stores JSON under `eyezen.web.settings.v1` in `localStorage`, scoped to `https://sanskarin.github.io`. This is local browser storage; nothing is posted to GitHub Pages. The native desktop configuration is separate. Settings schema version 1 is preserved for compatible imports and exports. No automatic cross-device or cross-edition synchronization is provided.

The app rejects malformed/oversized saved settings with an explicit error instead of silently overwriting them. Web settings and imports are bounded by 128 KB. To migrate, choose **Settings → Export backup**, save your JSON file, then import it on the other edition.

If you clear this site's storage, use a different browser profile, block site storage or use an incognito window, your settings may not persist. Export before wiping site data.

## Optional browser notifications

The **Test notification** button requests browser permission only following your click. Subsequent notifications may be submitted while a tab is open and the permission is granted. Browser and OS policies can suppress notifications, especially when the tab is backgrounded or the device is asleep. The in-app pause banner remains separate from OS notifications.

## Browser limitations

A website **cannot** draw a desktop-wide always-on-top tint over unrelated apps, enumerate system monitors for overlay placement, adjust physical brightness, OS Night Light/Night Shift, calibrated ICC, HDR or gamma settings, guarantee background execution after closing the tab, or register OS-global keyboard shortcuts. The web UI must describe these as unsupported and avoid presenting simulated success.

When you want per-monitor visual overlays, use the desktop app on an OS/session supporting it. Linux Wayland remains unsupported for general global overlays.

## Privacy and safety

This static app does not contain an app analytics pipeline or cloud sync. GitHub Pages hosting may produce normal access logs. Do not store secrets in profiles. EyeZen is a comfort and workflow customization utility, **not medical software**.

## Testing

`src/services/web-storage.test.ts` covers first-run defaults, persistence of edited profiles and reminders, isolation of separate storage contexts, corrupt data protection, schema validation, 128 KB limits and write failures. Browser runtime acceptance on real Chrome, Firefox, Safari and mobile should be separately verified.

## Useful links
- [Complete feature and support table](feature-matrix.md)
- [Desktop platform support](platform-support.md)
- [Architecture](architecture.md)
- [Privacy](privacy.md)
- [Testing](testing.md)
- [Security](../SECURITY.md)
