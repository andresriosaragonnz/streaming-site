import { formatInTimeZone } from "date-fns-tz";

export interface DateFormated {
  date: Date;
  formated: string;
  dayFormated: string;
  dayOfWeek: string;
  month: string;
  dbString: string;
  index: number;
}
export const timeZone = "Pacific/Auckland";

export const dateFromString = (dateString: string): DateFormated => {
  const year = parseInt(dateString.slice(0, 4), 10);
  const monthint = parseInt(dateString.slice(4, 6), 10);
  const day = parseInt(dateString.slice(6, 8), 10);

  // 1. Construct the date as a local midnight object relative to the runtime environment
  const base = new Date(year, monthint - 1, day, 0, 0, 0, 0);

  // 2. Define the explicit target plane to anchor lookups

  // 3. Format EVERY field specifically locked into the New Zealand Timezone.
  // This guarantees that even if this runs on a UTC cloud server, the string outputs
  // will match New Zealand calendar dates exactly.
  const formated = formatInTimeZone(base, timeZone, "dd MMM yy");
  const month = formatInTimeZone(base, timeZone, "MMM");
  const dayFormated = formatInTimeZone(base, timeZone, "dd");
  const dayOfWeek = formatInTimeZone(base, timeZone, "eee");
  const dbString = formatInTimeZone(base, timeZone, "yyyyMMdd");
  return {
    date: base,
    formated,
    dayFormated,
    dayOfWeek,
    month,
    index: 0,
    dbString,
  };
};
