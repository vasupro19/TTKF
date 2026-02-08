/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// ** import from ui lib
import { AppBar, Toolbar, Button, Grid, Box, Avatar, IconButton, Stack, styled, useMediaQuery } from '@mui/material'
import Backdrop from '@mui/material/Backdrop'
import { AnimatePresence, motion } from 'framer-motion'

import { useLogoutMutation, useChangeClientAccountMutation, useGetMenuQuery } from '@app/store/slices/api/authApiSlice'

// ** import assets & icons
import cerebrumLogo from '@assets/images/auth/Cerebrum_logo_final_white.png'
import GridIcon from '@assets/icons/GridIcon'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { Cancel } from '@mui/icons-material'

// ** import custom component
import CustomImage from '@core/components/CustomImage'
import MenuListView from '@core/components/navbar/MenuListView'
import NotificationMenu from '@/core/components/notificationComponent'
import GeneralNotification from '@/core/components/generalNotification'
import UserProfilePopper from '@/core/components/UserProfilePopper'
import FloatingTab from '@/core/components/navbar/FloatingTab'

import MenuIcon from '@mui/icons-material/Menu'
// ** import from redux
import { logout as logoutAction, setLocation, setMenuItems } from '@app/store/slices/auth'
import { toggleNavBar } from '@app/store/slices/navBarSlice'
import { useSelector, useDispatch } from 'react-redux'
import { useLocalStorage, LOCAL_STORAGE_KEYS } from '@/hooks/useLocalStorage'

// ** import icons
import ExcelIcon from '@/assets/icons/ExcelIcon'
import PdfIcon from '@/assets/icons/PdfIcon'

// ** import sub-components
import { openSnackbar } from '@/app/store/slices/snackbar'
import { getObjectKeys, objectLength, flattenRoutes, generateBreadcrumbs } from '@/utilities'

// eslint-disable-next-line import/no-cycle
import protectedRoutes from '@/app/routes/protectedRoutes'
import NavigateBreadcrumbs from '@/core/components/NavigationBreadcrumbs'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs'
// import { menuItems } from './menuItems'
import NavMotion from '../NavMotion'
import MenuItemCollapse from './MenuItemsCollapse'
// import SidebarMenu from './SidebarMenu'

// animation on back to main menu
const slideInFromLeft = {
    hidden: { x: '-100vw', opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.5 } },
    exit: { x: '-100vw', opacity: 0, transition: { duration: 0.3 } }
}

const RotatingIcon = styled('div')(({ rotate }) => ({
    display: 'inline-block',
    transition: 'transform 0.3s',
    transform: rotate ? 'rotate(180deg)' : 'rotate(0)',
    height: '2.25rem'
}))

