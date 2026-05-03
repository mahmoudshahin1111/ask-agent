function search(items, query) {
  if (!Array.isArray(items)) {
    throw new Error("items must be an array.");
  }

  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  return items.filter((item) => {
    return String(item).toLowerCase().includes(normalizedQuery);
  });
}

module.exports = {
  search,
};
