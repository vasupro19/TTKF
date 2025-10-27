/* eslint-disable */
import React from 'react'
import {
    Popper,
    Grow,
    Paper,
    ClickAwayListener,
    MenuList,
    MenuItem,
    Typography,
    Box,
    Divider,
    Tooltip,
    ListItemText,
    ListItemIcon,
    Collapse
} from '@mui/material'
import {
    AccountCircle as AccountCircleIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    PersonPinCircleOutlined,
    PowerSettingsNew,
    SyncAlt,
    Keyboard,
    ExpandMore,
    ExpandLess
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'

function UserProfilePopper({ openMenu, handleMenuClose, user, clientLocation, handleLogout, handleSelectLocationFunc }) {
    const navigate = useNavigate()
    const theme = useTheme()

    const [openSwitchAccount, setOpenSwitchAccount] = React.useState(false)

    React.useEffect(() => {
        if (openMenu?.name !== 'profile') {
            setOpenSwitchAccount(false)
        }
    }, [openMenu])

    const handleSelectLocation = (location, currentUser) => {
        console.log('Switching to location:', location, 'for user:', currentUser)
        handleMenuClose()
        handleSelectLocationFunc?.(location, currentUser )
    }

    const handleOpenShortcuts = () => {
        handleMenuClose()
        console.log('Opening keyboard shortcuts menu')
    }

    const toggleSwitchAccount = event => {
        event.stopPropagation()
        setOpenSwitchAccount(prev => !prev)
    }

    return (
        <Popper
            open={openMenu?.name === 'profile'}
            anchorEl={openMenu?.name === 'profile' ? openMenu.anchor : null}
            placement='bottom-end'
            transition
            sx={{ zIndex: theme.zIndex.tooltip + 100 }}
        >
            {({ TransitionProps }) => (
                <Grow {...TransitionProps}>
                    <Paper elevation={3} sx={{ marginTop: theme.spacing(1) }}>
                        <ClickAwayListener onClickAway={handleMenuClose}>
                            <MenuList autoFocusItem={openMenu?.name === 'profile'} id='profile-menu-list'>
                                {/* User Email and Current Location - Compact Header */}
                                {user?.email && (
                                    <Box>
                                        {' '}
                                        {/* This Box is the direct child of MenuList now */}
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                px: theme.spacing(2),
                                                py: theme.spacing(1)
                                            }}
                                        >
                                            <Typography
                                                variant='body2'
                                                fontWeight='bold'
                                                noWrap
                                                sx={{
                                                    maxWidth: '13rem', // Set a maxWidth for truncation
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    display: 'block'
                                                }}
                                            >
                                                <Tooltip
                                                    title={user?.email}
                                                    PopperProps={{ style: { zIndex: theme.zIndex.tooltip + 200 } }}
                                                >
                                                    <span>{user?.email}</span>
                                                </Tooltip>
                                            </Typography>

                                            <Typography
                                                variant='caption'
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: theme.spacing(0.5),
                                                    maxWidth: '10rem', // Set a maxWidth for truncation
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    flex: 1
                                                }}
                                            >
                                                {clientLocation?.[user?.id]?.current?.master_client_name || 'No Client'}{' '}
                                                <PersonPinCircleOutlined fontSize='small' />
                                            </Typography>
                                        </Box>
                                        <Divider
                                            sx={{ my: theme.spacing(0.5), borderColor: theme.palette.grey[300] }}
                                        />
                                    </Box>
                                )}

                                {/* Profile Link with Shortcut */}
                                <MenuItem
                                    onClick={() => {
                                        handleMenuClose()
                                        navigate('/userManagement/userProfile')
                                    }}
                                >
                                    <ListItemIcon>
                                        <AccountCircleIcon fontSize='small' />
                                    </ListItemIcon>
                                    <ListItemText primary='Profile' />
                                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                                        <Typography variant='caption' color='text.secondary'>
                                            Alt+V+P
                                        </Typography>
                                    </Box>
                                </MenuItem>

                                {/* Settings Link with Shortcut */}
                                <MenuItem onClick={handleMenuClose}>
                                    <ListItemIcon>
                                        <SettingsIcon fontSize='small' />
                                    </ListItemIcon>
                                    <ListItemText primary='Settings' />
                                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                                        <Typography variant='caption' color='text.secondary'>
                                            Alt+S
                                        </Typography>
                                    </Box>
                                </MenuItem>

                                {/* Keyboard Shortcuts with Shortcut */}
                                <MenuItem onClick={handleOpenShortcuts}>
                                    <ListItemIcon>
                                        <Keyboard fontSize='small' />
                                    </ListItemIcon>
                                    <ListItemText primary='Keyboard Shortcuts' />
                                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                                        <Typography variant='caption' color='text.secondary'>
                                            Alt+K
                                        </Typography>
                                    </Box>
                                </MenuItem>

                                {/* Switch Account Parent MenuItem */}
                                <MenuItem
                                    onClick={toggleSwitchAccount}
                                    sx={{
                                        borderTop: `1px solid ${theme.palette.grey[300]}`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        pr: theme.spacing(1)
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <ListItemIcon>
                                            <PowerSettingsNew fontSize='small' />
                                        </ListItemIcon>
                                        <ListItemText primary='Switch Account' />
                                    </Box>
                                    {openSwitchAccount ? (
                                        <ExpandLess fontSize='small' />
                                    ) : (
                                        <ExpandMore fontSize='small' />
                                    )}
                                </MenuItem>

                                {/* Nested Options for Switch Account */}
                                <Collapse in={openSwitchAccount} timeout='auto' unmountOnExit>
                                    <MenuList disablePadding>
                                        {' '}
                                        {/* Use a nested MenuList for proper list semantics */}
                                        {user?.id && clientLocation && clientLocation[user.id]?.previous && (
                                            <MenuItem
                                                sx={{
                                                    pl: theme.spacing(5),
                                                    '&:hover': {
                                                        backgroundColor: theme.palette.action.hover
                                                    }
                                                }}
                                                onClick={() =>
                                                    handleSelectLocation(clientLocation[user.id]?.previous, user)
                                                }
                                            >
                                                <ListItemIcon>
                                                    <AccountCircleIcon fontSize='small' />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography
                                                            variant='caption'
                                                            sx={{
                                                                overflow: 'hidden',
                                                                whiteSpace: 'nowrap',
                                                                textOverflow: 'ellipsis',
                                                                maxWidth: '160px'
                                                            }}
                                                        >
                                                            <Tooltip
                                                                title={`${clientLocation[user.id]?.previous?.name} (${clientLocation[user.id]?.previous?.code} - ${clientLocation[user.id]?.previous?.master_client_name})`}
                                                                PopperProps={{
                                                                    style: { zIndex: theme.zIndex.tooltip + 200 }
                                                                }}
                                                            >
                                                                <span>{`${clientLocation[user.id]?.previous?.name} (${clientLocation[user.id]?.previous?.code})`}</span>
                                                            </Tooltip>
                                                        </Typography>
                                                    }
                                                />
                                            </MenuItem>
                                        )}
                                        <MenuItem
                                            sx={{
                                                pl: theme.spacing(5),
                                                '&:hover': {
                                                    backgroundColor: theme.palette.action.hover
                                                }
                                            }}
                                            onClick={() => {
                                                handleMenuClose()
                                                navigate('/select-client-location')
                                            }}
                                        >
                                            <ListItemIcon>
                                                <SyncAlt fontSize='small' />
                                            </ListItemIcon>
                                            <ListItemText primary='Change Account' />
                                        </MenuItem>
                                    </MenuList>
                                </Collapse>

                                {/* Logout Link - with error.main color using specific class target */}
                                <MenuItem
                                    onClick={handleLogout}
                                    sx={{ borderTop: `1px solid ${theme.palette.grey[300]}` }}
                                >
                                    <ListItemIcon>
                                        <LogoutIcon fontSize='small' sx={{ color: theme.palette.error.main }} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary='Logout'
                                        sx={{
                                            '& .MuiListItemText-primary': {
                                                // Targeting the primary text directly
                                                color: theme.palette.error.main
                                            }
                                        }}
                                    />
                                </MenuItem>
                            </MenuList>
                        </ClickAwayListener>
                    </Paper>
                </Grow>
            )}
        </Popper>
    )
}

export default UserProfilePopper
