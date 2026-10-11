import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
// eslint-disable-next-line import/no-cycle
import NavBar from './header/NavBar'
import Sidebar from './sidebar/Sidebar'
import { SIDEBAR_RAIL_WIDTH, SIDEBAR_WIDTH, readCollapsed, writeCollapsed } from './sidebar/navModel'

function AppLayout() {
    // Hook automatically handles route-based titles
    useDocumentTitle()

    const isDesktop = useMediaQuery(theme => theme.breakpoints.up('md'), { noSsr: true })
    const [collapsed, setCollapsed] = useState(readCollapsed)
    const [mobileOpen, setMobileOpen] = useState(false)

    // ? called by the toggle (an event: flip) or with true/false (the rail expands to show Campaigns)
    const handleToggleCollapsed = useCallback(value => {
        setCollapsed(prev => {
            const next = typeof value === 'boolean' ? value : !prev
            writeCollapsed(next)
            return next
        })
    }, [])
    const openMobile = useCallback(() => setMobileOpen(true), [])
    const closeMobile = useCallback(() => setMobileOpen(false), [])

    // ? Alt+M: collapse / expand the menu (opens it on a phone)
    useKeyboardShortcut(
        'Alt+M',
        useCallback(() => {
            if (isDesktop) handleToggleCollapsed()
            else setMobileOpen(prev => !prev)
        }, [isDesktop, handleToggleCollapsed])
    )

    const desktopWidth = collapsed ? SIDEBAR_RAIL_WIDTH : SIDEBAR_WIDTH
    const offset = isDesktop ? desktopWidth : 0

    return (
        <Box sx={{ position: 'relative', minHeight: '100vh' }}>
            <Sidebar
                collapsed={collapsed}
                onToggleCollapsed={handleToggleCollapsed}
                mobileOpen={mobileOpen}
                onMobileClose={closeMobile}
            />
            <NavBar sidebarOffset={offset} onOpenSidebar={openMobile} />
            <ErrorBoundary fallback={<>An Error Occurred!</>}>
                <Box
                    component='main'
                    sx={{
                        ml: `${offset}px`,
                        transition: theme =>
                            theme.transitions.create('margin-left', { duration: theme.transitions.duration.shorter }),
                        padding: {
                            xs: '60px 8px 0px 8px',
                            sm: '64px 16px 0px 16px'
                        }
                    }}
                >
                    <Outlet />
                </Box>
            </ErrorBoundary>
        </Box>
    )
}

export default AppLayout
