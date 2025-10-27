import { lazy } from 'react'
import AuthGuard from '@app/guards/AuthGuard'
import SuperAdminLayout from '@app/layouts/SuperAdminLayout'

const MasterUserForm = lazy(() => import('@views/forms/user/MasterUserForm'))

const superAdminRoutes = {
    path: '/',
    element: (
        <AuthGuard>
            <SuperAdminLayout />
        </AuthGuard>
    ),
    children: [
        {
            path: '/super-admin',
            element: <MasterUserForm />
        }
    ]
}

export default superAdminRoutes
