import { Outlet } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import Box from '@mui/material/Box'
import NavBar from './header/NavBar'

function SuperAdminLayout() {
    return (
        <Box sx={{ position: 'relative', height: '100vh' }}>
            <NavBar />
            <ErrorBoundary fallback={<>An Error Ocurred!</>}>
                <Outlet />
            </ErrorBoundary>
        </Box>
    )
}

export default SuperAdminLayout
