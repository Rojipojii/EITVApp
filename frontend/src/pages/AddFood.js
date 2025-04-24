import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import Papa from "papaparse";
import axios from "axios";

const API = "https://gallisalli.com/app";

const FoodPage = () => {
  const [foodPlaces, setFoodPlaces] = useState([]);
  const [formData, setFormData] = useState({ name: "", gps: "", remarks: "" });
  const [mode, setMode] = useState("individual");
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // State for confirmation
  const [deleteMessage, setDeleteMessage] = useState(null);


  // Fetch food places
  useEffect(() => {
    const fetchFoodPlaces = async () => {
      try {
        const res = await axios.get(`${API}/foodplaces`);
        setFoodPlaces(
          res.data.map((place) => ({
            id: place.foodplaces_id, // ✅ fix here
            name: place.name,
            gps: [place.gps_lat, place.gps_long],
            remarks: place.remarks,
          }))
        );
      } catch (error) {
        console.error("Error fetching food places data:", error);
      }
    };
    fetchFoodPlaces();
  }, []);

  // Handle GPS selection on the map
  const HandleMapClick = ({ setGps }) => {
    useMapEvents({
      click(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        setGps(`${lat}, ${lng}`);
      },
    });
    return null;
  };

  const handleSave = async () => {
    if (!formData.name || !formData.gps) return;
    const gpsArray = formData.gps.split(",").map(Number);
  
    const updatedPlace = {
      name: formData.name,
      gps: gpsArray,
      remarks: formData.remarks,
    };
  
    try {
      if (editingId) {
        await axios.put(`${API}/foodplaces/${editingId}`, updatedPlace);
        setFoodPlaces((prev) =>
          prev.map((place) =>
            place.id === editingId
              ? { ...place, name: updatedPlace.name, gps: gpsArray, remarks: updatedPlace.remarks }
              : place
          )
        );
      } else {
        const res = await axios.post(`${API}/foodplaces`, updatedPlace);
        setFoodPlaces((prev) => [
          ...prev,
          {
            id: res.data.id,
            name: res.data.name,
            gps: [res.data.gps_lat, res.data.gps_long],
            remarks: res.data.remarks,
          },
        ]);
      }
  
      // Reset form
      setFormData({ name: "", gps: "", remarks: "" });
      setEditingId(null);
    } catch (error) {
      console.error("Error saving food place:", error);
    }
  };
  

  const handleEdit = (place) => {
    console.log("🛠️ Editing place:", place);
    setFormData({
      name: place.name,
      gps: place.gps.join(", "),
      remarks: place.remarks,
    });
    setEditingId(place.id);
    setMode("individual");
  };
  
  

  // Delete food place with confirmation
  const handleDelete = (id) => {
    setConfirmDeleteId(id); // Open confirmation modal
  };

  const confirmDelete = async (id) => {
    try {
      await axios.delete(`${API}/foodplaces/${id}`);
      setFoodPlaces(foodPlaces.filter((place) => place.id !== id));
      setDeleteMessage("✅ Food place deleted.");
      setTimeout(() => setDeleteMessage(null), 2000);
    } catch (error) {
      console.error("Error deleting food place:", error);
    }
  };

  const cancelDelete = () => {
    setConfirmDeleteId(null); // Close confirmation modal
    setDeleteMessage("❌ Delete cancelled.");
    setTimeout(() => setDeleteMessage(null), 2000);
  };



   const [csvFile, setCsvFile] = useState(null);
  
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
  
        const newFoodPlaces = result.data
          .filter((row, index) => {
            // Validate the row to ensure all necessary fields are present
            const isValid = row.length >= 3 && row.every(cell => cell.trim() !== "");
            if (!isValid) {
              console.warn(`⚠️ Skipping invalid row at index ${index}:`, row);
            }
            return isValid;
          })
          .map((row) => {
            // Directly map GPS latitude and longitude
            console.log("📍 Raw GPS data for row:", row[1], row[2]); // Logging gps_lat and gps_long
  
            return {
              name: row[0], // food place name
              gps_lat: parseFloat(row[1]) || null, // GPS latitude (first value)
              gps_long: parseFloat(row[2]) || null, // GPS longitude (second value)
              remarks: row[3] || "", // remarks
            };
          });
  
        console.log("🆕 New food places to upload:", newFoodPlaces);
  
        try {
          const response = await fetch("https://gallisalli.com/app/foodplaces/bulk", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(newFoodPlaces),
          });
  
          const data = await response.json();
          console.log("✅ Server response:", data);
  
          alert(`${data.inserted} food places uploaded successfully.`);
  
          // Optionally, refresh the list
          setFoodPlaces((prev) => [
            ...prev,
            ...newFoodPlaces.map((place, index) => ({
              id: data.insertedIds[index], // Assuming the server returns inserted IDs
              name: place.name,
              gps_lat: place.gps_lat,
              gps_long: place.gps_long,
              remarks: place.remarks,
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
      <div style={{ display: "flex", gap: "20px" }}>
        {/* List of Locations */}
        <div style={{ flex: 2, background: "#f8f9fa", padding: "15px", borderRadius: "10px" }}>
          <h3>Food Places ({foodPlaces.length})</h3>
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
                <th></th>
                <th>Location Name</th>
                <th>GPS</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {foodPlaces.map((place) => (
                <tr key={place.id}>
                  <td><input type="checkbox" /></td>
                  <td>{place.name}</td>
                  <td>{place.gps.join(", ")}</td>
                  <td>{place.remarks}</td>
                  <td>
  <div style={{ display: "flex", gap: "10px" }}>
    <button
      onClick={() => handleEdit(place)}
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
      onClick={() => handleDelete(place.id)}
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

        {/* Add Location Section */}
        <div style={{ flex: 1, background: "#ffffff", padding: "15px", borderRadius: "10px", border: "1px solid #ccc" }}>
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
          <div style={{ display: "flex", justifyContent: "space-between" }}>
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
          </div>

          {mode === "individual" && (
            <div style={{ marginTop: "15px" }}>
              <h3>Add New Food Place</h3>
              <input
                type="text"
                placeholder="Location name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: "100%", marginBottom: "10px" }}
              />
              <div style={{ marginBottom: "10px" }}>
          <label>GPS (lat, long): </label>
          <input
            type="text"
            placeholder="Click on map to select"
            value={formData.gps}
            readOnly
            style={{ width: "80%", marginRight: "10px" }}
          />
          <button
            onClick={() => setFormData({ ...formData, gps: "" })}
            style={{ backgroundColor: "#007bff", color: "white", padding: "5px 10px", borderRadius: "5px" }}
          >
            Clear
          </button>
        </div>
              <input
                type="text"
                placeholder="Remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                style={{ width: "100%", marginBottom: "10px" }}
              />
              <button onClick={handleSave} style={{ width: "100%" }}>
  {editingId ? "Update" : "Add"}
</button>

            </div>
          )}

{mode === "bulk" && (
  <div style={{ marginTop: "15px" }}>
    <h3>Bulk Upload</h3>
    <input type="file" accept=".csv" onChange={handleFileChange} style={{ width: "100%", marginBottom: "10px" }}/>
<button onClick={handleBulkUpload} style={{ width: "100%" }}>
                Upload
              </button>
  </div>
)}

        </div>

      {/* Map Section */}
      <div style={{ marginTop: "20px", width: "100%" }}>
          <h3>Browse on Map</h3>
          <MapContainer center={[27.7172, 85.324]} zoom={13} style={{ height: "300px", width: "100%", borderRadius: "10px" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <HandleMapClick setGps={(gps) => setFormData({ ...formData, gps })} />
            {foodPlaces.map((place) => (
              <Marker key={place.id} position={place.gps}>
                <Popup>{place.name}</Popup>
              </Marker>
            ))}
          </MapContainer>
          </div>
    </div>
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
    backgroundColor: "#0789e6",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    borderRadius: "5px",
    transition: "background-color 0.3s",
    width: "150px",
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

export default FoodPage;
