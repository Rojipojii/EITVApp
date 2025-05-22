// src/pages/Logout.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("sessionExpiry");
    navigate("/b");
  }, [navigate]);

  return null;
};

export default Logout;
