import React from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'

export default function LoadingPermissions() {
    return (
        <Box
            sx={{
                padding: '1rem',
                width: '100%',
                height: '100vh',
                marginBottom: '1rem',
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <Typography variant='body2' sx={{ textAlign: 'left', display: 'flex', gap: 3, alignItems: 'center' }}>
                <CircularProgress /> Please wait fetching permissions...
            </Typography>
        </Box>
    )
}
