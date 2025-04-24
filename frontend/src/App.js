import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import AddPerformance from "./pages/AddPerformance";
import AddExperience from "./pages/AddExperience";
import AddToilet from "./pages/AddToilet";
import AddFood from "./pages/AddFood";
import AddParking from "./pages/AddParking";
import MenuArrangement from "./pages/MenuArrangement";  // Import Performances Page
import VenueManagement from "./pages/VenueManagement";
import 'bootstrap-icons/font/bootstrap-icons.css';

const PlaceholderPage = ({ title }) => (
  <div style={{ padding: "20px" }}>
    <h2>{title}</h2>
    <p>Content for {title} will go here.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/Performances" element={<AddPerformance/>} /> 
        <Route path="/Experiences" element={<AddExperience/>} /> 
        <Route path="/toilets" element={<AddToilet/>} />
        <Route path="/food" element={<AddFood/>} />     
        <Route path="/parking"  element={<AddParking/>} />
        <Route path="/venue" element={<VenueManagement />} /> 
        <Route path="/menu-arrangement" element={<MenuArrangement />} /> 
        <Route path="/about" element={<PlaceholderPage title="About" />} />
        <Route path="/partners" element={<PlaceholderPage title="Partners" />} />
      </Routes>
    </Router>
  );
}

export default App;
