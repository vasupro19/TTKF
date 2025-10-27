import React from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, Button } from '@mui/material'

export default function ErrorComponent({ message, onClick }) {
    return (
        <Box
            sx={{
                backgroundColor: '#f8d7da',
                padding: '1rem',
                borderRadius: '5px',
                width: '100%',
                color: '#721c24',
                marginBottom: '1rem',
                position: 'relative'
            }}
        >
            <Button
                onClick={onClick}
                sx={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    minWidth: 'auto',
                    padding: '0.2rem 0.6rem',
                    fontWeight: 'bold',
                    color: '#721c24',
                    backgroundColor: 'transparent'
                }}
            >
                X
            </Button>
            <Typography variant='body2' sx={{ textAlign: 'left' }}>
                {message}
            </Typography>
        </Box>
    )
}

ErrorComponent.propTypes = {
    message: PropTypes.string,
    onClick: PropTypes.func
}

ErrorComponent.defaultProps = {
    message: 'Error',
    onClick: () => {}
}
