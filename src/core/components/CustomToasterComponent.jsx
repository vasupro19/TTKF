/* eslint-disable */
import React, { useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Button from "@mui/material/Button";

const ToasterComponent = () => {
  const [open, setOpen] = useState(false);

  // Function to handle opening the toaster
  const handleOpen = () => {
    setOpen(true);
  };

  // Function to handle closing the toaster
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Button to trigger toaster */}
      <Button variant="contained" onClick={handleOpen}>
        Show Toaster
      </Button>

      {/* Snackbar for the toaster message */}
      <Snackbar
        open={open}
        autoHideDuration={5000}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#d4edda",
            border: "1px solid #c3e6cb",
            borderRadius: 1,
            padding: 1.5,
            boxShadow: 1,
            minWidth: 300,
            maxWidth: 350,
          }}
        >
          <CheckCircleIcon
            fontSize="medium"
            sx={{ color: "#155724", marginRight: 1 }}
          />
          <Box>
            {/* Heading with larger font size */}
            <Typography
              component="div"
              sx={{
                fontWeight: "bold",
                fontSize: "0.85rem", // Larger size
                color: "#155724",
                marginBottom: "4px", // Spacing between heading and content
              }}
            >
              Put Away Job assigned.
            </Typography>
            {/* Body content with smaller font size */}
            <Typography
              sx={{
                fontSize: "0.75rem", // Smaller size
                color: "#155724",
              }}
            >
              Please check the Put Away page. Job with 119 items has been assigned.
            </Typography>
          </Box>
        </Box>
      </Snackbar>
    </div>
  );
};

export default ToasterComponent;
