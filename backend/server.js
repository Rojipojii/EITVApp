const express = require("express");
const path = require("path"); 
const cors = require("cors");
const multer = require("multer");
const mysql = require("mysql2/promise");
const Papa = require("papaparse");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
// somewhere before your catch‑all:
app.use(
  "/app/uploads",
  express.static(path.join(__dirname, "uploads"))   // adjust path if yours is different
);



// MySQL connection
const pool = mysql.createPool({
  host: "localhost",
  port:3306,
  user: "gallisal_rojina",
  password: "a!Yjn5CWO^s_",
  database: "gallisal_eventApp",
  waitForConnections: true,
  queueLimit: 0
});

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("Connected to the database successfully!");
    conn.release();
  } catch (err) {
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Access Denied: Incorrect username or password');
    } else if (err.code === 'ENOTFOUND') {
      console.error('Host not found. Check your MySQL hostname.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('Connection Refused: MySQL server might be down or not accepting connections.');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('Database not found. Verify the database name.');
    } else {
      console.error('Error connecting to MySQL:', err.message);
    }
  }
})();

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  // Define the destination directory dynamically
  destination: (req, file, cb) => {
    // Set the upload directory to 'uploads/'
    const dir = 'uploads/';

    ensureDirExists(dir); // Ensure the directory exists
    cb(null, dir);        // Call cb() once, after setting up the dir
  },

  // Keep the original file name
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });


// module.exports = upload;



app.get("/app", (req, res) => {
  res.send("This is the /app route");
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});


// -----------------------------
// 🔥 FOOD PLACES ROUTES
// -----------------------------

app.get("/app/foodplaces", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM food_places");
    console.log("✅ Retrieved food places:", rows.length);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.post("/app/foodplaces", async (req, res) => {
  try {
    const { name, gps, remarks } = req.body;
    const [lat, long] = gps;
    const [rows] = await pool.execute(
      "INSERT INTO food_places (name, gps_lat, gps_long, remarks) VALUES (?, ?, ?, ?)",
      [name, lat, long, remarks]
    );
    res.json({ id: rows.insertId, name, gps_lat: lat, gps_long: long, remarks });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


app.post("/app/foodplaces/bulk", (req, res) => {
  console.log("Received bulk upload request at /app/foodplaces/bulk");

  const foodPlaces = req.body;
  console.log("Request body:", foodPlaces);

  if (!Array.isArray(foodPlaces) || foodPlaces.length === 0) {
    console.warn("Invalid or empty data received");
    return res.status(400).json({ error: "No food places data provided" });
  }

  const query = "INSERT INTO food_places (name, gps_lat, gps_long, remarks) VALUES ?";
  const values = foodPlaces.map(place => [
    place.name,
    parseFloat(place.gps_lat),  // Ensure they are numbers
    parseFloat(place.gps_long),
    place.remarks
  ]);

  console.log("Prepared SQL values for insertion:", values);

  pool.query(query, [values], (err, result) => {
    if (err) {
      console.error("Error inserting bulk food places into database:", err);
      return res.status(500).json({ error: "Database error" });
    }

    console.log("Database insert successful. Result:", result);

    const insertedIdStart = result.insertId;
    const foodPlacesWithIds = foodPlaces.map((place, index) => ({
      id: insertedIdStart + index,
      name: place.name,
      gps_lat: parseFloat(place.gps_lat),
      gps_long: parseFloat(place.gps_long),
      remarks: place.remarks
    }));

    console.log("Returning response with inserted records:", foodPlacesWithIds);
    res.status(200).json(foodPlacesWithIds);
  });
});

app.delete('/app/foodplaces/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      `DELETE FROM food_places WHERE foodplaces_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Food place not found" });
    }

    res.status(200).json({ message: "Food place deleted successfully" });
  } catch (error) {
    console.error("Error deleting food place:", error);
    res.status(500).json({ message: "Server error" });
  }
});


app.put("/app/foodplaces/:id", upload.single("photo"), async (req, res) => {
  const id = req.params.id;
  const { name, gps, remarks } = req.body;
  const photo = req.file ? req.file.filename : null;

  try {
    const [lat, long] = gps;

    const query = `
      UPDATE food_places
      SET name = ?, gps_lat = ?, gps_long = ?, remarks = ? ${photo ? ", photo = ?" : ""}
      WHERE foodplaces_id = ?
    `;

    const values = photo
      ? [name, lat, long, remarks, photo, id]
      : [name, lat, long, remarks, id];

    await pool.query(query, values);

    const [updated] = await pool.query("SELECT * FROM food_places WHERE foodplaces_id = ?", [id]);

    res.json(updated[0]);
  } catch (error) {
    console.error("Error updating food place:", error);
    res.status(500).send("Error updating food place");
  }
});



// -----------------------------
// 🚽 TOILET ROUTES
// -----------------------------

app.get("/app/toilets", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM toilets");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.post("/app/toilets", async (req, res) => {
  const { name, gps, remarks } = req.body;
  const [lat, long] = gps;
  try {
    const [rows] = await pool.execute(
      "INSERT INTO toilets (name, gps_lat, gps_long, remarks) VALUES (?, ?, ?, ?)",
      [name, lat, long, remarks]
    );
    res.json({ id: rows.insertId, name, gps_lat: lat, gps_long: long, remarks });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


app.post("/app/toilets/bulk", (req, res) => {
  console.log("Received bulk upload request at /app/toilets/bulk");

  const toilets = req.body;
  console.log("Request body:", toilets);

  if (!Array.isArray(toilets) || toilets.length === 0) {
    console.warn("Invalid or empty data received");
    return res.status(400).json({ error: "No toilets data provided" });
  }

  const query = "INSERT INTO toilets (name, gps_lat, gps_long, remarks) VALUES ?";
  const values = toilets.map(toilet => [
    toilet.name,
    parseFloat(toilet.gps_lat),  // Ensure they are numbers
    parseFloat(toilet.gps_long),
    toilet.remarks
  ]);

  console.log("Prepared SQL values for insertion:", values);

  pool.query(query, [values], (err, result) => {
    if (err) {
      console.error("Error inserting bulk toilets into database:", err);
      return res.status(500).json({ error: "Database error" });
    }

    console.log("Database insert successful. Result:", result);

    const insertedIdStart = result.insertId;
    const toiletsWithIds = toilets.map((toilet, index) => ({
      id: insertedIdStart + index,
      name: toilet.name,
      gps_lat: parseFloat(toilet.gps_lat),
      gps_long: parseFloat(toilet.gps_long),
      remarks: toilet.remarks
    }));

    console.log("Returning response with inserted records:", toiletsWithIds);
    res.status(200).json(toiletsWithIds);
  });
});

app.delete("/app/toilets/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      `DELETE FROM toilets WHERE toilet_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Toilet not found" });
    }

    res.status(200).json({ message: "Toilet deleted successfully" });
  } catch (error) {
    console.error("Error deleting toilet:", error);
    res.status(500).json({ message: "Server error" });
  }
});


