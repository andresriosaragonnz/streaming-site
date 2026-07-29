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

const DEFAULT_TIMEZONE = "Pacific/Auckland";

export const dateFromString = (
  dateString: string,
  timeZone: string = DEFAULT_TIMEZONE,
): DateFormated => {
  const year = Number(dateString.slice(0, 4));
  const monthInt = Number(dateString.slice(4, 6));
  const day = Number(dateString.slice(6, 8));

  const base = new Date(year, monthInt - 1, day, 0, 0, 0, 0);

  const formattedCombined = formatInTimeZone(
    base,
    timeZone,
    "dd MMM yy|MMM|dd|eee",
  );

  const [formated, month, dayFormated, dayOfWeek] =
    formattedCombined.split("|");

  return {
    date: base,
    formated,
    dayFormated,
    dayOfWeek,
    month,
    index: 0,
    dbString: dateString,
  };
};
