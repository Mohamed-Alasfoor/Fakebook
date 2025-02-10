// components/Sidebar.tsx

"use client"; 

import React from "react";
import { Box, Typography } from "@mui/material";

const Sidebar: React.FC = () => {
  return (
    <Box
      sx={{
        width: 250,
        height: "100vh",
        background: "linear-gradient(135deg, #FF0080, #FF8C00)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        p: 3,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
        ⚡ Crazy Side
      </Typography>

      <Typography variant="body2" sx={{ mb: 1 }}>
        This is a wild sidebar
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Add your own items/links
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Let’s get creative!
      </Typography>
    </Box>
  );
};

export default Sidebar;
