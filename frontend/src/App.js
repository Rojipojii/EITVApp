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
import Logout from "./pages/logout";
import PrivateRoute from "./pages/PrivateRoute";
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
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/Performances" element={<PrivateRoute><AddPerformance /> </PrivateRoute>} />
        <Route path="/Experiences" element={<PrivateRoute><AddExperience /></PrivateRoute>} />
        <Route path="/toilets" element={<PrivateRoute><AddToilet /></PrivateRoute>} />
        <Route path="/food" element={<PrivateRoute><AddFood /></PrivateRoute>} />
        <Route path="/parking" element={<PrivateRoute><AddParking /></PrivateRoute>} />
        <Route path="/venue" element={<PrivateRoute><VenueManagement /></PrivateRoute>} />
        <Route path="/menu-arrangement" element={<PrivateRoute><MenuArrangement /></PrivateRoute>} />
        <Route path="/about" element={<PrivateRoute><About /></PrivateRoute>} />
        <Route path="/partners" element={<PrivateRoute><Partners /></PrivateRoute>} />
        <Route path="/logout" element={<Logout />} />
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
