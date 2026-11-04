// "+3 vs previous 30 days", or null when there's nothing to compare with.
export function trendLabel(current, previous, days) {
  if (!previous && !current) return null;
  const change = current - previous;
  const sign = change > 0 ? "+" : "";
  return `${change === 0 ? "No change" : `${sign}${change}`} vs previous ${days} days`;
}

export function dailyCsv(daily) {
  return ["date,created,solved", ...daily.map((d) => `${d.day},${d.created},${d.solved}`)].join("\n") + "\n";
}
