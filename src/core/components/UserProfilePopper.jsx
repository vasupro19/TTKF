import PropTypes from 'prop-types'
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
    ListItemIcon
} from '@mui/material'
import { Logout as LogoutIcon } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'

// ? who is signed in and to which agency, then Logout. Profile (a page that didn't exist), Settings (did nothing),
// ? Keyboard Shortcuts and Switch Account (the warehouse software's client locations, always "No Client") are gone.
const workspaceOf = user => {
    if (!user) return ''
    if (!user.clientId) return 'Platform admin'
    return user.clientName || 'Your agency'
}

function UserProfilePopper({ openMenu, handleMenuClose, user, handleLogout }) {
    const theme = useTheme()
    const open = openMenu?.name === 'profile'
    const name = user?.name && user.name !== user.email ? user.name : ''

    return (
        <Popper
            open={open}
            anchorEl={open ? openMenu.anchor : null}
            placement='bottom-end'
            transition
            sx={{ zIndex: theme.zIndex.tooltip + 100 }}
        >
            {({ TransitionProps }) => (
                // eslint-disable-next-line react/jsx-props-no-spreading -- MUI's transition props
                <Grow {...TransitionProps}>
                    <Paper elevation={3} sx={{ marginTop: theme.spacing(1), minWidth: '15rem', maxWidth: '20rem' }}>
                        <ClickAwayListener onClickAway={handleMenuClose}>
                            <MenuList autoFocusItem={open} id='profile-menu-list'>
                                {user?.email ? (
                                    <Box sx={{ px: 2, pt: 1, pb: 1.25 }}>
                                        {name ? (
                                            <Typography variant='body1' fontWeight={700} noWrap>
                                                {name}
                                            </Typography>
                                        ) : null}
                                        <Tooltip
                                            title={user.email}
                                            PopperProps={{ style: { zIndex: theme.zIndex.tooltip + 200 } }}
                                        >
                                            <Typography
                                                variant='body2'
                                                fontWeight={name ? 400 : 700}
                                                color={name ? 'text.secondary' : 'text.primary'}
                                                noWrap
                                            >
                                                {user.email}
                                            </Typography>
                                        </Tooltip>
                                        <Typography variant='caption' color='text.secondary' noWrap component='div'>
                                            {workspaceOf(user)}
                                        </Typography>
                                    </Box>
                                ) : null}
                                {user?.email ? <Divider sx={{ my: 0.5 }} /> : null}
                                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                                    <ListItemIcon>
                                        <LogoutIcon fontSize='small' sx={{ color: 'error.main' }} />
                                    </ListItemIcon>
                                    <ListItemText primary='Logout' />
                                </MenuItem>
                            </MenuList>
                        </ClickAwayListener>
                    </Paper>
                </Grow>
            )}
        </Popper>
    )
}

UserProfilePopper.propTypes = {
    openMenu: PropTypes.shape({
        name: PropTypes.string,
        anchor: PropTypes.instanceOf(typeof Element === 'undefined' ? Object : Element)
    }),
    handleMenuClose: PropTypes.func.isRequired,
    user: PropTypes.shape({
        name: PropTypes.string,
        email: PropTypes.string,
        clientId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        clientName: PropTypes.string
    }),
    handleLogout: PropTypes.func.isRequired
}

UserProfilePopper.defaultProps = { openMenu: null, user: null }

export default UserProfilePopper
