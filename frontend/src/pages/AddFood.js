import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMapEvents, useMap} from "react-leaflet";
import Papa from "papaparse";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MdLocationPin } from "react-icons/md";

const API = "https://gallisalli.com/app";

const FoodPage = () => {
  const [foodPlaces, setFoodPlaces] = useState([]);
  const [formData, setFormData] = useState({ name: "", gps: "", remarks: "" });
  const [mode, setMode] = useState("individual");
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // State for confirmation
  const [deleteMessage, setDeleteMessage] = useState(null);
    const [showMapModal, setShowMapModal] = useState(false);


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
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
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
               <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
  <input
    type="text"
    placeholder="GPS (lat, long)"
    value={formData.gps}
    onChange={(e) => setFormData({ ...formData, gps: e.target.value })}
    style={{ flex: 1 }}
  />
 <button
  type="button"
  onClick={() => setShowMapModal(true)}
  style={{   ...styles.addButton,
    padding: "8px 12px",
    whiteSpace: "nowrap",}}
>
  Browse on Map
</button>
</div>
              <input
                type="text"
                placeholder="Remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                style={{ width: "100%", marginBottom: "10px" }}
              />
                  <div style={{ textAlign: "center" }}>
              <button onClick={handleSave} style={{ ...styles.addButton, marginTop: "10px" }}>
  {editingId ? "Update" : "Add"}
</button>
</div>

            </div>
          )}

{mode === "bulk" && (
  <div style={{ marginTop: "15px" }}>
    <h3>Bulk Upload</h3>
    <h4>Upload CSV with Location Name, GPS(lat,long), remarks</h4>
    <input type="file" accept=".csv" onChange={handleFileChange} style={{ width: "100%", marginBottom: "10px" }}/>
    <div style={{ textAlign: "center" }}>
  <button onClick={handleBulkUpload} style={{ ...styles.addButton, marginTop: "10px" }}>
    Upload
  </button>
</div>

  </div>
)}

        </div>

        {showMapModal && (
        <div style={styles.modalOverlay}>
            <button
                onClick={() => setShowMapModal(false)}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  padding: "6px 12px",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
          <div style={{ ...styles.modal, width: "90vw", height: "80vh" }}>
            <div style={{ height: "100%", width: "100%", position: "relative" }}>
              <MapContainer
                center={[27.7172, 85.3240]} // Kathmandu as default center
                zoom={13}
                style={{ height: "100%", width: "100%", borderRadius: "10px" }}    
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
               <MapWithCenterControl
          onDone={(center) => {
            setFormData((prev) => ({
              ...prev,
              gps: `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`,
            }));
            setShowMapModal(false);
          }}
        />
              </MapContainer>
      
             {/* Fixed center pin icon */}
                  <div style={styles.pinIcon}>
                    <MdLocationPin size={30} color="red" />
                  </div>
            </div>
          </div>
        </div>
      )}
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
                <th>Location Name</th>
                <th>GPS</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {foodPlaces.map((place) => (
                <tr key={place.id}>
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
  pinIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -100%)", // Adjust vertical offset to center bottom of pin
    fontSize: "30px",
    zIndex: 999,
    pointerEvents: "none", // So map is still interactive
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
};

export default FoodPage;
