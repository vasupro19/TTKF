import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

import { AppBar, Toolbar, Box, Avatar, IconButton } from '@mui/material'
import { AnimatePresence } from 'framer-motion'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import MenuIcon from '@mui/icons-material/Menu'

import { useLogoutMutation } from '@app/store/slices/api/authApiSlice'
import { signOut } from '@app/store/session'

import NotificationMenu from '@/core/components/notificationComponent'
import GeneralNotification from '@/core/components/generalNotification'
import UserProfilePopper from '@/core/components/UserProfilePopper'
import FloatingTab from '@/core/components/navbar/FloatingTab'
import NavigateBreadcrumbs from '@/core/components/NavigationBreadcrumbs'
import { flattenRoutes, generateBreadcrumbs } from '@/utilities'
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs'

// eslint-disable-next-line import/no-cycle
import protectedRoutes from '@/app/routes/protectedRoutes'

/**
 * @description the top bar: breadcrumbs, notifications and the account menu; on a phone, the button that opens the
 * menu. The menu itself is the sidebar (layouts/sidebar).
 */
function NavBar({ sidebarOffset = 0, onOpenSidebar }) {
    const [logout] = useLogoutMutation()
    const loc = useLocation()
    // custom hook to get breadcrumbs custom data
    const { customBreadcrumbs } = useBreadcrumbs()
    const profileButtonRef = useRef(null)

    // Get active tab data from Redux (same as in CustomTabsView)
    const currentTabKey = useSelector(state => state.inventoryStorageWise.currentSWITab)
    const tabsData = useSelector(state => state.inventoryFilterTabs)
    const activeTab = tabsData?.find(tab => tab.acc === currentTabKey) || tabsData[0]

    const { user } = useSelector(state => state.auth)

    const [showFloatingTab, setShowFloatingTab] = useState(false)
    const [openMenu, setOpenMenu] = useState(null)

    // ::Note notification related sate and functions starts here
    const [notifications, setNotifications] = useState([])
    const [generalNotifications, setGeneralNotifications] = useState([])

    const handleMenuOpen = useCallback((menuName, anchorRef) => {
        setOpenMenu({ name: menuName, anchor: anchorRef.current })
    }, [])

    const handleMenuClose = useCallback(() => {
        setOpenMenu(null)
    }, [])

    // ? clears everything this session loaded and reloads, even when the server's logout call fails
    const handleLogout = () => signOut(() => logout().unwrap())

    const handleDeleteNotification = id => {
        setNotifications(prev => prev.filter(notification => notification.id !== id))
    }

    const handleMarkAsRead = id => {
        setGeneralNotifications(prev =>
            prev.map(notification => (notification.id === id ? { ...notification, isRead: true } : notification))
        )
    }

    const markAllAsRead = () => {
        setGeneralNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })))
    }

    // Generate default breadcrumbs from routes
    const defaultBreadcrumbs = useMemo(() => {
        const flatRoutesMap = flattenRoutes(protectedRoutes?.children)
        return generateBreadcrumbs(loc?.pathname, flatRoutesMap)
    }, [loc?.pathname])

    // Use custom breadcrumbs if available, otherwise use default
    const breadcrumbData = customBreadcrumbs || defaultBreadcrumbs

    // for showing FloatingTab
    // eslint-disable-next-line consistent-return
    useEffect(() => {
        const tabsElement = document.querySelector('#custom-tabs-container')
        if (tabsElement) {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    setShowFloatingTab(!entry.isIntersecting && loc?.pathname === '/inventory/storageWiseInventory')
                },
                { threshold: 0.5, rootMargin: '-50px 0px 0px 0px' }
            )

            observer.observe(tabsElement)

            return () => observer.disconnect()
        }
        setShowFloatingTab(false)
    }, [loc?.pathname, activeTab]) // ! activeTab temp fix

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                right: 0,
                left: `${sidebarOffset}px`,
                zIndex: 99,
                transition: theme => theme.transitions.create('left', { duration: theme.transitions.duration.shorter })
            }}
        >
            <AppBar
                position='static'
                elevation={0}
                sx={{
                    height: 'max-content',
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderBottom: theme => `1px solid ${theme.palette.divider}`
                }}
            >
                <Toolbar
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 1,
                        minHeight: '64px',
                        '&.MuiToolbar-root': { paddingLeft: { xs: '8px', sm: '16px' }, paddingY: '2px' }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        {onOpenSidebar && (
                            <IconButton
                                edge='start'
                                color='inherit'
                                aria-label='Open menu'
                                onClick={onOpenSidebar}
                                sx={{ display: { xs: 'inline-flex', md: 'none' }, color: 'text.primary' }}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}
                        <NavigateBreadcrumbs breadcrumbData={breadcrumbData} />
                        <AnimatePresence>{showFloatingTab && <FloatingTab activeTab={activeTab} />}</AnimatePresence>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexShrink: 0, alignItems: 'center' }}>
                        <NotificationMenu notifications={notifications} onDelete={handleDeleteNotification} />

                        <GeneralNotification
                            notifications={generalNotifications}
                            handleMarkAsRead={handleMarkAsRead}
                            markAllAsRead={markAllAsRead}
                        />

                        <IconButton
                            sx={{
                                padding: 0.5,
                                border: theme => `1px solid ${theme.palette.divider}`,
                                '&:hover': { bgcolor: 'grey.100' }
                            }}
                            ref={profileButtonRef}
                            aria-label='Account'
                            onClick={() => handleMenuOpen('profile', profileButtonRef)}
                        >
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                                {user?.name ? user.name.charAt(0).toUpperCase() : <AccountCircleIcon fontSize='small' />}
                            </Avatar>
                        </IconButton>
                    </Box>
                    <UserProfilePopper
                        openMenu={openMenu}
                        handleMenuClose={handleMenuClose}
                        user={user}
                        handleLogout={handleLogout}
                    />
                </Toolbar>
            </AppBar>
        </Box>
    )
}

NavBar.propTypes = {
    sidebarOffset: PropTypes.number,
    onOpenSidebar: PropTypes.func
}

export default NavBar
