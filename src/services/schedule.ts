import type { ScheduleRule } from "../types";

function minutes(time: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : -1;
}
export function matchingRule(rules: ScheduleRule[], now: Date): ScheduleRule | undefined {
  const today = (now.getDay() + 6) % 7;
  const yesterday = (today + 6) % 7;
  const time = now.getHours() * 60 + now.getMinutes();
  return rules.filter(rule => {
    if (!rule.enabled) return false;
    const start = minutes(rule.start), end = minutes(rule.end);
    if (start < 0 || end < 0 || start === end) return false;
    if (start < end) return rule.weekdays.includes(today) && time >= start && time < end;
    return (rule.weekdays.includes(today) && time >= start) ||
      (rule.weekdays.includes(yesterday) && time < end);
  }).sort((a, b) => b.priority - a.priority || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
}
export function isQuiet(start: string, end: string, now = new Date()): boolean {
  const a = minutes(start), b = minutes(end);
  if (a < 0 || b < 0 || a === b) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  return a < b ? current >= a && current < b : current >= a || current < b;
}
export function validTime(value: string) { return minutes(value) >= 0; }
