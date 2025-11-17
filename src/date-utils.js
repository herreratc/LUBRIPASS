function differenceInDays(a, b) {
  const diff = Math.abs(new Date(a).setHours(0, 0, 0, 0) - new Date(b).setHours(0, 0, 0, 0));
  return Math.round(diff / (24 * 60 * 60 * 1000));
}

function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function formatDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = {
  differenceInDays,
  isSameDay,
  formatDate,
};
