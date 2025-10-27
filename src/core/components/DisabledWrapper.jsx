import React from 'react'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'

function DisabledWrapper({ isDisabled, children }) {
    return (
        <Box
            sx={{
                position: 'relative',
                ...(isDisabled && {
                    opacity: 0.5, // Make it semi-transparent
                    marginY: '1.5px',
                    '&:after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backdropFilter: 'inherit',
                        borderRadius: '6px', // Match border radius
                        zIndex: 1 // Ensure it covers the content
                    }
                }),
                borderRadius: '6px', // Optional: match border radius of the ListItem if needed
                overflow: 'hidden'
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    zIndex: 0 // Content should be below the lock and overlay
                }}
            >
                {children}
            </Box>
        </Box>
    )
}

export default DisabledWrapper

DisabledWrapper.propTypes = {
    isDisabled: PropTypes.bool,
    children: PropTypes.node
}
