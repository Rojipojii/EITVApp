import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import AddPerformance from "./pages/AddPerformance";
import AddExperience from "./pages/AddExperience";
import AddToilet from "./pages/AddToilet";
import AddFood from "./pages/AddFood";
import AddParking from "./pages/AddParking";
import MenuArrangement from "./pages/MenuArrangement";
import VenueManagement from "./pages/VenueManagement";
import About from "./pages/About";
import Partners from "./pages/Partners";
import Login from "./pages/Login";
import 'bootstrap-icons/font/bootstrap-icons.css';

const PlaceholderPage = ({ title }) => (
  <div style={{ padding: "20px" }}>
    <h2>{title}</h2>
    <p>Content for {title} will go here.</p>
  </div>
);

// Use a wrapper to access location and conditionally show Navbar
const AppWrapper = () => {
  const location = useLocation();
  const hideNavbarRoutes = ["/b"]; // Add more paths if needed

  return (
    <>
      {!hideNavbarRoutes.includes(location.pathname) && <Navbar />}
      <Routes>
        <Route path="/b" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/Performances" element={<AddPerformance />} />
        <Route path="/Experiences" element={<AddExperience />} />
        <Route path="/toilets" element={<AddToilet />} />
        <Route path="/food" element={<AddFood />} />
        <Route path="/parking" element={<AddParking />} />
        <Route path="/venue" element={<VenueManagement />} />
        <Route path="/menu-arrangement" element={<MenuArrangement />} />
        <Route path="/about" element={<About />} />
        <Route path="/partners" element={<Partners />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
