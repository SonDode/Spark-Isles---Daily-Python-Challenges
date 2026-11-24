// The daily challenge is pinned to one weekday for the MVP: no clock is read,
// so every run shows the same day.
export const DAILY_DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
] as const;

export const DAILY_DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

// Tuesday
export const DAILY_DAY_INDEX = 1;

export const DAILY_DAY: string = DAILY_DAYS[DAILY_DAY_INDEX]!;

export const DAILY_DAY_LETTER: string = DAILY_DAY_LETTERS[DAILY_DAY_INDEX]!;
