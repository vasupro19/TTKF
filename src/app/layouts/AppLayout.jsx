import React from 'react'
import { Outlet } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import Box from '@mui/material/Box'
import useDocumentTitle from '@/hooks/useDocumentTitle'
// eslint-disable-next-line import/no-cycle
import NavBar from './header/NavBar'

function AppLayout() {
    // Hook automatically handles route-based titles
    useDocumentTitle()

    return (
        <Box sx={{ position: 'relative', height: '100vh' }}>
            <NavBar />
            <ErrorBoundary fallback={<>An Error Occurred!</>}>
                <Box
                    sx={{
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
