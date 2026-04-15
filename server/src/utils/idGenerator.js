const PAD_WIDTH = 4;

function escapeIdentifier(identifier) {
  return String(identifier || "").replace(/`/g, "``");
}

async function generatePrefixedId(connectionOrPool, tableName, columnName, prefix) {
  const table = escapeIdentifier(tableName);
  const column = escapeIdentifier(columnName);
  const safePrefix = String(prefix || "");
  const likePattern = safePrefix + "-%";

  const [rows] = await connectionOrPool.query(
    `SELECT MAX(CAST(SUBSTRING(${column}, ${safePrefix.length + 2}) AS UNSIGNED)) AS latest
     FROM \`${table}\`
     WHERE ${column} LIKE ?`,
    [likePattern]
  );

  const latest = Number(rows[0]?.latest || 0);
  const next = latest + 1;
  return `${safePrefix}-${String(next).padStart(PAD_WIDTH, "0")}`;
}

module.exports = {
  generatePrefixedId,
};
