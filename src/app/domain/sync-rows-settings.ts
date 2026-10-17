import { z } from 'zod';
import type { UserSettings } from './db';
import type { Parsed } from './sync-rows-types';

const settingsSchema = z.object({
  daily_goal: z.number().nullish(),
  reminder_enabled: z.boolean(),
  reminder_minute: z.number(),
  time_zone: z.string(),
  updated_at: z.number(),
  synced_at: z.string(),
});

export function parseSettingsRow(raw: unknown): Parsed<UserSettings> | null {
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) return null;
  const data = parsed.data;
  const row: UserSettings = {
    id: 'me',
    dailyGoal: data.daily_goal ?? null,
    reminderEnabled: data.reminder_enabled,
    reminderMinute: data.reminder_minute,
    timeZone: data.time_zone,
    updatedAt: data.updated_at,
    dirty: 0,
  };
  return { row, syncedAt: data.synced_at };
}

export function toSettingsRow(row: UserSettings): object {
  return {
    daily_goal: row.dailyGoal,
    reminder_enabled: row.reminderEnabled,
    reminder_minute: row.reminderMinute,
    time_zone: row.timeZone,
    updated_at: row.updatedAt,
  };
}
