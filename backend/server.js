const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { Pool } = require("pg");
const Papa = require("papaparse");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "eventApp",
  password: "pass123",
  port: 5432,
});

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// -----------------------------
// 🔥 FOOD PLACES ROUTES
// -----------------------------

// Get all food places
app.get("/foodplaces", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM food_places");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Add a new food place
app.post("/foodplaces", async (req, res) => {
  try {
    const { name, gps, remarks } = req.body;
    const [lat, long] = gps;
    const result = await pool.query(
      "INSERT INTO food_places (name, gps_lat, gps_long, remarks) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, lat, long, remarks]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Delete a food place
app.delete("/foodplaces/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM food_places WHERE id = $1", [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Bulk upload food places via CSV
app.post("/foodplaces/bulk", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, "utf8");

    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true
    });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const row of parsed.data) {
        const gps = row.gps.split(",").map(Number);
        await client.query(
          "INSERT INTO food_places (name, gps_lat, gps_long, remarks) VALUES ($1, $2, $3, $4)",
          [row.name, gps[0], gps[1], row.remarks]
        );
      }

      await client.query("COMMIT");
      res.json({ message: "Bulk upload successful" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error uploading CSV:", err);
      res.status(500).send("Bulk upload failed");
    } finally {
      client.release();
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).send("Server error");
  }
});

// -----------------------------
// 🚽 TOILET ROUTES
// -----------------------------

// Get all toilets
app.get("/toilets", async (req, res) => {
  console.log("Fetching all toilets...");
  try {
    const result = await pool.query("SELECT * FROM toilets");
    console.log("Fetched toilets:", result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching toilets:", err);
    res.status(500).send("Server Error");
  }
});

// Add individual toilet
app.post("/toilets", async (req, res) => {
  const { name, gps, remarks } = req.body;
  const [lat, long] = gps;
  console.log("Adding new toilet with data:", { name, gps, remarks });

  try {
    const result = await pool.query(
      "INSERT INTO toilets (name, gps_lat, gps_long, remarks) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, lat, long, remarks]
    );
    console.log("Toilet added:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error adding toilet:", err);
    res.status(500).send("Server Error");
  }
});

// Delete a toilet
app.delete("/toilets/:id", async (req, res) => {
  const { id } = req.params;
  console.log("Deleting toilet with ID:", id);

  try {
    await pool.query("DELETE FROM toilets WHERE id = $1", [id]);
    console.log("Toilet with ID:", id, "deleted.");
    res.sendStatus(204);
  } catch (err) {
    console.error("Error deleting toilet:", err);
    res.status(500).send("Server Error");
  }
});

// Bulk upload toilets from CSV
app.post("/toilets/bulk", upload.single("file"), (req, res) => {
  const filePath = req.file.path;
  console.log("Received bulk file for upload:", filePath);

  const fileContent = fs.readFileSync(filePath, "utf8");

  Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    complete: async (result) => {
      console.log("Parsed CSV data:", result.data);

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        for (const row of result.data) {
          const gps = row.gps.split(",").map(Number);
          console.log("Inserting toilet from CSV:", row.name, gps, row.remarks);

          await client.query(
            "INSERT INTO toilets (name, gps_lat, gps_long, remarks) VALUES ($1, $2, $3, $4)",
            [row.name, gps[0], gps[1], row.remarks]
          );
        }

        await client.query("COMMIT");
        console.log("Bulk upload successful");
        res.json({ message: "Bulk upload successful" });
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error uploading toilets:", err);
        res.status(500).send("Bulk upload failed");
      } finally {
        client.release();
        fs.unlinkSync(filePath); // Remove uploaded file
        console.log("Uploaded file removed:", filePath);
      }
    },
  });
});

// -----------------------------
// 🚗 PARKING SPOT ROUTES
// -----------------------------

