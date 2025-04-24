const express = require("express");
const pool = require("../db");
const upload = require("../middleware/upload");
const { parseCSV, cleanupFile } = require("../utils/bulkUploadHelper");
const router = express.Router();
const fs = require("fs");

// GET all food places
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM food_places");
    res.json(rows);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// POST single food place
router.post("/", async (req, res) => {
  const { name, gps, remarks } = req.body;
  const [lat, long] = gps;
  try {
    const [rows] = await pool.execute(
      "INSERT INTO food_places (name, gps_lat, gps_long, remarks) VALUES (?, ?, ?, ?)",
      [name, lat, long, remarks]
    );
    res.json({ id: rows.insertId });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// BULK upload food places
router.post("/bulk", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  const data = parseCSV(filePath);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const row of data) {
      const gps = row.gps.split(",").map(Number);
      await conn.execute(
        "INSERT INTO food_places (name, gps_lat, gps_long, remarks) VALUES (?, ?, ?, ?)",
        [row.name, gps[0], gps[1], row.remarks]
      );
    }
    await conn.commit();
    res.json({ message: "Bulk upload successful" });
  } catch (err) {
    await conn.rollback();
    res.status(500).send("Bulk upload failed");
  } finally {
    conn.release();
    cleanupFile(filePath);
  }
});

module.exports = router;
