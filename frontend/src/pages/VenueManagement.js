import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const API = "https://gallisalli.com/app";

const VenueManagement = () => {
  const [venues, setVenues] = useState([]);
  const [mode, setMode] = useState("individual");
  const [newVenue, setNewVenue] = useState({ name: "", gps: "" });
  const [showMap, setShowMap] = useState(false);
  const [csvFile, setCsvFile] = useState(null);

  useEffect(() => {
    console.log("Fetching venues from API...");
    fetch(`${API}/venues`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched venues:", data);
        setVenues(data);
      })
      .catch((err) => console.error("Error fetching venues:", err));
  }, []);

  const handleInputChange = (e) => {
    console.log(`Updating input field ${e.target.name} to: ${e.target.value}`);
    setNewVenue({ ...newVenue, [e.target.name]: e.target.value });
  };

  const addVenue = () => {
    if (newVenue.name && newVenue.gps) {
      console.log("Adding new venue:", newVenue);

      fetch(`${API}/venues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVenue),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Venue added successfully:", data);
          setVenues([...venues, data]);
        })
        .catch((err) => console.error("Error adding venue:", err));

      setNewVenue({ name: "", gps: "" });
    } else {
      console.warn("Cannot add venue. Missing name or GPS.");
    }
  };

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  });

  const MapSelector = ({ setNewVenue, setShowMap }) => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setNewVenue((prev) => ({ ...prev, gps: coords }));
        setShowMap(false);
      },
    });
    return null;
  };
  

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setCsvFile(file);
    console.log("📁 File selected:", file?.name);
  };

  const handleBulkUpload = () => {
    if (!csvFile) {
      alert("Please select a CSV file first.");
      return;
    }

    Papa.parse(csvFile, {
      complete: async (result) => {
        console.log("📄 Raw parsed CSV data:", result.data);

        const newVenues = result.data
          .filter((row, index) => {
            const isValid = row.length >= 3 && row.every((cell) => cell.trim() !== "");
            if (!isValid) {
              console.warn(`⚠️ Skipping invalid row at index ${index}:`, row);
            }
            return isValid;
          })
          .map((row) => ({
            name: row[0],
            gps: `${row[1]}, ${row[2]}`,
            selected: null,
          }));

        console.log("🆕 New venues to upload:", newVenues);

        try {
          const response = await fetch(`${API}/venues/bulk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newVenues),
          });
          const text = await response.text();
          const data = JSON.parse(text);

          console.log("✅ Server response (parsed):", data);
          alert(`${data.inserted} venues uploaded successfully.`);

          setVenues((prevVenues) => [
            ...prevVenues,
            ...newVenues.map((venue, index) => ({
              id: data.insertedIds[index],
              name: venue.name,
              gps: venue.gps,
              selected: venue.selected,
            })),
          ]);
        } catch (err) {
          console.error("❌ Bulk upload failed:", err);
        }
      },
      skipEmptyLines: true,
    });
  };

  const toggleSelection = (id) => {
    console.log(`Toggling selection for venue ID: ${id}`);
    fetch(`${API}/venues/${id}/select`, { method: "PUT" })
      .then((res) => res.json())
      .then((updatedVenue) => {
        setVenues(venues.map((v) => (v.id === updatedVenue.id ? updatedVenue : v)));
      })
      .catch((err) => console.error("Error toggling selection:", err));
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", gap: "40px", padding: "20px" }}>
        <div style={{ width: "40%", textAlign: "left" }}>
          <h2>VENUES</h2>
          <p>Total {venues.length}</p>
          <h3 style={{ color: "blue", fontWeight: "bold" }}>VENUE LIST</h3>
          {venues.map((venue) => (
            <div key={venue.id} style={{ marginBottom: "5px" }}>
              <input type="checkbox" checked={venue.selected} onChange={() => toggleSelection(venue.id)} />
              <span style={{ marginLeft: "5px" }}>
                {venue.name} | <span style={{ color: "blue" }}>GPS</span>
              </span>
            </div>
          ))}
        </div>

        <div style={{ width: "50%", border: "1px solid black", padding: "20px", borderRadius: "10px" }}>
          <div style={styles.modeButtons}>
            <button
              onClick={() => setMode("individual")}
              style={{
                ...styles.modeButton,
                backgroundColor: mode === "individual" ? "#007bff" : "#444",
                borderRadius: "5px 0 0 5px",
              }}
            >
              Individual
            </button>
            <button
              onClick={() => setMode("bulk")}
              style={{
                ...styles.modeButton,
                backgroundColor: mode === "bulk" ? "#007bff" : "#444",
                borderRadius: "0 5px 5px 0",
              }}
            >
              Bulk Upload
            </button>
          </div>

          {mode === "individual" ? (
            <>
              <h4>Location Name</h4>
              <input
                type="text"
                name="name"
                value={newVenue.name}
                onChange={handleInputChange}
                placeholder="Enter location name"
                style={styles.input}
              />

              <h4>GPS</h4>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
  <input
    type="text"
    name="gps"
    value={newVenue.gps}
    onChange={handleInputChange}
    placeholder="Enter GPS coordinates"
    style={{ ...styles.input, flex: 1 }}
  />
  <button
    onClick={() => setShowMap(true)}
    style={{
      ...styles.addButton,
      padding: "8px 12px",
      whiteSpace: "nowrap",
    }}
  >
    Browse on Map
  </button>
</div>
<button onClick={addVenue} style={{ ...styles.addButton, marginTop: "10px" }}>
  Add
</button>

            </>
          ) : (
            <>
              <h4>Upload CSV file with Location Name, GPS</h4>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <input type="file" accept=".csv" onChange={handleFileChange} style={styles.input} />
                <button onClick={handleBulkUpload} style={{ ...styles.addButton, marginTop: "10px" }}>
                  Upload
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showMap && (
        <div style={styles.mapOverlay}>
          <div style={styles.mapContainer}>
            <button onClick={() => setShowMap(false)} style={styles.closeButton}>
              ❌
            </button>
            <MapContainer center={[27.7172, 85.324]} zoom={13} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapSelector setNewVenue={setNewVenue} setShowMap={setShowMap} />
            </MapContainer>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  modeButtons: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  modeButton: {
    padding: "10px 20px",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    width: "150px",
  },
  input: {
    width: "90%",
    marginBottom: "15px",
    padding: "12px",
    fontSize: "1.1rem",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  addButton: {
    background: "#0789e6",
    color: "white",
    padding: "12px 24px",
    borderRadius: "10px",
    fontSize: "1rem",
    border: "none",
    cursor: "pointer",
  },
  mapOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  mapContainer: {
    width: "80vw",
    height: "80vh",
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: "10px",
    right: "20px",
    fontSize: "1.2rem",
    background: "transparent",
    border: "none",
    cursor: "pointer",
  },
};

export default VenueManagement;
