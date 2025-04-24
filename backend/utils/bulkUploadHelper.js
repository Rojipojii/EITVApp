const fs = require("fs");
const Papa = require("papaparse");

function parseCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf8");
  return Papa.parse(fileContent, { header: true, skipEmptyLines: true }).data;
}

function cleanupFile(filePath) {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

module.exports = { parseCSV, cleanupFile };
