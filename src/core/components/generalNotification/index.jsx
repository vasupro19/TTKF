import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
    IconButton,
    Badge,
    MenuItem,
    Typography,
    Box,
    Divider,
    Popper,
    Grow,
    Paper,
    ClickAwayListener,
    MenuList
} from '@mui/material'
import { CheckCircle, Notifications, NotificationsOff } from '@mui/icons-material'
import { AnimatePresence } from 'framer-motion'

import GeneralNotificationCard from '../GeneralNotificationCard'

/**
 * GeneralNotification Component
 *
 * A dropdown menu for displaying notifications, categorized into unread and read sections.
 * Notifications can be marked as read, and users are alerted if there are no notifications.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {Array} props.notifications - Array of notification objects.
 * Each object should have:
 * - `id` (string): Unique identifier.
 * - `title` (string): Notification title.
 * - `subtitle` (string): Additional message text.
 * - `timestamp` (string): Date or time of notification.
 * - `isRead` (boolean): Status of whether the notification is read.
 * @param {Function} props.handleMarkAsRead - Callback to mark a notification as read.
 * Accepts a notification ID as an argument.
 * @param {Function} props.markAllAsRead - Callback to mark all notifications as read.
 * @returns {JSX.Element} The GeneralNotification component.
 */

function GeneralNotification({ notifications, handleMarkAsRead, markAllAsRead }) {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const [anchorEl, setAnchorEl] = useState(null)
    const [expandedCard, setExpandedCard] = useState(null)
    const unreadNotifications = notifications?.filter(n => !n.isRead) || []
    const readNotifications = notifications?.filter(n => n.isRead) || []

    /**
     * Opens the notification menu.
     * @param {React.MouseEvent} event - The click event.
     */
    const handleMenuOpen = event => setAnchorEl(event.currentTarget)

    /**
     * Closes the notification menu.
     */
    const handleMenuClose = () => setAnchorEl(null)

    const handleToggleExpand = id => {
        setExpandedCard(prev => (prev === id ? null : id))
    }

    /**
     * Closes the menu and navigates.
     */
    const handleCloseNavigate = path => {
        handleMenuClose() // Close the menu
        if (pathname !== '/inbound/putAway/create') {
            setTimeout(() => navigate(path), 0) // Navigate after the menu is closed
        }
    }

    return (
        <>
            <IconButton
                color='inherit'
                onClick={handleMenuOpen}
                aria-label='show notifications'
                aria-controls='notification-menu'
                aria-haspopup='true'
            >
                <Badge badgeContent={unreadNotifications?.length} color='error'>
                    <Notifications fill='#fff' />
                </Badge>
            </IconButton>

            <Popper
                id='notification-popper-file-transfer'
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                placement='bottom-start'
                transition
                style={{
                    zIndex: 9999
                }}
            >
                {({ TransitionProps }) => (
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    <Grow {...TransitionProps}>
                        <Paper
                            elevation={3}
                            sx={{
                                maxHeight: 380,
                                minHeight: 240,
                                width: notifications?.length === 0 ? 280 : 340,
                                overflowY: 'auto',
                                marginTop: '8px',
                                overflowX: 'hidden'
                            }}
                            className='custom-notification-scroll'
                        >
                            <ClickAwayListener onClickAway={handleMenuClose}>
                                <MenuList
                                    autoFocusItem={Boolean(anchorEl)}
                                    sx={{
                                        minHeight: 240,
                                        position: 'relative',
                                        padding: 0
                                    }}
                                >
                                    {notifications?.length > 0 ? (
                                        <AnimatePresence>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    paddingY: 0.5,
                                                    paddingX: 1,
                                                    position: 'sticky',
                                                    top: 0,
                                                    backgroundColor: '#fff',
                                                    zIndex: 2,
                                                    borderBottom: '2px solid #E0E0E0'
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        paddingBottom: 0.5,
                                                        fontWeight: 'bold'
                                                    }}
                                                    variant='h5'
                                                >
                                                    Notifications
                                                </Typography>
                                                {unreadNotifications?.length > 0 && (
                                                    <Typography
                                                        variant='h6'
                                                        display='flex'
                                                        alignItems='center'
                                                        sx={{ cursor: 'pointer' }}
                                                        onClick={markAllAsRead}
                                                    >
                                                        <CheckCircle sx={{ fontSize: '14px' }} />
                                                        Mark all as read
                                                    </Typography>
                                                )}
                                            </Box>
                                            {/* Unread Notifications Section */}
                                            {unreadNotifications.length > 0 && (
                                                <>
                                                    <Box
                                                        display='flex'
                                                        gap={2}
                                                        style={{ backgroundColor: '#F3F4F6FF', padding: '6px 12px' }}
                                                    >
                                                        <Typography
                                                            variant='h5'
                                                            sx={{
                                                                color: 'grey.500',
                                                                fontWeight: '800'
                                                            }}
                                                        >
                                                            Unread
                                                        </Typography>
                                                    </Box>
                                                    <Divider
                                                        sx={{ margin: '0px 0px !important', borderWidth: '1.2px' }}
                                                    />
                                                    {unreadNotifications.map(notification => (
                                                        <MenuItem
                                                            key={notification.id}
                                                            sx={{
                                                                padding: 1,
                                                                paddingBottom: '3px !important',
                                                                paddingTop: '3px !important',
                                                                '&:hover': {
                                                                    backgroundColor: 'transparent', // No background change
                                                                    boxShadow: 'none', // No shadow
                                                                    transform: 'none', // No scaling
                                                                    cursor: 'default' // No pointer cursor
                                                                }
                                                            }}
                                                            disableRipple
                                                            disableTouchRipple
                                                        >
                                                            <GeneralNotificationCard
                                                                id={notification.id}
                                                                title={notification.title}
                                                                subtitle={notification.subtitle}
                                                                timestamp={notification.timestamp}
                                                                isRead={notification.isRead}
                                                                handleMarkAsRead={handleMarkAsRead}
                                                                action={notification?.action ?? 'expand'}
                                                                path={notification?.path}
                                                                isExpanded={expandedCard === notification.id}
                                                                onToggleExpand={handleToggleExpand}
                                                                handleCloseNavigate={handleCloseNavigate}
                                                            />
                                                        </MenuItem>
                                                    ))}
                                                </>
                                            )}
                                            {/* Read Notifications Section */}
                                            {readNotifications.length > 0 && (
                                                <>
                                                    <Divider
                                                        sx={{ margin: '0px 0px !important', borderWidth: '1.2px' }}
                                                    />

                                                    <Box
                                                        display='flex'
                                                        gap={2}
                                                        style={{ backgroundColor: '#F3F4F6FF', padding: '6px 12px' }}
                                                    >
                                                        <Typography
                                                            variant='h5'
                                                            sx={{
                                                                color: 'grey.500',
                                                                fontWeight: '800'
                                                            }}
                                                        >
                                                            Read
                                                        </Typography>
                                                    </Box>
                                                    <Divider
                                                        sx={{ margin: '0px 0px !important', borderWidth: '1.2px' }}
                                                    />

                                                    {readNotifications.map(notification => (
                                                        <MenuItem
                                                            key={notification.id}
                                                            sx={{
                                                                padding: 1,
                                                                paddingBottom: '3px !important',
                                                                paddingTop: '3px !important',
                                                                '&:hover': {
                                                                    backgroundColor: 'transparent', // No background change
                                                                    boxShadow: 'none', // No shadow
                                                                    transform: 'none', // No scaling
                                                                    cursor: 'default' // No pointer cursor
                                                                }
                                                            }}
                                                            disableRipple
                                                            disableTouchRipple
                                                        >
                                                            <GeneralNotificationCard
                                                                id={notification.id}
                                                                title={notification.title}
                                                                subtitle={notification.subtitle}
                                                                timestamp={notification.timestamp}
                                                                isRead={notification.isRead}
                                                                action={notification?.action ?? 'expand'}
                                                                path={notification?.path}
                                                                isExpanded={expandedCard === notification.id}
                                                                onToggleExpand={handleToggleExpand}
                                                                handleCloseNavigate={handleCloseNavigate}
                                                            />
                                                        </MenuItem>
                                                    ))}
                                                </>
                                            )}
                                        </AnimatePresence>
                                    ) : (
                                        <MenuItem
                                            sx={{
                                                height: '180px',
                                                width: '100%'
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    height: 'max-content',
                                                    width: '100%',
                                                    flexDirection: 'column',
                                                    padding: '2rem'
                                                }}
                                            >
                                                <NotificationsOff sx={{ fontSize: '36px' }} />
                                                <Typography
                                                    variant='h4'
                                                    color='textSecondary'
                                                    sx={{ wordBreak: 'break-word' }}
                                                >
                                                    No Notifications
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    )}
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </>
    )
}

GeneralNotification.propTypes = {
    /**
     * Array of notification objects.
     */
    notifications: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            title: PropTypes.string.isRequired,
            subtitle: PropTypes.string.isRequired,
            timestamp: PropTypes.string.isRequired,
            isRead: PropTypes.bool.isRequired
        })
    ).isRequired,
    /**
     * Callback to mark a notification as read.
     */
    handleMarkAsRead: PropTypes.func.isRequired,
    /**
     * Callback to mark all notifications as read.
     */
    markAllAsRead: PropTypes.func.isRequired
}

export default GeneralNotification
