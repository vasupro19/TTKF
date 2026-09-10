import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useLocalStorage, LOCAL_STORAGE_KEYS } from '@/hooks/useLocalStorage'

function GuestGuard({ children }) {
    const navigate = useNavigate()
    const { isLoggedIn } = useSelector(state => state.auth)
    const [currentToken] = useLocalStorage(LOCAL_STORAGE_KEYS.token, null)

    useEffect(() => {
        if (isLoggedIn || currentToken) {
            // A hardcoded literal on purpose. Passing a user-controlled value
            // to navigate() is what makes react-router's open-redirect advisory
            // (CVE-2025-68470 bypass) exploitable; there is no such call site in
            // this app, which is why that advisory is not reachable here.
            navigate('/dashboard', { replace: true })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn, navigate, currentToken])

    return children
}

export default GuestGuard
