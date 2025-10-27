/* eslint-disable */
import * as React from 'react'
import PropTypes from 'prop-types'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

// Define the theme with standard colors
const theme = {
    success: {
        spinner: '#17A948FF', // Green
        path: '#e8f5e9' // Light green
    },
    failed: {
        spinner: '#DE3B40FF', // Red
        path: '#ffebee' // Light red
    },
    inProgress: {
        spinner: '#2196f3', // Blue
        path: '#e3f2fd' // Light blue
    }
}

export default function CircularProgressWithLabel({ value, status, sx, icon: Icon }) {
    // Get colors from the theme based on the status prop
    const colors = theme[status] || theme.inProgress

    return (
        <Box sx={{ position: 'relative', display: 'inline-flex', ...sx }}>
            {/* Background path */}
            <CircularProgress
                variant='determinate'
                value={100} // Always 100 for the full path
                sx={{
                    color: colors.path,
                    position: 'absolute'
                }}
                thickness={4}
                size={'32px'}
            />
            <CircularProgress
                variant='determinate'
                value={value}
                sx={{
                    color: colors.spinner, // Spinner color
                    [`& .MuiCircularProgress-circle`]: { stroke: colors.spinner }
                }}
                thickness={4}
                size={'32px'}
            />
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    borderRadius: '50%'
                }}
            >
                {Icon && <Icon sx={{ fontSize: 24, marginBottom: 0.5, color: 'inherit' }} />}
                {/* <Typography variant="caption" component="div" sx={{ color: 'text.secondary' }}>
                    {`${Math.round(value)}%`}
                </Typography> */}
            </Box>
        </Box>
    )
}

CircularProgressWithLabel.propTypes = {
    value: PropTypes.number.isRequired, // Value of the progress indicator (0-100)
    status: PropTypes.oneOf(['success', 'failed', 'inProgress']), // Theme status
    sx: PropTypes.object, // Additional styles
    icon: PropTypes.elementType // Icon component to render
}
