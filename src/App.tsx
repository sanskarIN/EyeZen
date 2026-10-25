import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity, Accessibility, Bell, BookOpen, Check, ChevronRight, Clock3, Code2,
  Download, Eye, Focus, Gauge, Heart, Info, Keyboard, Laptop, LayoutDashboard,
  Monitor, Moon, Palette, Pause, Play, Plus, RotateCcw, Settings2, Shield,
  SlidersHorizontal, Sparkles, Sun, Trash2, Upload, WandSparkles
} from "lucide-react";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import type { ComfortProfile, EyeZenState, OverlayResult, PlatformReport, ScheduleRule } from "./types";
import { createDefaults, newBreaks, newComfort, themes } from "./defaults";
import { APP_VERSION } from "./version";
import { activeSchedule, applyComfortOverlay, desktop, loadState, notifyBreak, platformReport, requestDesktopNotificationPermission, requestWebNotificationPermission, saveState } from "./services/native";
import { exportJson, parseProfile, readJson, validateBackup } from "./services/imports";
import { clearWebState, readRawWebState } from "./services/web-storage";
import { validTime } from "./services/schedule";
import { evaluateBreak } from "./services/reminders";
import { secondsUntil } from "./services/pause";
import { Empty, Panel, Range, Status, Toggle } from "./components/ui";
import { ProfileNameField } from "./components/ProfileNameField";
import { activateProfile, removeProfile } from "./services/profiles";

const navigation = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
  { id: "comfort", name: "Eye Comfort", icon: Eye },
  { id: "themes", name: "Theme Studio", icon: Palette },
  { id: "profiles", name: "Profiles", icon: SlidersHorizontal },
  { id: "automation", name: "Automation", icon: Clock3 },
  { id: "breaks", name: "Break Assistant", icon: Focus },
  { id: "displays", name: "Displays", icon: Monitor },
  { id: "accessibility", name: "Accessibility", icon: Accessibility },
  { id: "settings", name: "Settings", icon: Settings2 },
  { id: "about", name: "About EyeZen", icon: Info },
] as const;
type Screen = (typeof navigation)[number]["id"];
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const shortcut = "CommandOrControl+Shift+E";

const titles: Record<Screen, { title: string; eyebrow: string; description: string }> = {
  dashboard: { title: "Make your space feel right.", eyebrow: "WELCOME TO EYEZEN", description: "Your display preferences, workspace profiles, and screen-time routines in one place." },
  comfort: { title: "Comfort, on your terms.", eyebrow: "EYE COMFORT", description: "Save your preferences and see exactly which display controls your system supports." },
  themes: { title: "A space that feels like yours.", eyebrow: "THEME STUDIO", description: "Choose a thoughtful palette and make EyeZen comfortable to use." },
  profiles: { title: "One workspace, many moods.", eyebrow: "COMFORT PROFILES", description: "Switch your EyeZen preferences for different kinds of work." },
  automation: { title: "Your routines, made easier.", eyebrow: "AUTOMATION", description: "Set schedules with clear priorities and complete manual control." },
  breaks: { title: "Give your attention room.", eyebrow: "BREAK ASSISTANT", description: "Gentle reminders that fit around the way you work." },
  displays: { title: "Know what's supported.", eyebrow: "DISPLAY MANAGEMENT", description: "Real backend capabilities, not simulated hardware controls." },
  accessibility: { title: "Made for how you work.", eyebrow: "ACCESSIBILITY CENTER", description: "More readable text, calmer motion, and comfortable contrast." },
  settings: { title: "Everything in its place.", eyebrow: "PREFERENCES", description: "Local settings, keyboard shortcuts, and safe backup controls." },
  about: { title: "A calmer digital environment.", eyebrow: "ABOUT EYEZEN", description: "An open-source, local-first tool built around user choice." },
};

function safeProfileName(p?: ComfortProfile) { return p?.name ?? "No profile"; }
function SectionDescription({ children }: { children: ReactNode }) { return <p className="section-caption">{children}</p>; }

