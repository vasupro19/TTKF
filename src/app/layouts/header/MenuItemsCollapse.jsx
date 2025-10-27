import React from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'

import { Typography, Box, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'

import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'

import { toggleNavBar, storeSelectedMenu } from '@app/store/slices/navBarSlice'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useDispatch, useSelector } from 'react-redux'

const MenuItemsCollapse = React.forwardRef(
    ({ item, level = 1, borderRadius, handleClick, isHighlighted = false }, ref) => {
        console.log(item)
        const navigate = useNavigate()
        const dispatch = useDispatch()
        const { selectedMenu } = useSelector(state => state.navbar)

        const iconSx = { ...(item.iconSx || {}) }
        const menuIcon = item.icon ? <item.icon sx={iconSx} width={60} height={60} /> : <FiberManualRecordIcon />

        return (
            <Box>
                <ListItemButton
                    ref={ref}
                    onClick={() => {
                        if (item?.type === 'item') {
                            if (item?.path) {
                                navigate(item.path)
                                dispatch(toggleNavBar())
                            } else {
                                dispatch(
                                    openSnackbar({
                                        open: true,
                                        message: 'We are building this page',
                                        variant: 'alert',
                                        alert: { color: 'info' },
                                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                                    })
                                )
                            }
                            return
                        }

                        if (selectedMenu?.includes(item.id)) {
                            dispatch(storeSelectedMenu([...selectedMenu.slice(0, selectedMenu.indexOf(item.id))]))
                            return
                        }

                        if (item.path) {
                            window.open(item.path, '_blank')
                        }
                        handleClick(item)
                    }}
                    sx={{
                        borderRadius: `${borderRadius}px`,
                        pl: `${level * 24}px`,
                        alignItems: 'flex-start',
                        width: '100%',
                        backgroundColor: isHighlighted ? 'action.selected' : 'transparent',
                        border: isHighlighted ? '2px solid primary.main' : 'none',
                        transition: 'all 0.3s ease',
                        gap: 1
                    }}
                >
                    <ListItemIcon sx={{ flex: 2, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                        {menuIcon}
                    </ListItemIcon>
                    <Box sx={{ flex: 5 }}>
                        <Box sx={{ display: 'flex' }}>
                            <ListItemText
                                primary={
                                    <Typography
                                        sx={{
                                            fontSize: '1.1rem',
                                            fontWeight: 900,
                                            textShadow: '2px 2px 20px rgb(0 0 0 / 10%)',
                                            color: isHighlighted ? 'primary.main' : 'inherit'
                                        }}
                                    >
                                        {item.label}
                                    </Typography>
                                }
                            />
                            {item.type === 'collapse' && <ChevronRightIcon />}
                        </Box>
                        <ListItemText
                            primary={<Typography sx={{ fontSize: '11px' }}>{item?.description}</Typography>}
                        />
                    </Box>
                </ListItemButton>
            </Box>
        )
    }
)

MenuItemsCollapse.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    item: PropTypes.object.isRequired,
    level: PropTypes.number,
    borderRadius: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    handleClick: PropTypes.func,
    isHighlighted: PropTypes.bool
}

export default MenuItemsCollapse
