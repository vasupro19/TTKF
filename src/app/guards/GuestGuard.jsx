import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useLocalStorage, LOCAL_STORAGE_KEYS } from '@/hooks/useLocalStorage'

function GuestGuard({ children }) {
    const navigate = useNavigate()
    const { isLoggedIn } = useSelector(state => state.auth)
    const [currentToken] = useLocalStorage(LOCAL_STORAGE_KEYS.token, null)
    const [route] = useLocalStorage(LOCAL_STORAGE_KEYS.previousRoute, null)

    useEffect(() => {
        if (isLoggedIn || currentToken) {
            const redirectPath = route !== '/session-limit' ? route || '/dashboard' : '/dashboard'
            navigate(redirectPath, { replace: true })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn, navigate])

    return children
}

export default GuestGuard