app.put("/app/toilets/:id", async (req, res) => {
  const id = req.params.id;
  const { name, gps, remarks } = req.body;

  try {
    const [lat, long] = gps;

    const query = `
      UPDATE toilets
      SET name = ?, gps_lat = ?, gps_long = ?, remarks = ?
      WHERE toilet_id = ?
    `;

    const values = [name, lat, long, remarks, id];

    await pool.query(query, values);

    const [updated] = await pool.query("SELECT * FROM toilets WHERE toilet_id = ?", [id]);

    res.json(updated[0]);
  } catch (error) {
    console.error("Error updating toilet:", error);
    res.status(500).send("Error updating toilet");
  }
});


// -----------------------------
// 🚗 PARKING SPOTS
// -----------------------------

app.get("/app/parking", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM parking_spots");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.post("/app/parking", async (req, res) => {
  const { name, gps, remarks } = req.body;
  const [lat, long] = gps;
  try {
    const [rows] = await pool.execute(
      "INSERT INTO parking_spots (name, gps_lat, gps_long, remarks) VALUES (?, ?, ?, ?)",
      [name, lat, long, remarks]
    );
    res.json({ id: rows.insertId, name, gps_lat: lat, gps_long: long, remarks });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


app.post("/app/parking/bulk", (req, res) => {
  console.log("Received bulk upload request at /app/parking/bulk");

  const parkingSpots = req.body;
  console.log("Request body:", parkingSpots);

  if (!Array.isArray(parkingSpots) || parkingSpots.length === 0) {
    console.warn("Invalid or empty data received");
    return res.status(400).json({ error: "No parking spots data provided" });
  }

  const query = "INSERT INTO parking_spots (name, gps_lat, gps_long, remarks) VALUES ?";
  const values = parkingSpots.map(spot => [
    spot.name,
    parseFloat(spot.gps_lat),  // Ensure they are numbers
    parseFloat(spot.gps_long),
    spot.remarks
  ]);

  console.log("Prepared SQL values for insertion:", values);

  pool.query(query, [values], (err, result) => {
    if (err) {
      console.error("Error inserting bulk parking spots into database:", err);
      return res.status(500).json({ error: "Database error" });
    }

    console.log("Database insert successful. Result:", result);

    const insertedIdStart = result.insertId;
    const parkingSpotsWithIds = parkingSpots.map((spot, index) => ({
      id: insertedIdStart + index,
      name: spot.name,
      gps_lat: parseFloat(spot.gps_lat),
      gps_long: parseFloat(spot.gps_long),
      remarks: spot.remarks
    }));

    console.log("Returning response with inserted records:", parkingSpotsWithIds);
    res.status(200).json(parkingSpotsWithIds);
  });
});

app.delete("/app/parking/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      `DELETE FROM parking_spots WHERE parking_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Parking spot not found" });
    }

    res.status(200).json({ message: "Parking spot deleted successfully" });
  } catch (error) {
    console.error("Error deleting parking spot:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/app/parking/:id", async (req, res) => {
  const { id } = req.params;
  const { name, gps, remarks } = req.body;

  try {
    const [lat, long] = gps;

    const query = `
      UPDATE parking_spots
      SET name = ?, gps_lat = ?, gps_long = ?, remarks = ?
      WHERE parking_id = ?
    `;

    const values = [name, lat, long, remarks, id];

    await pool.query(query, values);

    const [updated] = await pool.query(
      "SELECT * FROM parking_spots WHERE parking_id = ?",
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error("Error updating parking spot:", error);
    res.status(500).send("Error updating parking spot");
  }
});



// -----------------------------
// 🎭 PERFORMANCES
// -----------------------------
app.post("/app/performances", upload.single("photo"), async (req, res) => {
  try {
    const { artist, description, venue, dateTimes } = req.body;
    const parsedDateTimes = JSON.parse(dateTimes); // coming from FormData

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!artist || !venue || !Array.isArray(parsedDateTimes) || parsedDateTimes.length === 0) {
      return res.status(400).json({ message: "Missing required fields or dateTimes" });
    }

    const [performanceResult] = await pool.execute(
      "INSERT INTO performances (artist, description, venue, photo) VALUES (?, ?, ?, ?)",
      [artist, description ?? null, venue, photoUrl]
    );

    const performanceId = performanceResult.insertId;

    // Insert all dateTimes
    const dateTimeInserts = parsedDateTimes.map(dt => [performanceId, dt.date, dt.startTime, dt.endTime]);
    await pool.query(
      "INSERT INTO performance_date_times (performance_id, date, start_time, end_time) VALUES ?",
      [dateTimeInserts]
    );

    res.json({ message: "Performance created", performanceId });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).send("Server Error");
  }
});


