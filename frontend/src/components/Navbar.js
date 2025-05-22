import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Button, Drawer, List, ListItem, ListItemText, IconButton } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";

const Navbar = () => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setOpenDrawer(!openDrawer);
  };

  const menuItems = [
    { title: "Dashboard", link: "/" },
    { title: "Performances", link: "/performances" },
    { title: "Experiences", link: "/experiences" },
    { title: "Food", link: "/food" },
    { title: "Toilets", link: "/toilets" },
    { title: "Parking", link: "/parking" },
    { title: "Venue", link: "/venue" },
    { title: "Menu Arrangement", link: "/menu-arrangement" },
    { title: "About", link: "/about" },
    { title: "Partners", link: "/partners" },
    { title: "Logout", link: "/logout" },
  ];

  return (
    <>
      {/* Top Navigation Bar */}
      <AppBar position="static" sx={{ padding: 1, backgroundColor: "#0789e6" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* Logo or Title */}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Event Managment
          </Typography>

          {/* Mobile Menu Icon */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            sx={{ display: { xs: "block", sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Desktop Menu */}
          <div style={{ display: "flex", gap: "20px" }}>
            {menuItems.map((item) => (
              <Button
                key={item.title}
                component={Link}
                to={item.link}
                sx={{
                  fontSize: "18px",
                  fontWeight: location.pathname === item.link ? "bold" : "normal",
                  color: location.pathname === item.link ? "white" : "#ddd",
                  textTransform: "none",
                  "&:hover": {
                    color: "white",
                  },
                }}
              >
                {item.title}
              </Button>
            ))}
          </div>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer for Mobile */}
      <Drawer anchor="left" open={openDrawer} onClose={handleDrawerToggle}>
        <List sx={{ width: 250 }}>
          {menuItems.map((item) => (
            <ListItem
              button
              component={Link}
              to={item.link}
              key={item.title}
              selected={location.pathname === item.link}
              onClick={handleDrawerToggle} // Close drawer when a link is clicked
              sx={{
                backgroundColor: location.pathname === item.link ? "#444" : "transparent",
                "&:hover": {
                  backgroundColor: "#555",
                },
              }}
            >
              <ListItemText
                primary={item.title}
                sx={{
                  fontSize: "18px",
                  fontWeight: location.pathname === item.link ? "bold" : "normal",
                  color: location.pathname === item.link ? "white" : "#333",
                }}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  );
};

export default Navbar;
