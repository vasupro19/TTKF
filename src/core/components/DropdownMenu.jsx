/* eslint-disable */
import React, { useState } from 'react'
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import Add from '@mui/icons-material/Add'
import CustomButton from '@core/components/extended/CustomButton'

const DropdownMenu = ({ buttonText, options, onOptionClick, buttonStyles }) => {
    const [anchorEl, setAnchorEl] = useState(null)
    const isOpen = Boolean(anchorEl)

    const handleOpen = event => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleOptionClick = action => {
        if (onOptionClick) onOptionClick(action)
        handleClose()
    }

    return (
        <div>
            <CustomButton
                variant='clickable'
                onClick={handleOpen}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#fff',
                    ...buttonStyles // Allow custom button styling
                }}
            >
                {buttonText}
                <Add sx={{ marginLeft: '0.2rem', fontSize: '18px' }} />
            </CustomButton>

            <Menu
                anchorEl={anchorEl}
                open={isOpen}
                onClose={handleClose}
                PaperProps={{
                    style: {
                        backgroundColor: '#2d2d2d',
                        color: '#fff !important',
                        borderRadius: '12px',
                        minWidth: '150px'
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
            >
                {options.map((option, index, options) => (
                    <MenuItem
                        key={index}
                        onClick={() => handleOptionClick(option.action)}
                        sx={{
                            borderBottom: options?.length - 1 > index ? '0.2px solid #fff' : 'unset',
                            boxShadow: options?.length - 1 > index ? '0px 2px 4px rgba(255, 255, 255, 0.1)' : 'none',
                            transition: 'background-color 0.3s',
                            '&:hover': {
                                backgroundColor: '#3a3a3a',
                                borderBottom: options?.length - 1 > index
                                    ? '1px solid rgba(255, 255, 255, 0.8)'
                                    : 'unset'
                            },
                             '&.Mui-focusVisible': {
                                backgroundColor: '#3a3a3a',
                            }
                        }}
                    >
                        <ListItemIcon>
                            {option.icon && React.cloneElement(option.icon, { sx: { color: '#fff !important' } })}
                        </ListItemIcon>
                        <ListItemText
                            primary={option.label}
                            sx={{
                                color: '#fff !important',
                                '& .MuiListItemText-primary': { color: '#fff !important' },
                                '& .MuiListItemText-root': { color: '#fff !important' }
                            }}
                        />
                    </MenuItem>
                ))}
            </Menu>
        </div>
    )
}

export default DropdownMenu