app.get("/app/performances", async (req, res) => {
  try {
    const [performances] = await pool.execute("SELECT * FROM performances");

    const [dateTimes] = await pool.execute("SELECT * FROM performance_date_times");

    // Group dateTimes by performance_id
    const grouped = {};
    for (const dt of dateTimes) {
      if (!grouped[dt.performance_id]) grouped[dt.performance_id] = [];
      grouped[dt.performance_id].push({
        date: dt.date,
        startTime: dt.start_time,
        endTime: dt.end_time,
      });
    }

    // Attach to each performance
    const result = performances.map(p => ({
      ...p,
      dateTimes: grouped[p.performance_id] || [],
    }));

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


// -----------------------------
// 🎭 BULK UPLOAD PERFORMANCES
// -----------------------------
app.post("/app/performances/bulk", async (req, res) => {
  try {
    const performances = req.body;

    if (!Array.isArray(performances) || performances.length === 0) {
      return res.status(400).json({ message: "Invalid or empty performances array." });
    }

    const values = performances.map(({ artist, description, date, startTime, endTime, venue }) => 
      [artist, description, date, startTime, endTime, venue, null]
    );

    const [result] = await pool.query(
      "INSERT INTO performances (artist, description, date, start_time, end_time, venue, photo) VALUES ?",
      [values]
    );

    res.status(201).json({ message: "Bulk upload successful", inserted: result.affectedRows });
  } catch (err) {
    console.error("Bulk upload error:", err.message);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});


// DELETE Performance
app.delete("/app/performances/:performance_id", (req, res) => {
  const { performance_id } = req.params;

  const query = "DELETE FROM performances WHERE performance_id = ?";
  pool.query(query, [performance_id], (err, result) => {
    if (err) {
      console.error("Error deleting performance:", err);
      return res.status(500).send("Error deleting performance.");
    }

    if (result.affectedRows === 0) {
      return res.status(404).send("Performance not found.");
    }

    res.status(200).send("Performance deleted successfully.");
  });
});

app.put("/app/performances/:id", upload.single("photo"), async (req, res) => {
  const id = req.params.id;
  const { artist, description, venue, dateTimes } = req.body;

  const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const parsedDateTimes = JSON.parse(dateTimes);

    if (!artist || !venue || !Array.isArray(parsedDateTimes) || parsedDateTimes.length === 0) {
      return res.status(400).json({ message: "Missing required fields or dateTimes" });
    }

    // Update main performance data
    const updateQuery = `
      UPDATE performances
      SET artist = ?, description = ?, venue = ? ${photoUrl ? ", photo = ?" : ""}
      WHERE performance_id = ?
    `;

    const values = photoUrl
      ? [artist, description ?? null, venue, photoUrl, id]
      : [artist, description ?? null, venue, id];

    await pool.execute(updateQuery, values);

    // Delete existing date_times for this performance
    await pool.execute("DELETE FROM performance_date_times WHERE performance_id = ?", [id]);

    // Insert new dateTimes
    const dateTimeInserts = parsedDateTimes.map(dt => [id, dt.date, dt.startTime, dt.endTime]);
    await pool.query(
      "INSERT INTO performance_date_times (performance_id, date, start_time, end_time) VALUES ?",
      [dateTimeInserts]
    );

    // Fetch updated performance + dateTimes
    const [performances] = await pool.execute("SELECT * FROM performances WHERE performance_id = ?", [id]);
    const [updatedDateTimes] = await pool.execute("SELECT * FROM performance_date_times WHERE performance_id = ?", [id]);

    const result = {
      ...performances[0],
      dateTimes: updatedDateTimes.map(dt => ({
        date: dt.date,
        startTime: dt.start_time,
        endTime: dt.end_time,
      })),
    };

    res.json(result);
  } catch (error) {
    console.error("Error updating performance:", error);
    res.status(500).send("Error updating performance");
  }
});

// -----------------------------
// 💡 EXPERIENCES
// -----------------------------
app.post("/app/experiences", upload.single("photo"), async (req, res) => {
  const { title, description, date, startTime, endTime, venue } = req.body;
  const photo = req.file ? req.file.path : null;

  try {
    const [rows] = await pool.execute(
      "INSERT INTO experiences (title, description, date, start_time, end_time, venue, photo) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [title, description, date, startTime, endTime, venue, photo]
    );
    res.json({ id: rows.insertId, title, description, date, startTime, endTime, venue });
  } catch (err) {
    console.error("Error adding experience:", err);
    res.status(500).send("Server error");
  }
});

app.get("/app/experiences", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM experiences");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching experiences:", err);
    res.status(500).send("Server error");
  }
});

