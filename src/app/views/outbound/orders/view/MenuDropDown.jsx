import React, { useState } from 'react'
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import EditIcon from '@mui/icons-material/Edit'
import { Cancel } from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import PropTypes from 'prop-types'

function MenuDropdown({ onCloneClick, onCancelClick }) {
    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)
    const { id: viewId } = useParams()
    const navigate = useNavigate()

    const handleClick = event => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleCloneOrder = () => {
        handleClose()
        if (onCloneClick) {
            onCloneClick()
        }
    }

    const handleEditOrder = () => {
        navigate(`/outbound/order/edit/${viewId}`)
    }

    const handleCancelOrder = () => {
        handleClose()
        if (onCancelClick) {
            onCancelClick()
        }
    }

    return (
        <div>
            <IconButton
                id='menu-button'
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup='true'
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
            >
                <MenuIcon />
            </IconButton>

            <Menu
                id='basic-menu'
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'menu-button'
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                }}
                sx={{
                    '& .MuiButtonBase-root.MuiMenuItem-root': {
                        borderBottom: '1px solid #ddd',
                        '&:last-child': { borderBottom: 'none' }
                    }
                }}
            >
                <MenuItem onClick={handleCloneOrder}>
                    <ListItemIcon>
                        <ContentCopyIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Clone Order</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleEditOrder}>
                    <ListItemIcon>
                        <EditIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Edit Order</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleCancelOrder}>
                    <ListItemIcon>
                        <Cancel fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Cancel Order</ListItemText>
                </MenuItem>
            </Menu>
        </div>
    )
}

export default MenuDropdown

MenuDropdown.propTypes = {
    onCloneClick: PropTypes.func,
    onCancelClick: PropTypes.func
}