export default function App() {
  const [data, setData] = useState<EyeZenState | null>(null);
  const [report, setReport] = useState<PlatformReport | null>(null);
  const [overlayStatus, setOverlayStatus] = useState<OverlayResult | null>(null);
  const overlayQueue = useRef<Promise<void>>(Promise.resolve());
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [selectedProfile, setSelectedProfile] = useState<string>("productivity");
  const [notification, setNotification] = useState("");
  const [loadError, setLoadError] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [shortcutActive, setShortcutActive] = useState(false);
  const [breakPaused, setBreakPaused] = useState(false);
  const [sessionBreaks, setSessionBreaks] = useState(0);
  const [breakDue, setBreakDue] = useState(false);
  const [pauseRemaining, setPauseRemaining] = useState(0);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const lastBreakAt = useRef(Date.now());
  const pauseEndsAt = useRef<number | null>(null);
  const skipFirstSave = useRef(true);
  const [darkSystem, setDarkSystem] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setDarkSystem(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([loadState(), platformReport()]).then(([settings, capabilities]) => {
      if (!alive) return;
      setData(settings);
      setReport(capabilities);
      setSelectedProfile(settings.activeProfileId);
      setHasLoaded(true);
    }).catch(error => {
      if (alive) setLoadError(String(error));
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!data || !hasLoaded) return;
    if (skipFirstSave.current) { skipFirstSave.current = false; return; }
    const snapshot = data;
    saveQueue.current = saveQueue.current.catch(() => undefined).then(() => saveState(snapshot))
      .catch(error => setNotification("Could not save settings: " + String(error)));
  }, [data, hasLoaded]);

  useEffect(() => {
    if (!desktop) return;
    const onEmergencyOff = () => {
      change(current => ({ ...current, comfort: { ...current.comfort, enabled: false } }));
      setOverlayStatus({
        status: "disabled", displayCount: 0,
        message: "Screen comfort disabled from the EyeZen tray. All tint windows removed.",
      });
    };
    window.addEventListener("eyezen:comfort-off", onEmergencyOff);
    return () => window.removeEventListener("eyezen:comfort-off", onEmergencyOff);
  }, []);

  // Keep every detected monitor in sync with the applied profile, including
  // restored settings after relaunch. Native overlays never intercept input.
  function syncDesktopComfort(settings: EyeZenState["comfort"]) {
    overlayQueue.current = overlayQueue.current.catch(() => undefined).then(async () => {
      try {
        setOverlayStatus(await applyComfortOverlay(settings));
      } catch (error) {
        setOverlayStatus({ status: "unavailable", message: "Comfort overlay failed: " + String(error), displayCount: 0 });
      }
    });
  }
  useEffect(() => {
    if (!desktop || !data || !hasLoaded) return;
    const id = window.setTimeout(() => syncDesktopComfort(data.comfort), data.comfort.enabled ? 160 : 0);
    return () => window.clearTimeout(id);
  }, [hasLoaded, data?.comfort.enabled, data?.comfort.warmth, data?.comfort.intensity]);

  // Refresh screen geometry after display hotplug, resolution or DPI changes.
  useEffect(() => {
    if (!desktop || !data?.comfort.enabled) return;
    const id = window.setInterval(() => syncDesktopComfort(data.comfort), 20_000);
    return () => window.clearInterval(id);
  }, [data?.comfort.enabled, data?.comfort.warmth, data?.comfort.intensity]);

  const theme = useMemo(() => {
    const name = data?.theme === "system" ? (darkSystem ? "dark" : "light") : data?.theme;
    return themes.find(t => t.id === name) ?? themes[1];
  }, [data?.theme, darkSystem]);

  useEffect(() => {
    const root = document.documentElement;
    const colors: Record<string, string | number> = {
      "--bg": theme.background, "--surface": theme.surface, "--fg": theme.foreground,
      "--muted": theme.muted, "--border": theme.border, "--accent": data?.accent ?? "#81cbb0",
      "--font-scale": data?.textScale ?? 1,
    };
    Object.entries(colors).forEach(([key, value]) => root.style.setProperty(key, String(value)));
    root.dataset.motion = data?.reducedMotion ? "reduced" : "full";
  }, [theme, data?.accent, data?.textScale, data?.reducedMotion]);

  function change(updater: (current: EyeZenState) => EyeZenState) {
    setData(previous => previous ? updater(previous) : previous);
  }
  function patch(partial: Partial<EyeZenState>) { change(s => ({ ...s, ...partial })); }
  function applyProfile(id: string, manual = true) {
    change(s => activateProfile(s, id, manual));
    setSelectedProfile(id);
    setNotification("Profile applied. Unsupported display controls were not changed.");
  }
  function changeProfile(id: string, update: (p: ComfortProfile) => ComfortProfile) {
    change(s => ({ ...s, profiles: s.profiles.map(p => p.id === id ? update(p) : p) }));
  }
  function newProfile() {
    if (!data || data.profiles.length >= 100) { setNotification("Maximum 100 profiles."); return; }
    const base = data.profiles.find(p => p.id === data.activeProfileId);
    const profile: ComfortProfile = { id: crypto.randomUUID(), name: "My Workspace", theme: data.theme,
      comfort: { ...(base?.comfort ?? newComfort()) }, breaks: { ...(base?.breaks ?? newBreaks()) } };
    change(s => ({ ...s, profiles: [...s.profiles, profile] }));
    setSelectedProfile(profile.id);
    setScreen("profiles");
  }
  function deleteProfile(id: string) {
    if (!data || data.profiles.length < 2) { setNotification("Keep at least one profile."); return; }
    if (!window.confirm("Delete this profile and its associated schedules?")) return;
    change(s => removeProfile(s, id));
    setSelectedProfile(data.profiles.find(p => p.id !== id)?.id ?? "");
  }
  function addSchedule() {
    if (!data || data.schedules.length >= 100) { setNotification("Maximum 100 schedules."); return; }
    const rule: ScheduleRule = { id: crypto.randomUUID(), profileId: data.activeProfileId,
      weekdays: [0, 1, 2, 3, 4], start: "09:00", end: "17:00", priority: 5, enabled: true };
    change(s => ({ ...s, schedules: [...s.schedules, rule] }));
  }
  function updateRule(id: string, transform: (rule: ScheduleRule) => ScheduleRule) {
    change(s => ({ ...s, schedules: s.schedules.map(r => r.id === id ? transform(r) : r) }));
  }
  async function checkHardware() {
    try {
      const capabilities = await platformReport();
      setReport(capabilities);
      if (!data) return;
      const result = await applyComfortOverlay(data.comfort);
      setOverlayStatus(result);
      setNotification(result.message);
    } catch (error) { setNotification("Screen comfort check failed: " + String(error)); }
  }

  async function previewReminder() {
    try {
      if (desktop) {
        if (!(await requestDesktopNotificationPermission())) {
          setNotification("Desktop notification permission is unavailable or was denied. In-app break reminders still work.");
          return;
        }
      } else if (!(await requestWebNotificationPermission())) {
        setNotification("Browser notifications are unavailable or permission was denied. In-app reminders still work while the tab is open.");
        return;
      }
      const sent = await notifyBreak();
      setNotification(sent ? "Test reminder submitted to the operating system." :
        "Notification not available or permission was not granted.");
    } catch (error) { setNotification("Unable to send reminder: " + String(error)); }
  }
  async function setShortcut(enabled: boolean) {
    if (!desktop) { setNotification("Global shortcuts require the desktop application."); return; }
    try {
      if (enabled) {
        await register(shortcut, () => { setScreen("dashboard"); setNotification("EyeZen shortcut activated."); });
      } else {
        await unregister(shortcut);
      }
      setShortcutActive(enabled);
    } catch (error) { setNotification("Shortcut registration failed: " + String(error)); }
  }

  useEffect(() => {
    if (!data || data.manualOverride || !data.schedules.some(s => s.enabled)) return;
    let alive = true;
    const tick = async () => {
      try {
        const id = await activeSchedule(data.schedules);
        if (alive && id && id !== data.activeProfileId && data.profiles.some(p => p.id === id)) {
          applyProfile(id, false);
        }
      } catch (error) { if (alive) setNotification("Schedule check failed: " + String(error)); }
    };
    void tick();
    // Background timers can be throttled while the machine sleeps or a tab is hidden.
    // Refresh immediately when EyeZen regains focus or becomes visible.
    const onFocus = () => { void tick(); };
    const onVisible = () => {
      if (document.visibilityState === "visible") void tick();
    };
    const timer = window.setInterval(tick, 60_000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // Profile application is guarded by current dependencies; save effects handle persistence.
  }, [data?.activeProfileId, data?.manualOverride, data?.schedules, data?.profiles]);

  useEffect(() => {
    if (!data?.breaks.enabled || breakPaused) {
      lastBreakAt.current = Date.now();
      return;
    }
    const tick = () => {
      const result = evaluateBreak(lastBreakAt.current, data.breaks, new Date(), pauseRemaining > 0);
      lastBreakAt.current = result.anchor;
      if (!result.due) return;
      setSessionBreaks(count => count + 1);
      setBreakDue(true);
      void notifyBreak().catch(() => {
        setNotification("Break due. System notification unavailable.");
      });
    };
    const onVisible = () => { if (document.visibilityState === "visible") tick(); };
    const timer = window.setInterval(tick, 10_000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [data?.breaks, breakPaused, pauseRemaining > 0]);

  // A one-second timeout does not measure elapsed time if a hidden tab or OS
  // sleep delays callbacks. Keep the session-only pause deadline instead, and
  // recalculate immediately after focus/visibility restoration.
  useEffect(() => {
    if (pauseRemaining <= 0 || pauseEndsAt.current === null) return;
    const tick = () => {
      const remaining = secondsUntil(pauseEndsAt.current ?? 0, Date.now());
      setPauseRemaining(remaining);
      if (remaining === 0) {
        pauseEndsAt.current = null;
        lastBreakAt.current = Date.now();
      }
    };
    const onVisible = () => { if (document.visibilityState === "visible") tick(); };
    tick();
    const timer = window.setInterval(tick, 1_000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pauseRemaining > 0]);

  function downloadCorruptWebSettings() {
    try {
      const raw = readRawWebState(window.localStorage);
      if (raw === null) throw Error("There are no saved settings to export.");
      const blob = new Blob([raw], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "eyezen-web-original-settings.txt";
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
      setRecoveryMessage("Raw settings exported. Keep this file before resetting browser data.");
    } catch (error) {
      setRecoveryMessage("Unable to export raw settings: " + String(error));
    }
  }

  function resetCorruptWebSettings() {
    if (desktop || !window.confirm("This removes EyeZen's saved browser settings on this site. Export a raw copy first if you want to preserve them. Reset now?")) return;
    try {
      clearWebState(window.localStorage);
      window.location.reload();
    } catch (error) {
      setRecoveryMessage("Unable to reset browser settings: " + String(error));
    }
  }

  if (loadError) return <main className="fatal">
    <Shield size={38} /><h1>Unable to open EyeZen settings</h1><p>{loadError}</p>
    <p className="muted">{desktop
      ? "Your existing data has not been silently discarded. Review the local configuration file and restart."
      : "Your browser data has not been overwritten. Export the original data before choosing to reset EyeZen browser settings."}</p>
    {!desktop && <div className="recovery-actions">
      <button type="button" onClick={downloadCorruptWebSettings}>Export raw saved data</button>
      <button type="button" onClick={resetCorruptWebSettings}>Reset EyeZen browser settings</button>
    </div>}
    {recoveryMessage && <p role="status">{recoveryMessage}</p>}
  </main>;
  if (!data || !report) return <main className="splash"><Eye size={44}/><h1>EyeZen</h1><p>Opening your workspace…</p></main>;

  const active = data.profiles.find(p => p.id === data.activeProfileId);
  const selected = data.profiles.find(p => p.id === selectedProfile) ?? active;
  const hardwareCap = report.capabilities.find(c => c.id === "screenOverlay");
  const displayAvailable = hardwareCap?.status === "available";
  const meta = titles[screen];

  const fileImport = async (file: File | undefined, mode: "profile" | "settings") => {
    if (!file) return;
    try {
      const value = await readJson(file);
      if (mode === "profile") {
        const imported = parseProfile(value);
        if (data.profiles.length >= 100) throw Error("Maximum 100 profiles.");
        change(s => ({ ...s, profiles: [...s.profiles, imported] }));
        setSelectedProfile(imported.id);
        setNotification("Profile imported and validated.");
      } else {
        if (!validateBackup(value)) throw Error("The backup does not match the supported settings schema.");
        setData(value);
        setSelectedProfile(value.activeProfileId);
        setNotification("Settings backup imported.");
      }
    } catch (error) { setNotification("Import failed: " + String(error)); }
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><Eye size={25} strokeWidth={2.4} /></div>
        <div><strong>EyeZen</strong><span>Your comfort workspace</span></div></div>
      <div className="nav-label">WORKSPACE</div>
      <nav aria-label="Primary navigation">
        {navigation.map(item => <button key={item.id} type="button"
          className={"nav-item " + (screen === item.id ? "selected" : "")}
          aria-current={screen === item.id ? "page" : undefined}
          aria-label={item.name}
          title={item.name}
          onClick={() => setScreen(item.id)}>
          <item.icon size={18} /><span>{item.name}</span>{screen === item.id && <ChevronRight size={15} />}
        </button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-pill"><span className="online-dot"/><span>{desktop ? "LOCAL DESKTOP APP" : "BROWSER PREVIEW"}</span></div>
        <div className="side-help"><Heart size={17}/> Small steps, more comfort.</div>
        <span className="version-label">EyeZen v{APP_VERSION}</span>
      </div>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <div className="crumb"><span>EyeZen</span><ChevronRight size={14}/><strong>{navigation.find(n => n.id === screen)?.name}</strong></div>
        <label className="mobile-nav">
          <span>EyeZen section</span>
          <select aria-label="EyeZen section" value={screen} onChange={event => setScreen(event.target.value as Screen)}>
            {navigation.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <div className="top-actions">
          <span className="platform-chip"><Laptop size={15}/>{report.os}</span>
          <button className="avatar-btn" onClick={() => setScreen("settings")} aria-label="Open settings"><Settings2 size={18}/></button>
        </div>
      </header>
      <div className="content-wrap">
        <div className="page-heading"><span className="eyebrow">{meta.eyebrow}</span>
          <h1>{meta.title}</h1><p>{meta.description}</p>
        </div>
        {!desktop && <div className="alert info-alert" role="status"><Info size={18}/>
          Web edition: themes, profiles, routines and backups are saved privately in this browser. No account or server is used. Only the desktop app can tint other application windows. <a href={import.meta.env.BASE_URL + "docs/"}>Read documentation</a>.</div>}
        {notification && <div className="alert message-alert" role="status"><Info size={18}/><span>{notification}</span>
          <button onClick={() => setNotification("")} aria-label="Dismiss message">Dismiss</button></div>}
        {breakDue && <div className="alert info-alert reminder-banner" role="status">
          <Eye size={19}/><span>Time for an optional screen pause. Your reminder suggests {data.breaks.durationSeconds} seconds.</span>
          <button className="secondary-btn" onClick={() => {
            setBreakDue(false);
            pauseEndsAt.current = Date.now() + data.breaks.durationSeconds * 1_000;
            setPauseRemaining(data.breaks.durationSeconds);
            lastBreakAt.current = Date.now();
          }}>Start pause</button>
          <button className="secondary-btn" onClick={() => {
            setBreakDue(false);
            lastBreakAt.current = Date.now();
          }}>Dismiss</button>
        </div>}
        {pauseRemaining > 0 && <div className="alert info-alert reminder-banner" role="status">
          <Clock3 size={19}/><span>Optional screen pause · {pauseRemaining} seconds remaining</span>
          <button className="secondary-btn" onClick={() => {
            pauseEndsAt.current = null;
            setPauseRemaining(0);
            lastBreakAt.current = Date.now();
          }}>Finish early</button>
        </div>}

        {screen === "dashboard" && <>
          <div className="hero-card">
            <div><span className="hero-tag"><Sparkles size={14}/> YOUR WORKSPACE AT A GLANCE</span>
              <h2>Find your balance,<br/><em>one setting at a time.</em></h2>
              <p>Build a calmer workflow with local profiles, thoughtful themes, and gentle reminders.</p>
              <button className="primary-btn" onClick={() => setScreen("profiles")}>Explore profiles <ChevronRight size={17}/></button>
            </div>
            <div className="orb-art" aria-hidden="true"><div className="orb-outer"><div className="orb-inner"><Eye size={66}/></div></div></div>
          </div>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon mint"><BookOpen size={20}/></div><span>ACTIVE PROFILE</span><strong>{safeProfileName(active)}</strong><button onClick={() => setScreen("profiles")}>Change profile <ChevronRight size={14}/></button></div>
            <div className="stat-card"><div className="stat-icon amber"><Palette size={20}/></div><span>APP APPEARANCE</span><strong>{themes.find(t => t.id === data.theme)?.name ?? data.theme}</strong><button onClick={() => setScreen("themes")}>Customize <ChevronRight size={14}/></button></div>
            <div className="stat-card"><div className="stat-icon blue"><Clock3 size={20}/></div><span>AUTOMATION</span><strong>{data.manualOverride ? "Manual override" : data.schedules.some(r => r.enabled) ? "Scheduled" : "Not scheduled"}</strong><button onClick={() => setScreen("automation")}>View routines <ChevronRight size={14}/></button></div>
            <div className="stat-card"><div className="stat-icon rose"><Bell size={20}/></div><span>BREAK ASSISTANT</span><strong>{data.breaks.enabled ? breakPaused ? "Paused" : "Enabled" : "Off"}</strong><button onClick={() => setScreen("breaks")}>Manage reminders <ChevronRight size={14}/></button></div>
          </div>
          <div className="two-col">
            <Panel title="Quick comfort controls" description="Opt-in visual tint on all detected monitors where supported.">
              <Toggle label="Comfort preferences" checked={data.comfort.enabled}
                description={displayAvailable ? "Opt-in visual tint across detected screens" : "No supported screen overlay in this session"}
                onChange={enabled => patch({ comfort: { ...data.comfort, enabled } })}/>
              <Range title="Preferred warmth" value={data.comfort.warmth} min={0} max={100} suffix="%"
                onChange={warmth => patch({ comfort: { ...data.comfort, warmth } })}/>
              <div className="inline-note"><Info size={17}/> {displayAvailable ? "An overlay changes how your desktop looks; monitor hardware is not modified." : "No desktop-wide tint was applied by this backend."}</div>
            </Panel>
            <Panel title="Ready-to-use profiles" description="Pick a workspace preset in one click.">
              <div className="quick-profiles">{data.profiles.slice(0, 5).map(p => <button key={p.id}
                className={"quick-profile " + (p.id === data.activeProfileId ? "active" : "")}
                onClick={() => applyProfile(p.id)}>
                <span>{p.name}</span>{p.id === data.activeProfileId ? <Check size={16}/> : <ChevronRight size={16}/>}
              </button>)}</div>
            </Panel>
          </div>
          <div className="alert info-alert"><Shield size={19}/> Your settings stay on this device. EyeZen makes no medical claims and does not collect usage analytics.</div>
        </>}

        {screen === "comfort" && <div className="two-col">
          <Panel title="Desktop-wide screen comfort" description="Opt-in visual tint and dimming across detected monitors. Hardware calibration remains untouched.">
            <Toggle label="Enable screen comfort on all displays" checked={data.comfort.enabled}
              onChange={enabled => patch({ comfort: { ...data.comfort, enabled } })}
              description="Uses click-through overlays where supported. Does not change physical brightness or calibrated color temperature." />
            <Range title="Warm color preference" value={data.comfort.warmth} min={0} max={100} suffix="%"
              onChange={warmth => patch({ comfort: { ...data.comfort, warmth } })}/>
            <Range title="Preferred intensity" value={data.comfort.intensity} min={0} max={100} suffix="%"
              onChange={intensity => patch({ comfort: { ...data.comfort, intensity } })}/>
            <div className="button-row">
              <button className="secondary-btn" onClick={() => patch({ comfort: newComfort() })}><RotateCcw size={16}/> Reset preferences</button>
              <button className="secondary-btn" onClick={() => { patch({ comfort: { ...newComfort() } }); setNotification("Color-accurate mode: EyeZen preferences are off. External OS / calibration settings were not changed."); }}>
                <Monitor size={16}/> Color-accurate work
              </button>
            </div>
          </Panel>
          <Panel title="Screen overlay status" description="Actual backend capabilities, not simulated hardware changes.">
            <Status kind={displayAvailable ? "ok" : "warn"}>{displayAvailable ? "Supported" : "Unavailable"}</Status>
            <p className="readable">{hardwareCap?.detail ?? "No backend information available."}</p>
            <div className="button-row"><button className="secondary-btn" onClick={() => void checkHardware()}><Activity size={16}/> Refresh display overlay</button></div>
            {overlayStatus && <div className="inline-note" role="status">
              <Info size={17}/><span>{overlayStatus.message}</span>
            </div>}
            <div className="inline-note"><Shield size={17}/> Comfort overlay is reversible and should not interfere with mouse input. Some exclusive fullscreen windows and Wayland sessions cannot be overlaid. Monitor calibration stays unchanged.</div>
          </Panel>
        </div>}

        {screen === "themes" && <>
          <Panel title="Built-in themes" description="Switch instantly between carefully balanced interface palettes.">
            <div className="theme-grid">{themes.map(t => <button className={"theme-tile " + (data.theme === t.id ? "is-active" : "")}
              aria-pressed={data.theme === t.id} key={t.id} onClick={() => patch({ theme: t.id })}>
              <div className="theme-swatch" style={{ background: t.preview }}>
                <div style={{ background: t.surface, borderColor: t.border }} className="theme-swatch-window">
                  <span style={{ background: t.foreground }} /><span style={{ background: t.muted }} /><span style={{ background: data.accent }}/></div>
              </div>
              <span className="theme-name">{t.name}{data.theme === t.id && <Check size={15}/>}</span>
              <span className="muted subtext">{t.description}</span>
            </button>)}</div>
          </Panel>
          <div className="two-col">
            <Panel title="Accent color" description="Fine-tune the primary highlight across EyeZen.">
              <label className="input-label">Accent <div className="color-control"><input type="color"
                value={data.accent} onChange={e => patch({ accent: e.target.value })}/><code>{data.accent}</code></div></label>
              <div className="accent-options">{["#81cbb0", "#9aacf2", "#e2ab74", "#d7a5d2", "#a1c6e7", "#d6d27c"].map(color =>
                <button key={color} aria-label={"Use accent " + color} aria-pressed={data.accent === color}
                  className={"accent-dot " + (data.accent === color ? "picked" : "")}
                  style={{ backgroundColor: color }} onClick={() => patch({ accent: color })}/>)}</div>
            </Panel>
            <Panel title="A little more control" description="Interface preferences carry across every screen.">
              <Range title="Text scale" min={0.8} max={1.6} step={0.1} value={Number(data.textScale.toFixed(1))}
                onChange={textScale => patch({ textScale })} suffix="×"/>
              <Toggle label="Reduce motion" checked={data.reducedMotion}
                onChange={reducedMotion => patch({ reducedMotion })}/>
            </Panel>
          </div>
        </>}

        {screen === "profiles" && <div className="profile-layout">
          <Panel title="Your profiles" description={String(data.profiles.length) + " locally stored profiles"}
            action={<button className="small-btn" onClick={newProfile}><Plus size={15}/> New</button>}>
            <div className="profile-list">{data.profiles.map(profile => <button key={profile.id}
              className={"profile-entry " + (selected?.id === profile.id ? "selected" : "")}
              onClick={() => setSelectedProfile(profile.id)}>
              <div className="profile-circle"><Code2 size={17}/></div><span>{profile.name}</span>
              {profile.id === data.activeProfileId && <span className="mini-pill">Active</span>}</button>)}</div>
            <label className="secondary-btn import-label"><Upload size={16}/> Import profile<input type="file" accept=".json,application/json"
              onChange={e => { void fileImport(e.target.files?.[0], "profile"); e.currentTarget.value = ""; }}/></label>
          </Panel>
          {selected && <Panel title="Edit profile" description="Changes are saved automatically on this device." className="editor-panel">
            <div className="form-grid">
              <ProfileNameField id={selected.id} name={selected.name}
                onSave={name => changeProfile(selected.id, p => ({ ...p, name }))} />
              <label className="input-label">Application theme<select value={selected.theme}
                onChange={e => changeProfile(selected.id, p => ({ ...p, theme: e.target.value }))}>
                {themes.map(t => <option value={t.id} key={t.id}>{t.name}</option>)}</select></label>
            </div>
            <div className="divider-line" />
            <Toggle label="Preferred comfort enabled" checked={selected.comfort.enabled}
              onChange={enabled => changeProfile(selected.id, p => ({ ...p, comfort: { ...p.comfort, enabled } }))}/>
            <Range title="Warmth preference" min={0} max={100} value={selected.comfort.warmth} suffix="%"
              onChange={warmth => changeProfile(selected.id, p => ({ ...p, comfort: { ...p.comfort, warmth } }))}/>
            <Range title="Intensity preference" min={0} max={100} value={selected.comfort.intensity} suffix="%"
              onChange={intensity => changeProfile(selected.id, p => ({ ...p, comfort: { ...p.comfort, intensity } }))}/>
            <Toggle label="Break reminders for this profile" checked={selected.breaks.enabled}
              onChange={enabled => changeProfile(selected.id, p => ({ ...p, breaks: { ...p.breaks, enabled } }))}/>
            <Range title="Break interval" min={5} max={240} step={5} value={selected.breaks.intervalMinutes} suffix=" min"
              onChange={intervalMinutes => changeProfile(selected.id, p => ({ ...p, breaks: { ...p.breaks, intervalMinutes } }))}/>
            <Range title="Suggested pause" min={10} max={600} step={10} value={selected.breaks.durationSeconds} suffix=" sec"
              onChange={durationSeconds => changeProfile(selected.id, p => ({ ...p, breaks: { ...p.breaks, durationSeconds } }))}/>
            <div className="button-row">
              <button className="primary-btn" onClick={() => applyProfile(selected.id)}><Check size={16}/> Apply profile</button>
              <button className="secondary-btn" onClick={() => exportJson({ schemaVersion: 1, kind: "eyezen-profile", profile: selected }, "eyezen-profile.json")}><Download size={16}/> Export</button>
              <button className="danger-btn" onClick={() => deleteProfile(selected.id)}><Trash2 size={16}/> Delete</button>
            </div>
            {selected.id === data.activeProfileId && <SectionDescription>To apply changes to an active profile, select “Apply profile” again.</SectionDescription>}
          </Panel>}
        </div>}

        {screen === "automation" && <>
          <Panel title="Schedule control" description="Rules only apply when the main app's timer is running. Overnight rules are supported.">
            <Toggle checked={data.manualOverride} onChange={manualOverride => patch({ manualOverride })}
              label="Manual override" description="While enabled, schedules cannot replace your manually selected profile."/>
            <div className="button-row"><button className="small-btn" onClick={addSchedule}><Plus size={16}/> Add schedule</button>
              {data.manualOverride && <button className="secondary-btn" onClick={() => patch({ manualOverride: false })}><Play size={16}/> Resume automation</button>}</div>
          </Panel>
          {data.schedules.length === 0 && <Panel title="No schedules yet"><Empty>Add your first rule for a weekday routine or evening theme.</Empty></Panel>}
          {data.schedules.map((rule, index) => <Panel key={rule.id} title={"Schedule " + (index + 1)} description={"Priority " + rule.priority + " · higher numbers win"}
            action={<button className="icon-btn" aria-label="Delete schedule" onClick={() => change(s => ({
              ...s, schedules: s.schedules.filter(r => r.id !== rule.id)
            }))}><Trash2 size={17}/></button>}>
            <Toggle label="Enable schedule" checked={rule.enabled}
              onChange={enabled => updateRule(rule.id, r => ({ ...r, enabled }))}/>
            <div className="form-grid three-fields">
              <label className="input-label">Apply profile<select value={rule.profileId}
                onChange={e => updateRule(rule.id, r => ({ ...r, profileId: e.target.value }))}>
                {data.profiles.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
              <label className="input-label">Starts<input type="time" value={rule.start}
                onChange={e => {
                  if (!validTime(e.target.value)) return;
                  if (e.target.value === rule.end) {
                    setNotification("Schedule start and end must be different.");
                    return;
                  }
                  updateRule(rule.id, r => ({ ...r, start: e.target.value }));
                }}/></label>
              <label className="input-label">Ends<input type="time" value={rule.end}
                onChange={e => {
                  if (!validTime(e.target.value)) return;
                  if (e.target.value === rule.start) {
                    setNotification("Schedule start and end must be different.");
                    return;
                  }
                  updateRule(rule.id, r => ({ ...r, end: e.target.value }));
                }}/></label>
            </div>
            <div className="day-picker" aria-label="Schedule weekdays">{weekdays.map((day, number) =>
              <button key={day} className={rule.weekdays.includes(number) ? "picked" : ""}
                aria-pressed={rule.weekdays.includes(number)} onClick={() => updateRule(rule.id, r => {
                  const weekdaysNew = r.weekdays.includes(number) ? r.weekdays.filter(n => n !== number) : [...r.weekdays, number].sort();
                  return { ...r, weekdays: weekdaysNew.length ? weekdaysNew : r.weekdays };
                })}>{day}</button>)}</div>
            <label className="input-label priority-label">Priority <input type="number" min={0} max={255} value={rule.priority}
              onChange={e => updateRule(rule.id, r => ({ ...r, priority: Math.max(0, Math.min(255, Number(e.target.value) || 0)) }))}/></label>
          </Panel>)}
          <div className="alert info-alert"><Info size={18}/> Times use your computer's local clock. Matching rules use highest priority, then rule ID. Manual override always takes precedence.</div>
        </>}

        {screen === "breaks" && <div className="two-col">
          <Panel title="Gentle reminders" description="Flexible, optional reminders with quiet hours.">
            <Toggle label="Enable reminders" checked={data.breaks.enabled}
              onChange={enabled => {
                patch({ breaks: { ...data.breaks, enabled } });
                lastBreakAt.current = Date.now();
                if (!enabled) { setBreakDue(false); pauseEndsAt.current = null; setPauseRemaining(0); }
              }}
              description="No webcam, activity tracking, or usage history."/>
            <Range title="Interval" value={data.breaks.intervalMinutes} min={5} max={240} step={5} suffix=" min"
              onChange={intervalMinutes => patch({ breaks: { ...data.breaks, intervalMinutes } })}/>
            <Range title="Suggested pause" value={data.breaks.durationSeconds} min={10} max={600} step={10} suffix=" sec"
              onChange={durationSeconds => patch({ breaks: { ...data.breaks, durationSeconds } })}/>
            <div className="form-grid">
              <label className="input-label">Quiet from<input type="time" value={data.breaks.quietStart}
                onChange={e => { if (validTime(e.target.value)) patch({ breaks: { ...data.breaks, quietStart: e.target.value } }); }}/></label>
              <label className="input-label">Quiet until<input type="time" value={data.breaks.quietEnd}
                onChange={e => { if (validTime(e.target.value)) patch({ breaks: { ...data.breaks, quietEnd: e.target.value } }); }}/></label>
            </div>
            <div className="button-row">
              <button className="secondary-btn" onClick={() => {
                setBreakPaused(!breakPaused);
                setBreakDue(false);
                pauseEndsAt.current = null;
                setPauseRemaining(0);
                lastBreakAt.current = Date.now();
              }}>
                {breakPaused ? <Play size={16}/> : <Pause size={16}/>} {breakPaused ? "Resume" : "Pause"} reminders
              </button>
              <button className="secondary-btn" onClick={() => void previewReminder()}><Bell size={16}/> Test notification</button>
            </div>
          </Panel>
          <Panel title="Your current session" description="Session-only counters; not recorded or tracked.">
            <div className="session-figure">{sessionBreaks}<span>gentle reminders this session</span></div>
            <div className="tip-box"><Sun size={22}/><div><strong>A friendly suggestion</strong>
              <p>Try looking at something distant, stretching, or taking a screen-free moment when convenient.</p></div></div>
            <div className="inline-note"><Info size={17}/> Notifications require permission and may be delayed while the app is suspended or closed.</div>
          </Panel>
        </div>}

        {screen === "displays" && <div className="two-col">
          <Panel title="Detected displays" description="Only actual enumerated displays are shown.">
            {report.displays.length ? report.displays.map(d => <div className="display-row" key={d.id}>
              <Monitor size={20}/><span>{d.name}</span></div>) :
              <Empty>No monitors were enumerated by this operating-system session.</Empty>}
            <button className="secondary-btn" onClick={() => void platformReport().then(setReport).catch(e => setNotification(String(e)))}>
              <RotateCcw size={16}/> Refresh capabilities</button>
          </Panel>
          <Panel title="Platform capability registry" description={report.os + " · " + report.architecture}>
            {report.capabilities.map(cap => <div className="capability-row" key={cap.id}>
              <div><strong>{cap.id.replace(/([A-Z])/g, " $1")}</strong><p className="muted">{cap.detail}</p></div>
              <Status kind={cap.status === "available" ? "ok" : "warn"}>{cap.status}</Status>
            </div>)}
          </Panel>
        </div>}

        {screen === "accessibility" && <div className="two-col">
          <Panel title="Reading & contrast" description="Changes affect the EyeZen interface.">
            <Range title="Text size" min={0.8} max={1.6} step={0.1} value={Number(data.textScale.toFixed(1))}
              onChange={textScale => patch({ textScale })} suffix="×"/>
            <Toggle label="Reduced motion" checked={data.reducedMotion} onChange={reducedMotion => patch({ reducedMotion })}/>
            <button className="secondary-btn" onClick={() => patch({ theme: "highContrast" })}>
              <Accessibility size={17}/> Use high contrast theme</button>
            <button className="secondary-btn" onClick={() => patch({ theme: "grayscale" })}>
              <Moon size={17}/> Use grayscale theme</button>
          </Panel>
          <Panel title="Built with accessibility in mind">
            <div className="feature-bullets"><p><Check size={17}/> Keyboard-navigable buttons and forms</p>
              <p><Check size={17}/> Visible focus rings</p><p><Check size={17}/> Semantic headings and labels</p>
              <p><Check size={17}/> Text labels alongside status colors</p>
              <p><Check size={17}/> Optional motion reduction</p></div>
            <div className="inline-note"><Info size={17}/> Full assistive-technology testing is needed before accessibility compliance can be claimed.</div>
          </Panel>
        </div>}

        {screen === "settings" && <div className="two-col">
          <Panel title="Local settings" description="Private by default, with no account required.">
            <div className="setting-line"><div><strong>Settings location</strong><p className="muted">{desktop ? "OS application configuration directory · settings.json" : "This browser’s local storage (private to this website origin)"}</p></div><Status kind="ok">Local</Status></div>
            <div className="setting-line"><div><strong>Onboarding</strong><p className="muted">Replay the first-run experience</p></div>
              <button className="secondary-btn" onClick={() => patch({ onboardingComplete: false })}>Show again</button></div>
            <div className="setting-line"><div><strong>Reset all preferences</strong><p className="muted">Restore built-in profiles and themes</p></div>
              <button className="danger-btn" onClick={() => { if (window.confirm("Reset all EyeZen preferences?")) setData({ ...createDefaults(), onboardingComplete: true }); }}>Reset</button></div>
          </Panel>
          <Panel title="Backup & shortcuts" description="Your configuration is under your control.">
            <div className="button-row"><button className="secondary-btn" onClick={() => exportJson(data, "eyezen-settings.json")}>
              <Download size={16}/> Export backup</button>
              <label className="secondary-btn import-label"><Upload size={16}/> Import backup<input type="file" accept=".json,application/json"
                onChange={e => { void fileImport(e.target.files?.[0], "settings"); e.currentTarget.value = ""; }}/></label></div>
            <div className="divider-line"/>
            <Toggle checked={shortcutActive} onChange={enabled => void setShortcut(enabled)}
              label="Global dashboard shortcut" description={desktop ? "Command/Ctrl + Shift + E (registered for this session)" : "Desktop-only: browser pages cannot register global shortcuts"}/>
            <div className="inline-note"><Keyboard size={17}/> Shortcut registration may fail if already used by another application.</div>
          </Panel>
        </div>}

        {screen === "about" && <div className="two-col">
          <Panel title={`EyeZen · Version ${APP_VERSION}`} description="Your screen. Your comfort. Your environment.">
            <div className="about-mark"><Eye size={58}/></div>
            <p className="readable">EyeZen is a local-first, local-first desktop and browser workspace utility built with Rust, Tauri 2, React, and TypeScript.</p>
            <p className="readable">It helps you customize themes, locally saved profiles, schedules, and gentle reminders without accounts or analytics. The desktop app can additionally apply supported visual tint overlays to your screens.</p>
            <Status kind="neutral">Mozilla Public License 2.0</Status>
          </Panel>
          <Panel title="Built on clear boundaries">
            <div className="feature-bullets"><p><Shield size={17}/> Settings stay on this device</p>
              <p><Monitor size={17}/> Screen-wide tinting is desktop-only; the web edition cannot tint other apps</p>
              <p><WandSparkles size={17}/> Interface themes do not recolor other applications</p>
              <p><Gauge size={17}/> No medical guarantees or eye-disease prevention claims</p></div>
            <a className="external-link" href="https://github.com/sanskarIN/EyeZen" target="_blank" rel="noreferrer">
              View on GitHub <ChevronRight size={16}/></a>
          </Panel>
        </div>}

        <footer className="footer"><span>Made for a more comfortable workspace.</span><span><a href={import.meta.env.BASE_URL + "docs/"}>Documentation & features</a> · <a href="https://github.com/sanskarIN/EyeZen/releases" target="_blank" rel="noreferrer">Desktop downloads</a> · EyeZen • MPL-2.0</span></footer>
      </div>
    </main>

    {!data.onboardingComplete && <div className="onboard-backdrop" role="presentation">
      <section className="onboard-dialog" role="dialog" aria-modal="true" aria-labelledby="onboard-title">
        <div className="onboard-icon"><Eye size={35}/></div>
        <span className="eyebrow">WELCOME TO YOUR NEW WORKSPACE</span>
        <h2 id="onboard-title">Comfort begins with choice.</h2>
        <p>Choose an appearance, create flexible routines, and keep your settings on your device. Screen tinting depends on your operating system and remains optional; hardware calibration is not modified.</p>
        <div className="onboard-options"><button onClick={() => patch({ theme: "dark" })} className={data.theme === "dark" ? "picked" : ""}><Moon size={20}/> Dark</button>
          <button onClick={() => patch({ theme: "light" })} className={data.theme === "light" ? "picked" : ""}><Sun size={20}/> Light</button>
          <button onClick={() => patch({ theme: "system" })} className={data.theme === "system" ? "picked" : ""}><Laptop size={20}/> System</button></div>
        <Toggle label="Enable gentle break reminders" checked={data.breaks.enabled}
          onChange={enabled => patch({ breaks: { ...data.breaks, enabled } })}/>
        <div className="button-row"><button className="secondary-btn" onClick={() => patch({ onboardingComplete: true })}>Skip for now</button>
          <button className="primary-btn" onClick={() => patch({ onboardingComplete: true })}>Enter EyeZen <ChevronRight size={17}/></button></div>
        <small>No sign-in, no tracking. Settings and permissions can be changed later.</small>
      </section>
    </div>}
  </div>;
}
