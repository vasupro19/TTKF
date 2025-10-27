import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Menu, MenuItem } from '@mui/material'

function CustomDropdownMenu({
    triggerButton, // Custom trigger button
    menuItems, // Custom menu items
    menuStyles = {}, // Optional menu styles
    defaultMenuItemStyles = {}, // Default styles for menu items
    onClose // Optional callback for menu close
}) {
    const [anchorEl, setAnchorEl] = useState(null)
    const isOpen = Boolean(anchorEl)

    const handleOpen = event => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
        if (onClose) onClose()
    }

    return (
        <Box>
            {/* Render the trigger button */}
            <Box onClick={handleOpen}>{triggerButton}</Box>

            <Menu
                anchorEl={anchorEl}
                open={isOpen}
                onClose={handleClose}
                PaperProps={{
                    style: {
                        backgroundColor: '#2d2d2d',
                        color: '#fff',
                        borderRadius: '12px',
                        minWidth: '150px',
                        ...menuStyles // Allow custom menu styling
                    }
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                }}
                sx={{
                    mt: 0.2 // Add margin-top to create a gap (adjust the value as needed)
                }}
            >
                {menuItems?.length > 0
                    ? menuItems.map((item, index) => (
                          <MenuItem
                          /* eslint-disable */
                              key={index}
                              onClick={()=>{
                                if(item.onClick){
                                    item.onClick()
                                    handleClose()
                                }
                            }}
                              sx={{
                                  borderBottom: menuItems.length - 1 > index ? '0.2px solid #fff' : 'unset',
                                  boxShadow:
                                      menuItems.length - 1 > index ? '0px 2px 4px rgba(255, 255, 255, 0.1)' : 'none',
                                  transition: 'background-color 0.3s',
                                  '&:hover': {
                                      backgroundColor: '#3a3a3a',
                                      borderBottom:
                                          menuItems.length - 1 > index ? '1px solid rgba(255, 255, 255, 0.8)' : 'unset'
                                  },
                                  ...defaultMenuItemStyles // Apply default menu item styles
                              }}
                          >
                              {item.content}
                          </MenuItem>
                      ))
                    : null}
            </Menu>
        </Box>
    )
}

CustomDropdownMenu.propTypes = {
    triggerButton: PropTypes.element.isRequired, // Custom trigger button element
    menuItems: PropTypes.arrayOf(
        PropTypes.shape({
            content: PropTypes.node.isRequired, // Content for the menu item
            onClick: PropTypes.func // Click handler for the menu item
        })
    ).isRequired,
    /* eslint-disable */
    menuStyles: PropTypes.object, // Custom styles for the menu
    defaultMenuItemStyles: PropTypes.object, // Default styles for menu items
    /* eslint-enable */
    onClose: PropTypes.func // Callback when the menu is closed
}

export default CustomDropdownMenu
