import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import axios from "axios";
import { MapContainer, TileLayer, useMap} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MdLocationPin } from "react-icons/md";


const API = "https://gallisalli.com/app";

const VenueManagement = () => {
  const [venues, setVenues] = useState([]);
  const [mode, setMode] = useState("individual");
  const [newVenue, setNewVenue] = useState({ name: "", gps: "" });
  const [showMap, setShowMap] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
      const [confirmDeleteId, setConfirmDeleteId] = useState(null); // State for confirmation
      const [deleteMessage, setDeleteMessage] = useState(null);

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


  const MapWithCenterControl = ({ onDone }) => {
    const map = useMap();
    const mapRef = useRef(null);
  
    useEffect(() => {
      mapRef.current = map;
    }, [map]);
  
    return (
      <button
        onClick={() => {
          const center = map.getCenter();
          onDone(center); // Pass coordinates back
        }}
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px 20px",
          background: "green",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          zIndex: 1001,
        }}
      >
        Done
      </button>
    );
  };



  const toggleEdit = (index, value) => {
    const updated = venues.map((v, i) =>
      i === index ? { ...v, editing: value } : { ...v, editing: false }
    );
    setVenues(updated);
  
    if (value) {
      // Switch to individual mode and load venue into input fields
      setMode("individual");
      setNewVenue({ name: venues[index].name, gps: venues[index].gps });
      setEditingIndex(index);
    } else {
      setNewVenue({ name: "", gps: "" });
      setEditingIndex(null);
    }
  };
  
  
  const handleEditSave = () => {
    const venue = venues[editingIndex];
    fetch(`${API}/venues/${venue.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newVenue),
    })
      .then(async (res) => {
  const text = await res.text();
  const data = text ? JSON.parse(text) : {}; // Handle empty response
  return data;
})
      .then((data) => {
        const updated = [...venues];
        updated[editingIndex] = { ...venue, ...newVenue, editing: false };
        setVenues(updated);
        setNewVenue({ name: "", gps: "" });
        setEditingIndex(null);
        alert("Venue updated successfully.");
      })
      .catch((err) => console.error("Update failed:", err));
  };

   // Delete food toilet with confirmation
   const handleDelete = (id) => {
    console.log("handleDelete triggered for id:", id);
    setConfirmDeleteId(id);
  };
  const confirmDelete = async (id) => {
    try {
      await axios.delete(`${API}/venues/${id}`);
      setVenues(venues.filter((venues) => venues.id !== id));
      setDeleteMessage("✅ Venue deleted.");
      setTimeout(() => setDeleteMessage(null), 2000);
    } catch (error) {
      console.error("Error deleting toilet:", error);
    }
  };
  
  const cancelDelete = () => {
    setConfirmDeleteId(null); // Close confirmation modal
    setDeleteMessage("❌ Delete cancelled.");
    setTimeout(() => setDeleteMessage(null), 2000);
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
  return (
    <>
    
      <div style={{ display: "flex", justifyContent: "center", gap: "40px", padding: "20px" }}>

         {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <p>Are you sure you want to delete this experience?</p>
            <div style={styles.modalButtons}>
              <button
                onClick={() => { confirmDelete(confirmDeleteId); setConfirmDeleteId(null); }}
                style={{ ...styles.confirmBtn, backgroundColor: "#28a745" }}
              >
                Yes
              </button>
              <button
                onClick={cancelDelete}
                style={{ ...styles.confirmBtn, backgroundColor: "#dc3545" }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Message Toast */}
      {deleteMessage && (
        <div style={styles.toast}>{deleteMessage}</div>
      )}
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

              <h4> GPS <em style={{ fontSize: "0.9em", color: "#555" }}>(e.g. 27.713422, 85.299919)</em></h4>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
  <input
    type="text"
    name="gps"
    value={newVenue.gps}
    onChange={handleInputChange}
    placeholder="GPS (lat, long)"
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
{editingIndex !== null ? (
  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
    <button onClick={handleEditSave} style={styles.addButton}>
      Save Changes
    </button>
    <button
      onClick={() => toggleEdit(editingIndex, false)}
      style={{ ...styles.addButton, background: "gray" }}
    >
      Cancel
    </button>
  </div>
) : (
  <button onClick={addVenue} style={{ ...styles.addButton, marginTop: "10px" }}>
    Add
  </button>
)}

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
        <div style={{ width: "60%", textAlign: "left" }}>
  <h2>Venues ({venues.length})</h2>
  <table
  border="1"
  cellPadding="5"
  style={{
    width: "100%",
    textAlign: "left",
    borderCollapse: "collapse"
  }}
>
    <thead>
      <tr>
        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ccc" }}>Name</th>
        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ccc" }}>GPS</th>
        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ccc" }}>Actions</th>
      </tr>
    </thead>
    <tbody>
      {venues.map((venue, index) => (
        <tr key={venue.id}>
          <td style={{ padding: "8px" }}>{venue.name}</td>
          <td style={{ padding: "8px"}}>{venue.gps}</td>
          <td style={{ padding: "8px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => toggleEdit(index, true)}
              style={{
                backgroundColor: "#ffc107",
                border: "none",
                padding: "5px 10px",
                borderRadius: "5px",
                cursor: "pointer",
                color: "white",
                display: "flex",
                alignItems: "center"
              }}
            >
               <i className="bi bi-pencil-square"></i>
            </button>
            <button
              onClick={() => handleDelete(venue.venue_id)}
              style={{
                backgroundColor: "#dc3545",
                border: "none",
                padding: "5px 10px",
                borderRadius: "5px",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center"
              }}
            >
              <i className="bi bi-trash"></i>
            </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


        
      </div>

{showMap && (
  <div style={styles.mapOverlay}>
    <button onClick={() => setShowMap(false)} style={styles.closeButton}>
      ❌
    </button>
    <div style={styles.mapContainer}>
      <MapContainer center={[27.7172, 85.324]} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapWithCenterControl
          onDone={(center) => {
            setNewVenue((prev) => ({
              ...prev,
              gps: `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`,
            }));
            setShowMap(false);
          }}
        />
      </MapContainer>

      {/* Fixed center pin icon */}
      <div style={styles.pinIcon}>
        <MdLocationPin size={30} color="red" />
      </div>
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
  pinIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -100%)", // Adjust vertical offset to center bottom of pin
    fontSize: "30px",
    zIndex: 999,
    pointerEvents: "none", // So map is still interactive
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    width: "300px",
    textAlign: "center",
  },
  modalButtons: {
    display: "flex",
    justifyContent: "space-around",
    marginTop: "15px",
  },
  confirmBtn: {
    padding: "10px 20px",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    borderRadius: "5px",
  },
  toast: {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px 20px",
    backgroundColor: "green",
    color: "white",
    borderRadius: "5px",
  },
};

export default VenueManagement;
