/* eslint-disable */
import React from "react"
import { Typography, Box } from "@mui/material"

const AlignedText = ({ value, alignment = "left" }) => {
  return (
    <Box display="flex" justifyContent={alignment}>
      <Typography>{value || "-"}</Typography>
    </Box>
  )
}

export default AlignedText
