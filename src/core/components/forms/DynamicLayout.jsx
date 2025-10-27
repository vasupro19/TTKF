import React from 'react'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'

function DynamicLayout({ leftSection, rightSection }) {
    return (
        <Box
            sx={{
                display: 'flex',
                width: '100%',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: { xs: 3, md: 2 }
            }}
        >
            {/* Left Section - Basic Information */}
            <Box
                sx={{
                    width: { xs: '100%', md: '25%' },
                    border: '1px solid #ccc',
                    boxShadow: '0 3px 15px rgba(0, 0, 0, 0.2)',
                    backgroundColor: '#f9f9f9',
                    borderRadius: 2,
                    textAlign: 'center',
                    mb: { xs: 2, md: 0 },
                    p: 1
                }}
            >
                {leftSection}
            </Box>

            {/* Right Section - Tabs and Form */}
            <Box
                sx={{
                    width: { xs: '100%', md: '75%' },
                    border: '1px solid #ccc',
                    boxShadow: '0 3px 15px rgba(0, 0, 0, 0.2)',
                    backgroundColor: '#fff',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'row'
                }}
            >
                {rightSection}
            </Box>
        </Box>
    )
}

DynamicLayout.propTypes = {
    leftSection: PropTypes.node,
    rightSection: PropTypes.node
}

export default DynamicLayout