// Get all parking spots
app.get("/parking", async (req, res) => {
  console.log("Fetching all parking spots...");
  try {
    const result = await pool.query("SELECT * FROM parking_spots");
    console.log("Fetched parking spots:", result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching parking spots:", err);
    res.status(500).send("Server Error");
  }
});

// Add individual parking spot
app.post("/parking", async (req, res) => {
  const { name, gps, remarks } = req.body;
  const [lat, long] = gps;
  console.log("Adding new parking spot with data:", { name, gps, remarks });

  try {
    const result = await pool.query(
      "INSERT INTO parking_spots (name, gps_lat, gps_long, remarks) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, lat, long, remarks]
    );
    console.log("Parking spot added:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error adding parking spot:", err);
    res.status(500).send("Server Error");
  }
});

// Delete a parking spot
app.delete("/parking/:id", async (req, res) => {
  const { id } = req.params;
  console.log("Deleting parking spot with ID:", id);

  try {
    await pool.query("DELETE FROM parking_spots WHERE id = $1", [id]);
    console.log("Parking spot with ID:", id, "deleted.");
    res.sendStatus(204);
  } catch (err) {
    console.error("Error deleting parking spot:", err);
    res.status(500).send("Server Error");
  }
});

// Bulk upload parking spots from CSV
app.post("/parking/bulk", upload.single("file"), (req, res) => {
  const filePath = req.file.path;
  console.log("Received bulk file for upload:", filePath);

  const fileContent = fs.readFileSync(filePath, "utf8");

  Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    complete: async (result) => {
      console.log("Parsed CSV data:", result.data);

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        for (const row of result.data) {
          const gps = row.gps.split(",").map(Number);
          console.log("Inserting parking spot from CSV:", row.name, gps, row.remarks);

          await client.query(
            "INSERT INTO parking_spots (name, gps_lat, gps_long, remarks) VALUES ($1, $2, $3, $4)",
            [row.name, gps[0], gps[1], row.remarks]
          );
        }

        await client.query("COMMIT");
        console.log("Bulk upload successful");
        res.json({ message: "Bulk upload successful" });
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error uploading parking spots:", err);
        res.status(500).send("Bulk upload failed");
      } finally {
        client.release();
        fs.unlinkSync(filePath); // Remove uploaded file
        console.log("Uploaded file removed:", filePath);
      }
    },
  });
});
// -----------------------------
// 🎭 PERFORMANCES
// -----------------------------
app.post("/performances", upload.single("photo"), async (req, res) => {
  try {
    const { artist, description, date, startTime, endTime, venue } = req.body;
    const photo = req.file ? req.file.buffer : null;

    const formattedDate = new Date(date).toISOString().split('T')[0];
    const formattedStartTime = new Date(`1970-01-01T${startTime}`).toISOString().split('T')[1];
    const formattedEndTime = new Date(`1970-01-01T${endTime}`).toISOString().split('T')[1];

    const result = await pool.query(
      "INSERT INTO performances (artist, description, date, start_time, end_time, venue, photo) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [artist, description, formattedDate, formattedStartTime, formattedEndTime, venue, photo]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get("/performances", async (req, res) => {
  try {
    const result = await pool.query("SELECT artist, description, date, start_time, end_time, venue FROM performances");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// -----------------------------
// 💡 EXPERIENCES
// -----------------------------
app.post("/experiences", upload.single("photo"), async (req, res) => {
  const { title, description, date, startTime, endTime, venue } = req.body;
  const photo = req.file ? req.file.path : null;

  try {
    const result = await pool.query(
      "INSERT INTO experiences (title, description, date, start_time, end_time, venue, photo) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [title, description, date, startTime, endTime, venue, photo]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error adding experience:", err);
    res.status(500).send("Server error");
  }
});

app.get("/experiences", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM experiences");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching experiences:", err);
    res.status(500).send("Server error");
  }
});

// Fetch all venues
app.get("/venues", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM venues");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching venues:", err);
    res.status(500).send("Server error");
  }
});

// Add a new venue
app.post("/venues", async (req, res) => {
  const { name, gps } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO venues (name, gps) VALUES ($1, $2) RETURNING *",
      [name, gps]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error adding venue:", err);
    res.status(500).send("Server error");
  }
});

// Bulk add venues via CSV
app.post("/venues/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const filePath = req.file.path;
  const fileContent = fs.readFileSync(filePath, "utf8");

  Papa.parse(fileContent, {
    header: false,
    skipEmptyLines: true,
    complete: async (results) => {
      try {
        const client = await pool.connect();
        for (const row of results.data) {
          if (row.length === 2) {
            await client.query("INSERT INTO venues (name, gps) VALUES ($1, $2)", row);
          }
        }
        client.release();
        fs.unlinkSync(filePath);
        res.json({ message: "Venues uploaded successfully" });
      } catch (err) {
        console.error("Error processing CSV:", err);
        res.status(500).send("Server error");
      }
    },
  });
});

// Toggle venue selection
app.put("/venues/:id/select", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE venues SET selected = NOT selected WHERE id = $1 RETURNING *",
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating selection:", err);
    res.status(500).send("Server error");
  }
});

// Delete a venue
app.delete("/venues/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM venues WHERE id = $1", [id]);
    res.json({ message: "Venue deleted successfully" });
  } catch (err) {
    console.error("Error deleting venue:", err);
    res.status(500).send("Server error");
  }
});


// -----------------------------
// 🟢 START SERVER
// -----------------------------
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
