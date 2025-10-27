import React from 'react'
import PropTypes from 'prop-types'
import { SwipeableDrawer, Box, IconButton, Typography } from '@mui/material'
import { ChevronRightAnimIcon } from '@/assets/icons/ChevronAnimIcon'

function DrawerComponent({ isOpen, toggleDrawer, drawerContent }) {
    return (
        <SwipeableDrawer
            anchor='right'
            open={isOpen}
            onClose={toggleDrawer(false)}
            onOpen={toggleDrawer(true)}
            sx={{
                '& .MuiDrawer-paper': {
                    overflow: 'visible'
                }
            }}
        >
            {/* Drawer Content */}
            <Box
                sx={{
                    width: { xs: 340, sm: 450 },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'visible' // Add this line
                }}
            >
                {/* Close Button */}
                <IconButton
                    onClick={toggleDrawer(false)}
                    size='small'
                    sx={{
                        position: 'absolute',
                        width: '2rem',
                        top: '50%',
                        left: '-15px',
                        paddingRight: '2px',
                        transform: 'translateY(-50%)',
                        color: 'white',
                        backgroundColor: 'primary.main',
                        '&:hover': { backgroundColor: 'primary.dark' },
                        zIndex: 1301, // Increase z-index higher than drawer
                        boxShadow: 2 // Add shadow for better visibility
                    }}
                >
                    <ChevronRightAnimIcon shouldAnimate animateOnHover />
                </IconButton>

                {/* Drawer Content */}
                <Box sx={{ paddingRight: 0, overflowX: 'hidden', overflowY: 'hidden' }}>
                    {drawerContent || <Typography>No content provided</Typography>}
                </Box>
            </Box>
        </SwipeableDrawer>
    )
}

DrawerComponent.propTypes = {
    isOpen: PropTypes.bool.isRequired, // Whether the drawer is open or not
    toggleDrawer: PropTypes.func.isRequired, // Function to toggle the drawer open/close
    drawerContent: PropTypes.node // The content to be displayed inside the drawer
}

export default DrawerComponent
