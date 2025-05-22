import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://gallisalli.com/app/login"); // Adjust port if needed
      const users = await response.json();

      const matchedUser = users.find(
        (user) => user.username === username && user.password === password
      );

      if (matchedUser) {
        const sessionDuration = 3600000; // 1 hour in milliseconds
  const expiryTime = Date.now() + sessionDuration;

  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("sessionExpiry", expiryTime.toString());
        alert("✅ Login successful!");
        navigate("/dashboard");
      } else {
        alert("❌ Invalid username or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Server error. Please try again later.");
    }
  };

  return (
    <div style={{ maxWidth: "300px", margin: "100px auto", textAlign: "center" }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", margin: "5px 0" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", margin: "5px 0" }}
        />
        <button type="submit" style={{ width: "50%", padding: "10px" }}>
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;
