/* eslint-disable */
import React from 'react'
import { Box, Typography, Grid, Paper, Divider } from '@mui/material'

const InfoBar = ({ items }) => {
    return (
        <Paper
            elevation={1} // Adds a subtle shadow similar to the image
            sx={{
                padding: 2, // Add some padding inside the box
                borderRadius: 2, // Rounded corners
                // Optional: Add a border if desired, though Paper's shadow often suffices
                border: '1px solid',
                backgroundColor: 'grey.bgLight',
                borderColor: 'grey.borderLight'
            }}
        >
            <Grid container spacing={2} alignItems='center'>
                {items.map((item, index) => (
                    <>
                    <Grid item xs={12} sm={4} md={4} key={index}>
                        <Box display='flex' alignItems='center' justifyContent='center' flexDirection='row'>
                            {/* Icon */}
                            <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                {/* Adjust icon size if needed */}
                                {/* We need to ensure item.icon is a valid React element to clone it */}
                                {item.icon ? React.cloneElement(item.icon, { sx: { fontSize: 24 } }) : null}
                            </Box>
                            {/* Label and Value */}
                            <Box sx={{
                                display:'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <Typography variant='body2' color='textSecondary' sx={{ lineHeight: 1.2 }}>
                                    {item.label}:
                                </Typography>
                                <Typography variant='body1' sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                                    {item.value}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    </>
                ))}
            </Grid>
        </Paper>
    )
}

export default InfoBar
