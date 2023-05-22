
const
    WEEK_IN_MILLIS = 6.048e8,
    DAY_IN_MILLIS = 8.64e7,
    HOUR_IN_MILLIS = 3.6e6,
    MIN_IN_MILLIS = 6e4,
    SEC_IN_MILLIS = 1e3;
const formatter = new Intl.RelativeTimeFormat('en', { style: 'long' });
export const timeAgo = (date: string) => {
    const
        dt = new Date(date),
        event = new Date(date).getTime(),
        now = new Date().getTime(),
        diff = event - now
    if (Math.abs(-diff) > WEEK_IN_MILLIS)
        return dt.toLocaleDateString('en-us', { weekday: "long", year: "numeric", month: "short", day: "numeric" })
    else if (Math.abs(-diff) > DAY_IN_MILLIS)
        return formatter.format(Math.trunc(diff / DAY_IN_MILLIS), 'day');
    else if (Math.abs(-diff) > HOUR_IN_MILLIS)
        return formatter.format(Math.trunc((diff % DAY_IN_MILLIS) / HOUR_IN_MILLIS), 'hour');
    else if (Math.abs(-diff) > MIN_IN_MILLIS)
        return formatter.format(Math.trunc((diff % HOUR_IN_MILLIS) / MIN_IN_MILLIS), 'minute');
    else
        return formatter.format(Math.trunc((diff % MIN_IN_MILLIS) / SEC_IN_MILLIS), 'second');
};