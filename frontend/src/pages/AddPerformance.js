import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { format, parseISO } from 'date-fns';


const AddPerformance = () => {
  const [performances, setPerformances] = useState([]);
  const [mode, setMode] = useState("individual");
  const [newPerformance, setNewPerformance] = useState({
    artist: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    venue: "",
    photo: "",
    dateTimes: [] // <-- Add this line
  });

  const [venues, setVenues] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showBulkSuccess, setShowBulkSuccess] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
 const [deleteMessage, setDeleteMessage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [successType, setSuccessType] = useState(null); // 'add' or 'update'


  useEffect(() => {
    fetchPerformances();
    fetchVenues(); // add this line
  }, []);

  const fetchPerformances = async () => {
    try {
      const response = await fetch("https://gallisalli.com/app/performances");
      const data = await response.json();
      console.log(data);
      setPerformances(data);
    } catch (error) {
      console.error("Error fetching performances:", error);
    }
  };

  const fetchVenues = async () => {
    try {
      const response = await fetch("https://gallisalli.com/app/venues");
      const data = await response.json();
      console.log("🎪 Venues:", data);
      setVenues(data);
    } catch (error) {
      console.error("❌ Error fetching venues:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPerformance({ ...newPerformance, [name]: value });
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setNewPerformance(prev => ({ ...prev, photo: file }));
      } else {
        alert("Please upload a valid image file.");
      }
    }
  };
  
  const addPerformance = async () => {
    if (!newPerformance.artist || !newPerformance.date || !newPerformance.startTime || !newPerformance.venue) {
      console.warn("⚠️ Missing required fields:", newPerformance);
      return;
    }
  
    const formData = new FormData();
  
    // Append all fields to FormData and log each key/value
    Object.entries(newPerformance).forEach(([key, value]) => {
      if (key === "photo") {
        if (value instanceof File) {
          formData.append(key, value);
          console.log(`📸 Appending photo: ${value.name}`);
        } else {
          console.log(`⚠️ Skipping non-File photo value:`, value);
        }
      } else {
        formData.append(key, value);
        console.log(`📝 Appending ${key}:`, value);
      }
    });
  
    // Show everything inside FormData before sending
    console.log("🚀 Sending FormData:");
    for (let pair of formData.entries()) {
      console.log(`${pair[0]}:`, pair[1]);
    }
  
    try {
      const response = await fetch("https://gallisalli.com/app/performances", {
        method: "POST",
        body: formData,
      });
  
      // Handle non-200 responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Server responded with status ${response.status}:`, errorText);
        return;
      }
  
      const data = await response.json();
      console.log("✅ Performance added successfully:", data);
  
      setPerformances([...performances, data]);
      setNewPerformance({
        artist: "",
        description: "",
        date: "",
        startTime: "",
        endTime: "",
        venue: "",
        photo: null,
      });
      setSuccessType("add");
      setShowSuccessMessage(true); // Show success message
      setTimeout(() => setShowSuccessMessage(false), 3000); // Hide after 3s
    } catch (error) {
      console.error("❌ Error adding performance:", error);
    }
  };

  const handleUpdatePerformance = async () => {
    if (!newPerformance.artist || !newPerformance.date || !newPerformance.startTime || !newPerformance.venue) {
      console.warn("⚠️ Missing required fields:", newPerformance);
      return;
    }
  
    const formData = new FormData();
    Object.entries(newPerformance).forEach(([key, value]) => {
      if (key === "photo") {
        if (value instanceof File) {
          formData.append(key, value);
        }
      } else {
        formData.append(key, value);
      }
    });
  
    try {
      const response = await fetch(`https://gallisalli.com/app/performances/${editingId}`, {
        method: "PUT",
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Update failed:`, errorText);
        return;
      }
  
      const updatedPerformance = await response.json();
  
      setPerformances((prevPerformances) =>
        prevPerformances.map((p) =>
          p.performance_id === editingId ? updatedPerformance : p
        )
      );
  
      setNewPerformance({
        artist: "",
        description: "",
        date: "",
        startTime: "",
        endTime: "",
        venue: "",
        photo: "",
      });
  
      setEditingId(null);
      setSuccessType("update");
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error("❌ Error updating performance:", error);
    }
  };
  
  const formatDateWithSuffix = (isoDate) => {
    if (!isoDate) return '';
    const date = parseISO(isoDate);
    const day = date.getDate();
    const suffix =
      day % 10 === 1 && day !== 11
        ? 'st'
        : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
        ? 'rd'
        : 'th';
  
    return format(date, `d'${suffix}' MMMM yyyy`);
  };
  
  
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(Number(hours));
    date.setMinutes(Number(minutes));
    return format(date, 'h:mm a');
  };
  
  const handleEdit = (performance) => {
    setMode("individual");
  
    // Ensure date is in YYYY-MM-DD format for <input type="date" />
    const formattedDate = performance.date ? performance.date.slice(0, 10) : "";
  
    // Set the new performance data
    setNewPerformance({
      artist: performance.artist,
      description: performance.description,
      date: formattedDate,
      startTime: performance.start_time,
      endTime: performance.end_time,
      venue: performance.venue,
      photo: performance.photo || "", // include the photo URL if available
    });
  
    setEditingId(performance.performance_id);
  
    // Log the full details of the performance being edited
    console.log("✏️ Currently editing performance details:", {
      id: performance.performance_id,
      artist: performance.artist,
      description: performance.description,
      date: formattedDate,
      startTime: performance.start_time,
      endTime: performance.end_time,
      venue: performance.venue,
      photo: performance.photo,
    });
  };
  
  
  
  
  const confirmDelete = async (performance_id) => {
    try {
      const response = await fetch(`https://gallisalli.com/app/performances/${performance_id}`, {
        method: "DELETE",
      });
  
      if (response.ok) {
        setPerformances(performances.filter((p) => p.performance_id !== performance_id));
        setDeleteMessage("✅ Performance deleted successfully.");
        setTimeout(() => {
          setDeleteMessage(null);
        }, 3000); // Hide message after 3 seconds
      } else {
        const errorText = await response.text();
        console.error("❌ Delete failed:", errorText);
        setDeleteMessage("❌ Failed to delete performance.");
        setTimeout(() => {
          setDeleteMessage(null);
        }, 3000); // Hide message after 3 seconds
      }
    } catch (error) {
      console.error("❌ Error deleting performance:", error);
      setDeleteMessage("❌ Error occurred while deleting.");
      setTimeout(() => {
        setDeleteMessage(null);
      }, 3000); // Hide message after 3 seconds
    }
  
    // Close the modal after delete confirmation
    setConfirmDeleteId(null);
  };
  
  
  const getVenueName = (venueNameOrId) => {
    const venue = venues.find(v => v.venue_id === parseInt(venueNameOrId) || v.name === venueNameOrId);
    return venue ? venue.name : "Unknown venue";
  };
  const handleAddDateTime = () => {
    const last = newPerformance.dateTimes.at(-1);
    if (last && (!last.date || !last.startTime || !last.endTime)) {
      alert("Please complete the previous row before adding another.");
      return;
    }
    setNewPerformance({
      ...newPerformance,
      dateTimes: [...newPerformance.dateTimes, { date: '', startTime: '', endTime: '' }]
    });
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

        const newPerformances = result.data
          .filter((row, index) => {
            const isValid = row.length === 6 && row.every(cell => cell.trim() !== "");
            if (!isValid) {
              console.warn(`⚠️ Skipping invalid row at index ${index}:`, row);
            }
            return isValid;
          })
          .map((row) => ({
            artist: row[0],
            description: row[1],
            date: row[2],
            startTime: row[3],
            endTime: row[4],
            venue: row[5],
          }));

        console.log("🆕 New performances to upload:", newPerformances);

        try {
          const response = await fetch("https://gallisalli.com/app/performances/bulk", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(newPerformances),
          });

          const data = await response.json();
          console.log("✅ Server response:", data);

          setPerformances((prev) => [...prev, ...newPerformances]);
          setShowBulkSuccess(true);
          setTimeout(() => setShowSuccessMessage(false), 3000); // Hide after 3s

        } catch (err) {
          console.error("❌ Bulk upload failed:", err);
        }
      },
      skipEmptyLines: true,
    });
  };

  return (
    // <div style={styles.container}>
      <div style={styles.content}>

        <div style={styles.formContainer}>
        {showSuccessMessage && (
  <div style={styles.toast}>
    {successType === "update"
      ? "Changes saved successfully!"
      : "Performance added successfully!"}
  </div>
)}


{showBulkSuccess && (
  <div style={styles.toast}>
   CSV uploaded successfully!
  </div>
)}

{confirmDeleteId && (
  <div style={styles.modalOverlay}>
    <div style={styles.modal}>
      <p>Are you sure you want to delete this performance?</p>
      <div style={styles.modalButtons}>
        <button
           onClick={() => {
            confirmDelete(confirmDeleteId); // Perform delete action
            setConfirmDeleteId(null); // Close the confirmation box
            setDeleteMessage(" Performance deleted."); // Optional success message
            setTimeout(() => setDeleteMessage(null), 2000); // Clear message after 2 seconds
          }}
          
          style={{ ...styles.confirmBtn, backgroundColor: "#28a745" }}
        >
          Yes
        </button>
        <button
          onClick={() => {
            setConfirmDeleteId(null);
            setDeleteMessage("❌ Delete cancelled.");
            setTimeout(() => setDeleteMessage(null), 2000);
          }}
          style={{ ...styles.confirmBtn, backgroundColor: "#dc3545" }}
        >
          No
        </button>
      </div>
    </div>
  </div>
)}
{deleteMessage && (
  <div style={styles.toast}>{deleteMessage}</div>
)}



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
            <div>
              <div style={styles.inputLabelContainer}>
                <label style={styles.inputLabel}>Artist/Band</label>
                <input
                  type="text"
                  name="artist"
                  value={newPerformance.artist}
                  onChange={handleInputChange}
                  placeholder="Enter artist/band name"
                  style={styles.inputField}
                />
              </div>

              <div style={styles.inputLabelContainer}>
                <label style={styles.inputLabel}>Description</label>
                <textarea
                  name="description"
                  value={newPerformance.description}
                  onChange={handleInputChange}
                  placeholder="Enter description"
                  style={styles.textareaField}
                  maxLength={15} // <-- set your desired limit here
                />
              </div>

              <div style={styles.inputLabelContainer}>
                <label style={styles.inputLabel}>Date & Time</label>
                <div style={styles.dateTimeContainer}>
                  <input
                    type="date"
                    name="date"
                    value={newPerformance.date}
                    onChange={handleInputChange}
                    style={styles.inputFieldSmall}
                  />
                  <input
                    type="time"
                    name="startTime"
                    value={newPerformance.startTime}
                    onChange={handleInputChange}
                    style={styles.inputFieldSmall}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    name="endTime"
                    value={newPerformance.endTime}
                    onChange={handleInputChange}
                    style={styles.inputFieldSmall}
                  />

                <button
          type="button"
          onClick={handleAddDateTime}
          style={styles.addButton}
        >
          +
        </button>
        </div>
              </div>

              <div style={styles.row}>
  <div style={styles.halfField}>
    <label style={styles.inputLabel}>Venue</label>
    <select
    name="venue"
    value={newPerformance.venue}
    onChange={handleInputChange}
    style={styles.inputField}
  >
    <option value="">-- Select a venue --</option>
    {venues.map((venue) => (
      <option key={venue.venue_id} value={venue.venue_id}>
        {venue.name}
      </option>
    ))}
  </select>

  </div>

  <div style={styles.halfField}>
  <label style={styles.inputLabel}>Photo</label>
  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
    <input
      type="file"
      name="photo"
      accept="image/*"
      onChange={handlePhotoUpload}
      style={styles.inputField}
    />

    {newPerformance.photo && (
      <img
        src={
          newPerformance.photo instanceof File
            ? URL.createObjectURL(newPerformance.photo)
            : newPerformance.photo.startsWith("http")
            ? newPerformance.photo
            : `https://gallisalli.com/app/${newPerformance.photo}`
        }
        alt="Preview"
        style={{ maxWidth: "200px", marginTop: "10px" }}
      />
    )}
  </div>
</div>

</div>


<button
  onClick={editingId ? handleUpdatePerformance : addPerformance}
  style={styles.submitButton}
>
  {editingId ? "Save Changes" : "Add Performance"}
</button>

{editingId && (
  <button
    onClick={() => {
      setEditingId(null);
      setNewPerformance({
        artist: "",
        description: "",
        date: "",
        startTime: "",
        endTime: "",
        venue: "",
        photo: "",
      });
    }}
    style={{ ...styles.submitButton, backgroundColor: "red", marginLeft: "10px" }}
  >
    Cancel
  </button>
)}


            </div>
          ) : (
            <div>
              <h4>Upload CSV file with Artist, Description, Date, Start Time, End Time, Venue</h4>
              <input type="file" accept=".csv" onChange={handleFileChange} style={styles.csvInput} />
              <button style={styles.submitButton} onClick={handleBulkUpload}>
                Upload CSV
              </button>
            </div>
          )}
        </div>

        <div style={styles.tableContainer}>
        <h3>Performances ({performances.length})</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Artist</th>
                <th>Date</th>
                <th>Time</th>
                <th>Venue</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {performances.map((performance, index) => (
                <tr key={index}>
                  <td>{performance.artist}</td>
                  <td>{formatDateWithSuffix(performance.date)}</td>
                  <td>{formatTime(performance.start_time)} - {formatTime(performance.end_time)}</td>
                  <td>{getVenueName(performance.venue)}</td>
                  <td>
  <div style={{ display: "flex", alignItems: "center" }}>
    <button
      onClick={() => handleEdit(performance)}
      style={{
        marginRight: "10px",
        backgroundColor: "#ffc107",
        border: "none",
        padding: "5px 10px",
        borderRadius: "5px",
        cursor: "pointer",
        color: "white",
        display: "flex",
        alignItems: "center"
      }}
      title="Edit"
    >
      <i className="bi bi-pencil-square"></i>
    </button>

    <button
      onClick={() => setConfirmDeleteId(performance.performance_id)}
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
      title="Delete"
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
    // </div>
  );
};

const styles = {
  container: {
    width: "80%",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "20px",
    textAlign: "center",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  },
  heading: {
    fontSize: "2rem",
    marginBottom: "20px",
    color: "#333",
  },
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
  content: {
    display: "flex",
    backgroundColor: "#fff",
    gap: "20px",
    marginTop: "20px",
  },
  formContainer: {
    width: "50%",
    backgroundColor: "#f9f9f9",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    textAlign: "left",
  },
  dateTimeContainer: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  inputFieldSmall: {
    width: "33%",
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "1rem",
  },
  tableContainer: {
    width: "50%",
    backgroundColor: "#f9f9f9",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    textAlign: "left",
    overflowY: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
  },
  tableCell: {
    border: "1px solid #ddd",
    padding: "8px",
    textAlign: "left",
  },
  inputLabelContainer: {
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  inputLabel: {
    marginBottom: "5px",
    fontSize: "1rem",
    fontWeight: "bold",
  },
  inputField: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "1rem",
  },
  textareaField: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "1rem",
    resize: "vertical",
    height: "50px", // <- reduced height
    maxHeight: "120px",
  },

  timeInputs: {
    display: "flex",
    gap: "10px",
  },
  fileInput: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
  },
  submitButton: {
    backgroundColor: "#0789e6",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginTop: "20px",
    fontSize: "1rem",
    transition: "background-color 0.3s",
  },
  toast: {
    position: "fixed",
    top: "20px",
    right: "20px",
    backgroundColor: "#007bff",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    zIndex: 1000,
    fontSize: "1rem",
    transition: "opacity 0.3s ease-in-out",
  },  
  row: {
    display: "flex",
    gap: "10px",
    marginBottom: "15px",
  },
  halfField: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  // modalOverlay: {
  //   position: "fixed",
  //   top: 0,
  //   left: 0,
  //   right: 0,
  //   bottom: 0,
  //   backgroundColor: "rgba(0, 0, 0, 0.5)",
  //   display: "flex",
  //   justifyContent: "center",
  //   alignItems: "center",
  //   zIndex: 1000,
  // },
  modal: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    textAlign: "center",
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
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
    borderRadius: "5px",
    cursor: "pointer",
  },
  toast: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    backgroundColor: "#28a745",
    color: "white",
    padding: "10px 20px",
    borderRadius: "5px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
    zIndex: 1001,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    position: "relative",
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    maxWidth: "90%",
    maxHeight: "90%",
  },
  modalImage: {
    width: "100%",
    maxHeight: "500px",
    objectFit: "contain",
  },
  closeButton: {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "#ff0000",
    color: "#fff",
    border: "none",
    padding: "5px 10px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  csvInput: {
    padding: "5px",
    width: "800px", // Adjust the width to your preference
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  

};

export default AddPerformance;
