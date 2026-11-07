import { beforeEach, describe, expect, it, vi } from "vitest";

const native = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/core", () => ({
  isTauri: () => true,
  invoke: native.invoke,
}));
vi.mock("@tauri-apps/plugin-notification", () => ({
  isPermissionGranted: vi.fn(),
  requestPermission: vi.fn(),
  sendNotification: vi.fn(),
}));

import { applyComfortOverlay, rearmEmergencyComfortStop } from "./native";

describe("emergency overlay latch requests", () => {
  beforeEach(() => {
    native.invoke.mockReset();
    native.invoke.mockResolvedValue(undefined);
  });

  it("does not rearm while synchronizing disabled comfort", async () => {
    await applyComfortOverlay({ enabled: false, warmth: 45, intensity: 30 });
    expect(native.invoke).toHaveBeenCalledExactlyOnceWith("apply_comfort_overlay", {
      settings: { enabled: false, warmth: 45, intensity: 30 },
    });
    expect(native.invoke).not.toHaveBeenCalledWith("rearm_emergency_comfort_stop");
  });

  it("does not rearm when a scheduled or periodic refresh requests enabled comfort", async () => {
    await applyComfortOverlay({ enabled: true, warmth: 45, intensity: 30 });
    expect(native.invoke).toHaveBeenCalledTimes(1);
    expect(native.invoke).not.toHaveBeenCalledWith("rearm_emergency_comfort_stop");
  });

  it("only the explicit rearm API invokes the native latch reset", async () => {
    await rearmEmergencyComfortStop();
    expect(native.invoke).toHaveBeenCalledExactlyOnceWith("rearm_emergency_comfort_stop");
  });

  it("propagates rearm failures instead of silently enabling comfort", async () => {
    native.invoke.mockRejectedValueOnce(new Error("Native rearm unavailable"));
    await expect(rearmEmergencyComfortStop()).rejects.toThrow("Native rearm unavailable");
  });
});
