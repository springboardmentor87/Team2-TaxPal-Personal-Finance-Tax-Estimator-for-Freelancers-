const buildDateRange = (from, to) => {
  const range = {};

  if (from) {
    const fromDate = new Date(from);
    if (!Number.isNaN(fromDate.getTime())) {
      range.$gte = fromDate;
    }
  }

  if (to) {
    const toDate = new Date(to);
    if (!Number.isNaN(toDate.getTime())) {
      range.$lte = toDate;
    }
  }

  return Object.keys(range).length > 0 ? range : undefined;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

const startOfYear = (year) => new Date(year, 0, 1);

const endOfYear = (year) => new Date(year, 11, 31, 23, 59, 59, 999);

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const buildMonthWindow = (months = 6, referenceDate = new Date()) => {
  const window = [];
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  for (let index = months - 1; index >= 0; index -= 1) {
    const cursor = new Date(year, month - index, 1);
    window.push({
      key: monthKey(cursor),
      label: cursor.toLocaleString('default', { month: 'short', year: '2-digit' }),
      start: startOfMonth(cursor),
      end: endOfMonth(cursor)
    });
  }

  return window;
};

const groupByKey = (items, keyFn) => {
  return items.reduce((accumulator, item) => {
    const key = keyFn(item);
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(item);
    return accumulator;
  }, {});
};

const sum = (values = []) => values.reduce((total, value) => total + Number(value || 0), 0);

const roundToTwo = (value) => Number(Number(value || 0).toFixed(2));

const percent = (part, total) => {
  if (!total) {
    return 0;
  }

  return roundToTwo((Number(part || 0) / Number(total)) * 100);
};

module.exports = {
  buildDateRange,
  buildMonthWindow,
  endOfMonth,
  endOfYear,
  groupByKey,
  monthKey,
  percent,
  roundToTwo,
  startOfMonth,
  startOfYear,
  sum
};