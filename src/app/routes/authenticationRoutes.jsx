/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import GuestGuard from '@app/guards/GuestGuard'
import GuestLayout from '@app/layouts/GuestLayout'

const Login = lazy(() => import('@views/pages/auth/Login'))
const Register = lazy(() => import('@views/pages/auth/Register'))
const SessionView = lazy(() => import('@views/pages/SessionView'))

const protectedRoutes = {
    path: '/',
    element: (
        <GuestGuard>
            <GuestLayout />
        </GuestGuard>
    ),
    children: [
        {
            path: '/login',
            element: <Login />
        },
        {
            path: '/register',
            element: <Register />
        },
        {
            path: '/session-limit',
            element: <SessionView />
        }
    ]
}

export default protectedRoutes
