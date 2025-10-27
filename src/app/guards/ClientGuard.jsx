import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useSelector } from 'react-redux'
import { ROLES } from '@/constants'
import { useLocalStorage, LOCAL_STORAGE_KEYS } from '@/hooks/useLocalStorage'

function ClientGuard({ children }) {
    const navigate = useNavigate()

    // ? LocalStorageHook usage
    const [storedClientLocation] = useLocalStorage(LOCAL_STORAGE_KEYS.clientLocation, null, true)

    const { isLoggedIn, selectedLocation, user } = useSelector(state => state.auth)

    useEffect(() => {
        const clientLocation = selectedLocation || storedClientLocation?.[user?.id]?.current.id

        // if (isLoggedIn && !clientLocation && user?.role_id !== ROLES.MASTER_ADMIN) {
        //     navigate('/select-client-location', { replace: true })
        // }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn, selectedLocation, user])

    return children
}

export default ClientGuard
