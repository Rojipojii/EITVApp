import React, { useState, useEffect } from "react";
import { Grid, Typography, Container, Box } from "@mui/material";
import { Link } from "react-router-dom";
import StatsCard from "../components/StatsCard";
import axios from "axios";

const API = "https://gallisalli.com/app";

const Dashboard = () => {
  const [stats, setStats] = useState({
    performances: 0,
    experiences: 0,
    food: 0,
    parking: 0,
    toilets: 0,
    events: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log("Fetching stats data...");

        const [
          performancesRes,
          experiencesRes,
          foodRes,
          parkingRes,
          toiletsRes
        ] = await Promise.all([
          axios.get(`${API}/performances`),
          axios.get(`${API}/experiences`),
          axios.get(`${API}/foodplaces`),
          axios.get(`${API}/parking`),
          axios.get(`${API}/toilets`),
        ]);

        const performancesData = performancesRes.data;
        const experiencesData = experiencesRes.data;
        const foodData = foodRes.data;
        const parkingData = parkingRes.data;
        const toiletsData = toiletsRes.data;

        // Filter and format upcoming events
        const upcomingEvents = performancesData
          .filter(p => new Date(p.date) >= new Date())
          .map(p => ({
            date: new Date(p.date).toLocaleDateString("en-GB", {
              year: "numeric",
              month: "long",
              day: "numeric"
            }),
            name: p.artist || "Unknown Artist"
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 5);

        setStats({
          performances: performancesData.length,
          experiences: experiencesData.length,
          food: foodData.length,
          parking: parkingData.length,
          toilets: toiletsData.length,
          events: upcomingEvents,
        });

        console.log("All stats updated successfully!");
      } catch (error) {
        console.error("Error fetching stats data:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <Container sx={{ textAlign: "center", marginTop: 4 }}>
      <Grid container spacing={2} justifyContent="center">
        <Grid item>
          <Link to="/performances" style={{ textDecoration: "none" }}>
            <StatsCard title="Total Performances" value={stats.performances} />
          </Link>
        </Grid>

        <Grid item>
          <Link to="/experiences" style={{ textDecoration: "none" }}>
            <StatsCard title="Total Experiences" value={stats.experiences} />
          </Link>
        </Grid>

        <Grid item>
          <Link to="/food" style={{ textDecoration: "none" }}>
            <StatsCard title="Total Food" value={stats.food} />
          </Link>
        </Grid>

        <Grid item>
          <Link to="/parking" style={{ textDecoration: "none" }}>
            <StatsCard title="Total Parking" value={stats.parking} />
          </Link>
        </Grid>

        <Grid item>
          <Link to="/toilets" style={{ textDecoration: "none" }}>
            <StatsCard title="Total Toilets" value={stats.toilets} />
          </Link>
        </Grid>
      </Grid>

      {/* Upcoming Events */}
      <Box sx={{ marginTop: 4 }}>
        <Typography variant="h6" sx={{ marginBottom: 2 }}>
          Upcoming Events
        </Typography>
        <Box
          component="ul"
          sx={{
            display: "inline-block",
            textAlign: "left",
            padding: 0,
            listStyle: "none",
          }}
        >
          {stats.events.length > 0 ? (
            stats.events.map((event, index) => (
              <li key={index} style={{ marginBottom: "8px" }}>
                {event.date} | <strong>{event.name}</strong>
              </li>
            ))
          ) : (
            <Typography variant="body2">No upcoming events.</Typography>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;
