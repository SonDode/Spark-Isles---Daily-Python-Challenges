import { describe, expect, it } from "vitest";
import { DAILY_DAY, DAILY_DAY_INDEX, DAILY_DAY_LETTER, DAILY_DAY_LETTERS, DAILY_DAYS } from "./day";

describe("daily challenge day", () => {
  it("is always Tuesday", () => {
    expect(DAILY_DAY).toBe("Tuesday");
    expect(DAILY_DAY_INDEX).toBe(1);
    expect(DAILY_DAY_LETTER).toBe("T");
  });

  it("maps the weekday to the second slot of the Monday-first week row", () => {
    expect(DAILY_DAYS[DAILY_DAY_INDEX]).toBe("Tuesday");
    expect(DAILY_DAY_LETTERS[DAILY_DAY_INDEX]).toBe("T");
    expect(DAILY_DAY_LETTERS[DAILY_DAY_INDEX]).not.toBe(DAILY_DAY_LETTERS[0]);
  });
});
