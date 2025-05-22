// src/components/PrivateRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const sessionExpiry = localStorage.getItem("sessionExpiry");

  if (!isLoggedIn || !sessionExpiry || Date.now() > parseInt(sessionExpiry)) {
    // Session expired or not logged in
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("sessionExpiry");
    return <Navigate to="/b" />;
  }

  return children;
};

export default PrivateRoute;
