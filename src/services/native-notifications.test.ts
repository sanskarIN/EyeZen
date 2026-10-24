import { beforeEach, describe, expect, it, vi } from "vitest";

const notification = vi.hoisted(() => ({
  isPermissionGranted: vi.fn(),
  requestPermission: vi.fn(),
  sendNotification: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  isTauri: () => true,
  invoke: vi.fn(),
}));
vi.mock("@tauri-apps/plugin-notification", () => notification);

import { notifyBreak, requestDesktopNotificationPermission } from "./native";

describe("desktop notification permission safety", () => {
  beforeEach(() => {
    notification.isPermissionGranted.mockReset();
    notification.requestPermission.mockReset();
    notification.sendNotification.mockReset();
  });

  it("does not prompt or send a scheduled reminder without permission", async () => {
    notification.isPermissionGranted.mockResolvedValue(false);
    expect(await notifyBreak()).toBe(false);
    expect(notification.requestPermission).not.toHaveBeenCalled();
    expect(notification.sendNotification).not.toHaveBeenCalled();
  });

  it("sends a scheduled reminder only when permission already exists", async () => {
    notification.isPermissionGranted.mockResolvedValue(true);
    expect(await notifyBreak()).toBe(true);
    expect(notification.requestPermission).not.toHaveBeenCalled();
    expect(notification.sendNotification).toHaveBeenCalledTimes(1);
  });

  it("requests permission from the explicitly triggered desktop action", async () => {
    notification.isPermissionGranted.mockResolvedValue(false);
    notification.requestPermission.mockResolvedValue("granted");
    expect(await requestDesktopNotificationPermission()).toBe(true);
    expect(notification.requestPermission).toHaveBeenCalledTimes(1);
  });

  it("respects a denied permission choice without sending a notification", async () => {
    notification.isPermissionGranted.mockResolvedValue(false);
    notification.requestPermission.mockResolvedValue("denied");
    expect(await requestDesktopNotificationPermission()).toBe(false);
    expect(await notifyBreak()).toBe(false);
    expect(notification.sendNotification).not.toHaveBeenCalled();
  });

  it("does not prompt again after permission is granted", async () => {
    notification.isPermissionGranted.mockResolvedValue(true);
    expect(await requestDesktopNotificationPermission()).toBe(true);
    expect(notification.requestPermission).not.toHaveBeenCalled();
  });
});