// -----------------------------
// ✨ BULK UPLOAD EXPERIENCES
// -----------------------------
app.post("/app/experiences/bulk", async (req, res) => {
  try {
    const experiences = req.body;

    if (!Array.isArray(experiences) || experiences.length === 0) {
      return res.status(400).json({ message: "Invalid or empty experiences array." });
    }

    const values = experiences.map(({ title, description, date, startTime, endTime, venue }) =>
      [title, description, date, startTime, endTime, venue, null]
    );

    const [result] = await pool.query(
      "INSERT INTO experiences (title, description, date, start_time, end_time, venue, photo) VALUES ?",
      [values]
    );

    res.status(201).json({ message: "Bulk upload successful", inserted: result.affectedRows });
  } catch (err) {
    console.error("Bulk upload error (experiences):", err.message);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

app.put("/app/experiences/:id", upload.single("photo"), async (req, res) => {
  const id = req.params.id;
  const {
    title,
    description,
    date,
    startTime,
    endTime,
    venue,
  } = req.body;

  const photo = req.file ? req.file.path : null; // use .path to be consistent with POST

  try {
    const query = `
      UPDATE experiences
      SET title = ?, description = ?, date = ?, start_time = ?, end_time = ?, venue = ?${photo ? ", photo = ?" : ""}
      WHERE experience_id = ?
    `;

    const values = photo
      ? [title, description, date, startTime, endTime, venue, photo, id]
      : [title, description, date, startTime, endTime, venue, id];

    await pool.query(query, values);

    const [updated] = await pool.query("SELECT * FROM experiences WHERE experience_id = ?", [id]);

    res.json(updated[0]);
  } catch (error) {
    console.error("❌ Error updating experience:", error);
    res.status(500).send("Error updating experience");
  }
});



// -----------------------------
// 📍 VENUES
// -----------------------------
app.get("/app/venues", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM venues");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching venues:", err);
    res.status(500).send("Server error");
  }
});

