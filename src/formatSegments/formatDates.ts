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

const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const dateFromString = (
  dateString: string,
  _timeZone: string = DEFAULT_TIMEZONE,
): DateFormated => {
  const year = Number(dateString.slice(0, 4));
  const monthInt = Number(dateString.slice(4, 6));
  const day = Number(dateString.slice(6, 8));

  // Construct pure UTC midnight date to avoid local OS timezone shifts
  const base = new Date(Date.UTC(year, monthInt - 1, day, 0, 0, 0, 0));

  const dayFormated = String(day).padStart(2, "0");
  const month = MONTH_NAMES_SHORT[monthInt - 1] || "";
  const yearShort = String(year).slice(-2);
  const dayOfWeek = DAY_NAMES_SHORT[base.getUTCDay()] || "";

  const formated = `${dayFormated} ${month} ${yearShort}`;

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
