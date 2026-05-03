function nowIso() {
  return new Date().toISOString();
}

function formatLocal(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(value.getTime())) {
    throw new Error("Invalid date value.");
  }

  return value.toLocaleString();
}

module.exports = {
  nowIso,
  formatLocal,
};