app.post("/app/venues", async (req, res) => {
  const { name, gps } = req.body;
  try {
    const [rows] = await pool.execute(
      "INSERT INTO venues (name, gps) VALUES (?, ?)",
      [name, gps]
    );
    res.json({ id: rows.insertId, name, gps });
  } catch (err) {
    console.error("Error adding venue:", err);
    res.status(500).send("Server error");
  }
});

// Bulk upload API
app.post("/app/venues/bulk", (req, res) => {
  const venues = req.body;

  // Validate input
  if (!Array.isArray(venues) || venues.length === 0) {
    return res.status(400).json({ error: "Invalid input data" });
  }

  const values = venues.map((venue) => [
    venue.name,
    venue.gps, // This will be NULL as per your request
  ]);

  const query = `
    INSERT INTO venues (name, gps)
    VALUES ?
  `;

  pool.query(query, [values], (err, result) => {
    if (err) {
      console.error("❌ Error inserting data:", err);
      return res.status(500).json({ error: "Failed to insert data" });
    }

    console.log("✅ Bulk upload successful:", result);
    return res.status(200).json({
      inserted: result.affectedRows,
      insertedIds: result.insertId, // This will give the first inserted id (for bulk inserts, more work needed)
    });
  });
});


app.delete("/app/venues/:venue_id", (req, res) => {
  const { venue_id } = req.params;

  const query = "DELETE FROM venues WHERE venue_id = ?";
  pool.query(query, [venue_id], (err, result) => {
    if (err) {
      console.error("Error deleting venue:", err);
      return res.status(500).send("Error deleting venue.");
    }

    if (result.affectedRows === 0) {
      return res.status(404).send("Venue not found.");
    }

    res.status(200).send("Venue deleted successfully.");
  });
});


app.put("/app/venues/:id", async (req, res) => {
  const id = req.params.id;
  const { name, gps, selected } = req.body;

  try {
    const query = `
      UPDATE venues
      SET name = ?, gps = ?
      WHERE venue_id = ?
    `;

    const values = [name, gps ?? 0, id];

    await pool.query(query, values);

    const [updated] = await pool.query("SELECT * FROM venues WHERE venue_id = ?", [id]);

    res.json(updated[0]);
  } catch (error) {
    console.error("Error updating venue:", error);
    res.status(500).send("Error updating venue.");
  }
});



// -----------------------------
// Menue
// -----------------------------

// Get menu items
app.get("/app/menu", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM menu_items ORDER BY position ASC");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching menu items:", err);
    res.status(500).send("Server error");
  }
});

app.post("/app/menu/update", async (req, res) => {
  const updates = req.body; // [{ id: 1, position: 1 }, ...]

  // Ensure the request body is an array and contains valid updates
  if (!Array.isArray(updates)) {
    return res.status(400).send("Invalid input format, expected an array");
  }

  // Filter out invalid updates
  const validUpdates = updates.filter(item => item.id !== undefined && item.position !== undefined);

  // Check if valid updates exist
  if (validUpdates.length === 0) {
    return res.status(400).send("Invalid update data");
  }

  console.log("Valid updates:", validUpdates);  // Debugging log

  try {
    // Execute the SQL queries for each valid update
    const updatePromises = validUpdates.map((item) =>
      pool.execute("UPDATE menu_items SET position = ? WHERE menu_id = ?", [item.position, item.id])
    );

    await Promise.all(updatePromises);
    res.sendStatus(200);  // Success response
  } catch (err) {
    console.error("Error updating positions:", err);  // Logging error details
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
