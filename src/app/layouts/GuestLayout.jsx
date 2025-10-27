import useDocumentTitle from '@/hooks/useDocumentTitle'
import { Outlet } from 'react-router-dom'

function GuestLayout() {
    useDocumentTitle()
    return <Outlet />
}

export default GuestLayout
