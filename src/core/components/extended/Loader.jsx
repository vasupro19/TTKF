/* eslint-disable react/self-closing-comp */
import { Box, Typography, CircularProgress, Avatar } from '@mui/material'
import { useSelector } from 'react-redux'
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff'

import '@assets/styles/loader.css'

function Loader() {
    const { user } = useSelector(state => state.auth)
    const agencyName = user?.clientName || 'Travel Workspace'
    const initial = (agencyName || 'T').trim().charAt(0).toUpperCase()

    return (
        <Box className='splash-screen' role='status' aria-label='Loading workspace'>
            <Box className='loader-card'>
                <Box className='loader-brand-wrapper'>
                    <Box className='loader-pulse-ring' />
                    <Avatar
                        variant='rounded'
                        className='loader-avatar'
                        sx={{
                            width: 64,
                            height: 64,
                            bgcolor: 'primary.main',
                            fontSize: '28px',
                            fontWeight: 700,
                            boxShadow: '0 8px 24px rgba(49, 101, 35, 0.25)'
                        }}
                    >
                        {initial}
                    </Avatar>
                    <Box className='loader-orbit-icon'>
                        <FlightTakeoffIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                    </Box>
                </Box>

                <Box className='title-container'>
                    <Typography component='h1' className='main-title'>
                        {agencyName}
                    </Typography>
                    <Typography component='p' className='sub-title'>
                        Loading your workspace…
                    </Typography>
                </Box>

                <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={24} thickness={4} sx={{ color: 'primary.main' }} />
                </Box>
            </Box>
        </Box>
    )
}

export default Loader
