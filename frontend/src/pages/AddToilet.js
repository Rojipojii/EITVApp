import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMapEvents, useMap} from "react-leaflet";
import Papa from "papaparse";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MdLocationPin } from "react-icons/md";


const API = "https://gallisalli.com/app"; // Change if different backend URL

const ToiletPage = () => {
  const [toilets, setToilets] = useState([]);
  const [formData, setFormData] = useState({ name: "", gps: "", remarks: "" });
   const [mode, setMode] = useState("individual");
    const [editingId, setEditingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null); // State for confirmation
    const [deleteMessage, setDeleteMessage] = useState(null);
     const [showMapModal, setShowMapModal] = useState(false);

    useEffect(() => {
      const fetchToilets = async () => {
        try {
          const res = await axios.get(`${API}/toilets`);
          setToilets(
            res.data.map((toilet) => ({
              id: toilet.toilet_id, // ✅ adjust based on your actual key
              name: toilet.name,
              gps: [toilet.gps_lat, toilet.gps_long],
              remarks: toilet.remarks,
            }))
          );
        } catch (error) {
          console.error("Error fetching toilets data:", error);
        }
      };
      fetchToilets();
    }, []);

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
    

    const handleSave = async () => {
      if (!formData.name || !formData.gps) return;
      const gpsArray = formData.gps.split(",").map(Number);
    
      const updatedToilet = {
        name: formData.name,
        gps: gpsArray,
        remarks: formData.remarks,
      };
    
      try {
        if (editingId) {
          await axios.put(`${API}/toilets/${editingId}`, updatedToilet);
          setToilets((prev) =>
            prev.map((toilet) =>
              toilet.id === editingId
                ? { ...toilet, name: updatedToilet.name, gps: gpsArray, remarks: updatedToilet.remarks }
                : toilet
            )
          );
        } else {
          const res = await axios.post(`${API}/toilets`, updatedToilet);
          setToilets((prev) => [
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
        console.error("Error saving toilet data:", error);
      }
    };
    
    const handleEdit = (toilet) => {
      console.log("🛠️ Editing toilet:", toilet );
      setFormData({
        name: toilet.name,
        gps: toilet.gps.join(", "),
        remarks: toilet.remarks,
      });
      setEditingId(toilet.id);
      setMode("individual");
    };
    
    // Delete food toilet with confirmation
  const handleDelete = (id) => {
    setConfirmDeleteId(id); // Open confirmation modal
  };

  const confirmDelete = async (id) => {
    try {
      await axios.delete(`${API}/toilets/${id}`);
      setToilets(toilets.filter((toilet) => toilet.id !== id));
      setDeleteMessage("✅ Toilet deleted.");
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
  

   delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
      iconUrl: require("leaflet/dist/images/marker-icon.png"),
      shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
    });
  

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

      const newToilets = result.data
        .filter((row, index) => {
          const isValid = row.length >= 3 && row.every(cell => cell.trim() !== "");
          if (!isValid) {
            console.warn(`⚠️ Skipping invalid row at index ${index}:`, row);
          }
          return isValid;
        })
        .map((row) => {
          console.log("📍 Raw GPS data for row:", row[1], row[2]);

          return {
            name: row[0], // toilet name or location
            gps_lat: parseFloat(row[1]) || null,
            gps_long: parseFloat(row[2]) || null,
            remarks: row[3] || "",
          };
        });

      console.log("🆕 New toilets to upload:", newToilets);

      try {
        const response = await fetch("https://gallisalli.com/app/toilets/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newToilets),
        });

        const data = await response.json();
        console.log("✅ Server response:", data);

        alert(`${data.inserted} toilets uploaded successfully.`);

        setToilets((prev) => [
          ...prev,
          ...newToilets.map((toilet, index) => ({
            id: data.insertedIds[index],
            name: toilet.name,
            gps_lat: toilet.gps_lat,
            gps_long: toilet.gps_long,
            remarks: toilet.remarks,
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

            {/* Right Side - Add Toilets */}
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
              <h3>Add New Toilet</h3>
              <input type="text" placeholder="Location name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", marginBottom: "10px" }} />
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
  style={{ padding: "6px 12px", cursor: "pointer" }}
>
  Browse on Map
</button>
</div>
              <input type="text" placeholder="Remarks" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} style={{ width: "100%", marginBottom: "10px" }} />
              <button onClick={handleSave} style={{ width: "100%" }}>
  {editingId ? "Update" : "Add"}
</button>
            </div>
          )}

          {mode === "bulk" && (
            <div style={{ marginTop: "15px" }}>
              <h3>Bulk Upload</h3>
              <h4>Upload CSV with Location Name, GPS(lat,long), remarks</h4>
              <input type="file" accept=".csv" onChange={handleFileChange} style={{ width: "100%" }} />
              <button onClick={handleBulkUpload} style={{ width: "100%" }}>
                Upload
              </button>
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
     
        {/* Left Side - List of Toilets */}
        <div style={{ flex: 2, background: "#f8f9fa", padding: "15px", borderRadius: "10px" }}>
          <h3>Public Toilets ({toilets.length})</h3>
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
              {toilets.map((toilet) => (
                <tr key={toilet.id}>
                  <td>{toilet.name}</td>
                  <td>{toilet.gps.join(", ")}</td>
                  <td>{toilet.remarks}</td>
                  <td>
  <div style={{ display: "flex", gap: "10px" }}>
    <button
      onClick={() => handleEdit(toilet)}
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
      onClick={() => handleDelete(toilet.id)}
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
export default ToiletPage;
