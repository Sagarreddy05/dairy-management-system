export const toCsv = (rows: Record<string, unknown>[]): string => {
  if (!rows.length) return '';

  const headers = Object.keys(rows[0]);
  const escape = (value: unknown): string => {
    const str = value === null || value === undefined ? '' : String(value);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ];

  return lines.join('\n');
};
