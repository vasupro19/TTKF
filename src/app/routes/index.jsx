import { lazy } from 'react'
import { useRoutes } from 'react-router-dom'

// routes
import authRoutes from './authenticationRoutes'
import protectedRoutes from './protectedRoutes'
// import superAdminRoutes from './superadminRoutes'

const PageNotFound = lazy(() => import('@views/pages/PageNotFound'))
// ==============================|| ROUTING RENDER ||============================== //

export default function ThemeRoutes() {
    return useRoutes([{ path: '*', element: <PageNotFound /> }, protectedRoutes, authRoutes])
}