function NavBar() {
    const [logout] = useLogoutMutation()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm')) // Mobile check
    const loc = useLocation()
    // custom hook to get breadcrumbs custom data
    const { customBreadcrumbs } = useBreadcrumbs()

    const currentSearchRef = useRef('') // Use ref for searching menus with title
    const searchTimeoutRef = useRef(null)
    const menuRefs = useRef([])
    // profile Icon Dropdown
    const profileButtonRef = useRef(null)
    // for searching menus with title
    const [highlightedIndex, setHighlightedIndex] = useState(-1)

    // Get active tab data from Redux (same as in CustomTabsView)
    const currentTabKey = useSelector(state => state.inventoryStorageWise.currentSWITab)

    const tabsData = useSelector(state => state.inventoryFilterTabs)

    const activeTab = tabsData?.find(tab => tab.acc === currentTabKey) || tabsData[0]

    // eslint-disable-next-line no-unused-vars
    const [_, __, removeToken] = useLocalStorage(LOCAL_STORAGE_KEYS.token, null)
    // eslint-disable-next-line no-unused-vars
    // const [clientLocation, setClientLocation, removeClientLocation] = useLocalStorage(
    //     LOCAL_STORAGE_KEYS.clientLocation,
    //     null,
    //     true
    // )
    const { drawerOpen, navBackDropOpen } = useSelector(state => state.navbar)
    const { user } = useSelector(state => state.auth)
    const { menuItems } = useSelector(state => state.auth)

    const [changeClientAccount] = useChangeClientAccountMutation()

    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [selectedItemId, setSelectedItemId] = useState('') // selected item from main menu
    const [isVisible, setIsVisible] = useState(false) // animate sliding heading
    const [hasAnimated, setHasAnimated] = useState(true) // animate go back menu
    const [isRotated, setIsRotated] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [showFloatingTab, setShowFloatingTab] = useState(false)
    // const [menuItems, setMenuItems] = useState([])
    // const [getMenu] = useGetMenuMutation()
    // const { data: menuData, isLoading } = useGetMenuQuery(user?.id, {
    //     skip: !user?.id, // Logic: Don't run this query if user.id is missing
    //     refetchOnMountOrArgChange: true
    // })

    // dispatch(setMenuItems(menuData?.data))

    // ::Note notification related sate and functions starts here
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: 'upload',
            read: false,
            fileName: 'File Name With Long Name 1',
            progress: 32,
            status: 'uploading',
            SpinnerIcon: ExcelIcon
        },
        // {
        //     id: 2,
        //     type: 'download',
        //     read: false,
        //     fileName: 'File Name 2',
        //     progress: 14,
        //     status: 'downloading',
        //     SpinnerIcon: PdfIcon
        // },
        {
            id: 3,
            type: 'upload',
            read: false,
            fileName: 'File Name 3',
            progress: 53,
            status: 'failed',
            SpinnerIcon: ExcelIcon
        },
        // { id: 4, type: 'general', message: 'New update available', read: true },
        {
            id: 5,
            type: 'upload',
            read: false,
            fileName: 'File Name 4',
            progress: 100,
            status: 'success',
            SpinnerIcon: PdfIcon
        },
        {
            id: 6,
            type: 'download',
            read: false,
            fileName: 'File Name 6',
            progress: 100,
            status: 'success',
            SpinnerIcon: PdfIcon
        }
    ])

    const [generalNotifications, setGeneralNotifications] = useState([
        {
            id: 1,
            title: 'New Job Assigned',
            subtitle: 'Jobs with 8 items has been',
            timestamp: '2 mins ago',
            isRead: true,
            action: 'navigate',
            path: '/inbound/putAway/create'
        },
        {
            id: 2,
            title: 'New Job Assigned',
            subtitle: 'Jobs with 8 items has been',
            timestamp: '10 mins ago',
            isRead: false,
            action: 'navigate',
            path: '/inbound/putAway/create'
        },
        {
            id: 3,
            title: 'Server Maintenance',
            subtitle: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            timestamp: '20 mins ago',
            isRead: false
        },
        {
            id: 4,
            title: 'Payment Successful',
            subtitle: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
            timestamp: '30 mins ago',
            isRead: false
        },
        {
            id: 5,
            title: 'Picklist create with schedule',
            subtitle: 'A picklist with 14 orders generated on schedule.',
            timestamp: '40 mins ago',
            isRead: false
        },
        {
            id: 6,
            title: 'Password Changed',
            subtitle: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa.',
            timestamp: '50 mins ago',
            isRead: false
        },
        {
            id: 7,
            title: 'Password Changed',
            subtitle: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa.',
            timestamp: '50 mins ago',
            isRead: false
        },
        {
            id: 8,
            title: 'New feature available',
            subtitle: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa.',
            timestamp: '1 hr ago',
            isRead: true
        }
    ])

    const handleClick = item => {
        setSelectedItemId(item?.id)
        setHasAnimated(false)
        setIsVisible(!isVisible)
    }

    const handleAnimationComplete = () => {
        setHasAnimated(true)
    }

    const handleMenuToggle = () => {
        dispatch(toggleNavBar())
        setIsRotated(prev => !prev)
        // removed from here // hide scrollbar from the background window when menu is in open state
    }

    const [openMenu, setOpenMenu] = useState(null)

    // Memoize handlers to prevent unnecessary re-renders
    const handleMenuOpen = useCallback((menuName, anchorRef) => {
        setOpenMenu({ name: menuName, anchor: anchorRef.current })
    }, [])

    const handleMenuClose = useCallback(() => {
        setOpenMenu(null)
    }, [])

    const handleLogout = async () => {
        await logout().unwrap()
        dispatch(logoutAction())
        removeToken()
        navigate('/login')

        // removeToken()
    }

    // const handleSelectLocation = useCallback(async (data, userData) => {
    //     let isError = false
    //     let message
    //     if (!data.id) return
    //     try {
    //         let clientObj = {}
    //         const response = await changeClientAccount({ client_id: data.id }).unwrap()
    //         message = response.message
    //         dispatch(setLocation(data.id))
    //         if (clientLocation && typeof clientLocation === 'object') {
    //             if (objectLength(clientObj) >= 2) {
    //                 delete clientObj[getObjectKeys(clientObj)[objectLength(clientObj) - 1]]
    //             } else if (userData.id in clientLocation) {
    //                 clientObj = { [userData.id]: { previous: clientObj[userData.id]?.current || {} } }
    //             }
    //         }
    //         clientObj = {
    //             [userData.id]: {
    //                 current: {
    //                     id: data.id,
    //                     name: data.name,
    //                     master_client_name: data.master_client_name,
    //                     code: data.code
    //                 }
    //             }
    //         }
    //         setClientLocation(clientObj)
    //     } catch (error) {
    //         isError = true
    //         message = error?.data?.message || error?.message || ''
    //     } finally {
    //         dispatch(
    //             openSnackbar({
    //                 open: true,
    //                 message,
    //                 variant: 'alert',
    //                 alert: { color: isError ? 'error' : 'success' },
    //                 anchorOrigin: { vertical: 'top', horizontal: 'center' }
    //             })
    //         )
    //         if (!isError) navigate('/dashboard')
    //     }
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [])

    const handleToggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false)
    }

    const handleDeleteNotification = id => {
        setNotifications(prevNotifications => prevNotifications.filter(notification => notification.id !== id))
    }

    const handleMarkAsRead = id => {
        setGeneralNotifications(prevNotifications =>
            prevNotifications.map(
                notification =>
                    notification.id === id
                        ? { ...notification, isRead: true } // Mark as read if IDs match
                        : notification // Return the original notification otherwise
            )
        )
    }

    const markAllAsRead = () => {
        setGeneralNotifications(prevNotifications =>
            prevNotifications.map(notification => ({
                ...notification,
                isRead: true // Mark all notifications as read
            }))
        )
    }
    // ::Note notification related sate and functions ends here

    // :: Breadcrumbs data and utility function call

    // Generate default breadcrumbs from routes
    const defaultBreadcrumbs = useMemo(() => {
        const flatRoutesMap = flattenRoutes(protectedRoutes?.children)
        return generateBreadcrumbs(loc?.pathname, flatRoutesMap)
    }, [loc?.pathname])

    // Use custom breadcrumbs if available, otherwise use default
    const breadcrumbData = customBreadcrumbs || defaultBreadcrumbs

    // do not remove this useEffect, unless you have a fix
    // this fixes the issue for navbar
    // menu items section does not collapse on global state change
    // navigation could be a cause
    useEffect(() => {
        setIsMenuOpen(drawerOpen)
    }, [drawerOpen])

    useEffect(() => {
        // hide scrollbar from the background window when menu is in open state
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'visible'
        }
    }, [isMenuOpen])

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

    // Initialize refs array
    useEffect(() => {
        menuRefs.current = menuRefs.current.slice(0, menuItems?.length)
    }, [menuItems])

    // Reset search when menu closes or when switching views
    useEffect(() => {
        if (!isMenuOpen || isVisible) {
            currentSearchRef.current = ''
            setHighlightedIndex(-1)
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
                searchTimeoutRef.current = null
            }
        }
    }, [isMenuOpen, isVisible])

    // Key handler effect - ONLY ACTIVE WHEN MENU IS OPEN AND IN GRID VIEW
    useEffect(() => {
        // Only attach events when menu is open AND grid is visible
        if (!isMenuOpen || isVisible) {
            return
        }

        const handleKeyDown = event => {
            // Handle character input
            if (event.key.length === 1 && /[a-zA-Z0-9\s]/.test(event.key)) {
                event.preventDefault()

                // Clear previous timeout
                if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current)
                    searchTimeoutRef.current = null
                }

                // Update search string
                currentSearchRef.current += event.key.toLowerCase()

                // Find matching items
                const matchingItems = menuItems.filter(item =>
                    item.label.toLowerCase().includes(currentSearchRef.current)
                )

                if (matchingItems.length > 0) {
                    const firstMatchIndex = menuItems.findIndex(item => item.id === matchingItems[0].id)
                    setHighlightedIndex(firstMatchIndex)

                    // Focus the highlighted element
                    setTimeout(() => {
                        if (menuRefs.current[firstMatchIndex]) {
                            menuRefs.current[firstMatchIndex].focus()
                        }
                    }, 0)
                } else {
                    setHighlightedIndex(-1)
                }

                // Reset search after delay
                searchTimeoutRef.current = setTimeout(() => {
                    currentSearchRef.current = ''
                    setHighlightedIndex(-1)
                    searchTimeoutRef.current = null
                }, 1000)
            }

            // Handle Escape key
            if (event.key === 'Escape') {
                currentSearchRef.current = ''
                setHighlightedIndex(-1)
                if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current)
                    searchTimeoutRef.current = null
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        // eslint-disable-next-line consistent-return
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
                searchTimeoutRef.current = null
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [menuItems, isMenuOpen, isVisible]) // Dependencies updated

    // use keyboard shortcut
    useKeyboardShortcut('Alt+M', () => {
        handleMenuToggle()
    })

    console.log('NavbarRender')

    return (
        <Box sx={{ position: 'fixed', zIndex: 99, width: 'calc(100%)' }}>
            {!isMobile && <Backdrop sx={{ color: '#fff' }} open={navBackDropOpen} onClick={handleMenuToggle} />}
            <AppBar
                position='static'
                sx={{
                    height: 'max-content',
                    background: 'linear-gradient(135deg,rgb(0, 0, 0) 0%, #45484c 100%)'
                }}
            >
                <Toolbar
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        '&.MuiToolbar-root': { paddingLeft: '0px', paddingY: '2px' }
                    }}
                >
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
                        <Stack
                            direction='row'
                            spacing={2}
                            sx={{
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <Box>
                                <IconButton
                                    onClick={handleMenuToggle}
                                    sx={{
                                        color: '#fff'
                                    }}
                                >
                                    <RotatingIcon rotate={isRotated ? 'true' : ''}>
                                        {isMenuOpen ? <Cancel fontSize='large' /> : <GridIcon />}
                                    </RotatingIcon>
                                </IconButton>
                                <Button
                                    color='inherit'
                                    onClick={() => {
                                        navigate('/dashboard')
                                    }}
                                    sx={{
                                        padding: '0px'
                                    }}
                                >
                                    {/* <CustomImage
                                        src={cerebrumLogo}
                                        alt='Cerebrum Logo'
                                        styles={{
                                            width: '11.5rem'
                                        }}
                                    /> */}
                                    {user?.clientName}
                                </Button>
                            </Box>
                            <NavigateBreadcrumbs breadcrumbData={breadcrumbData} />
                            <AnimatePresence>
                                {showFloatingTab && <FloatingTab activeTab={activeTab} />}
                            </AnimatePresence>
                        </Stack>
                    </Box>
                    <Box sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'center', alignItems: 'center' }}>
                        <IconButton
                            edge='start'
                            color='inherit'
                            aria-label='menu'
                            aria-controls='menu'
                            aria-haspopup='true'
                            sx={{ marginLeft: 2 }}
                            onClick={handleToggleSidebar}
                        >
                            <MenuIcon fontSize='large' />
                        </IconButton>
                        <NavigateBreadcrumbs breadcrumbData={breadcrumbData} />
                    </Box>
                    {/* <SidebarMenu open={isSidebarOpen} onClose={handleCloseSidebar} /> */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                        <NotificationMenu notifications={notifications} onDelete={handleDeleteNotification} />

                        <GeneralNotification
                            notifications={generalNotifications}
                            handleMarkAsRead={handleMarkAsRead}
                            markAllAsRead={markAllAsRead}
                        />

                        <IconButton
                            sx={{ padding: 0 }}
                            ref={profileButtonRef}
                            onClick={() => handleMenuOpen('profile', profileButtonRef)}
                        >
                            <Avatar sx={{ color: 'secondary.light' }}>
                                <AccountCircleIcon fontSize='large' />
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
            <AnimatePresence>
                {isMenuOpen && (
                    <NavMotion
                        sx={{
                            position: 'absolute',
                            top: '3.5rem',
                            left: 0,
                            width: '100vw',
                            maxHeight: '85vh',
                            zIndex: 999,
                            ...(isMobile ? { display: 'none' } : {})
                        }}
                    >
                        <Box
                            sx={{
                                paddingY: 2,
                                paddingX: '4px',
                                backgroundColor: 'background.paper',
                                width: '100vw',
                                maxHeight: '85vh',
                                overflowY: 'scroll',
                                overflowX: 'hidden'
                            }}
                            boxShadow={10}
                        >
                            <Grid container spacing={0.5} sx={{ paddingX: 1 }}>
                                {!isVisible ? (
                                    menuItems?.map((item, index) => (
                                        <Grid key={item.id} item xs={12} sm={6} md={3}>
                                            <motion.div
                                                key={item.id}
                                                initial={hasAnimated ? false : 'hidden'}
                                                animate={hasAnimated ? false : 'visible'}
                                                whileHover={{ scale: 1.05 }} // Scale up slightly on hover
                                                variants={slideInFromLeft}
                                                onAnimationComplete={handleAnimationComplete}
                                            >
                                                <MenuItemCollapse
                                                    key={item.id}
                                                    item={item}
                                                    level={1}
                                                    borderRadius={8}
                                                    handleClick={handleClick}
                                                    isHighlighted={highlightedIndex === index}
                                                    // eslint-disable-next-line no-return-assign
                                                    ref={el => (menuRefs.current[index] = el)}
                                                />
                                            </motion.div>
                                        </Grid>
                                    ))
                                ) : (
                                    <MenuListView
                                        setIsVisible={setIsVisible}
                                        isVisible={isVisible}
                                        title={menuItems.find(item => item.id === selectedItemId)?.label ?? ''}
                                        mainListItems={menuItems.find(item => item.id === selectedItemId)}
                                    />
                                )}
                            </Grid>
                        </Box>
                    </NavMotion>
                )}
            </AnimatePresence>
        </Box>
    )
}

export default NavBar
