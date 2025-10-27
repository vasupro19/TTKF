import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useSelector, useDispatch } from 'react-redux'
import { getAuthUser } from '@app/store/slices/api/authApiSlice'
import { setError, setUserDetails, setLocation } from '@app/store/slices/auth'
import { useLocalStorage, LOCAL_STORAGE_KEYS } from '@/hooks/useLocalStorage'

// checks if the user is authenticated ( let the user go to the route ) or not ( redirects user to login page )
function AuthGuard({ children }) {
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useDispatch()

    // const [getAuthUser] = useGetAuthUserMutation()

    const { isLoggedIn, permissionExpired } = useSelector(state => state.auth)
    // eslint-disable-next-line no-unused-vars
    const [clientLocation] = useLocalStorage(LOCAL_STORAGE_KEYS.clientLocation, null, true)
    // eslint-disable-next-line no-unused-vars
    const [token, _, removeToken] = useLocalStorage(LOCAL_STORAGE_KEYS.token, null)
    // eslint-disable-next-line no-unused-vars
    const [__, setRoute] = useLocalStorage(LOCAL_STORAGE_KEYS.previousRoute, null)

    useEffect(() => {
        setRoute(location.pathname)
        const fetchUser = async () => {
            try {
                const { data: response } = await dispatch(
                    getAuthUser.initiate('', {
                        forceRefetch: true // force rtk to request data again
                    })
                )
                console.log(response?.data)
                if (!response?.data?.user) throw Error('unable to login')
                // dispatch(setUserDetails({ user: response?.data.user, permission: response?.menuAccess || {} }))

                dispatch(setUserDetails({ user: response?.data.user }))
                // ? ensures that local storage saved clientLocation is saved in state before client guard check
                // if (clientLocation && typeof clientLocation === 'object')
                // dispatch(setLocation(clientLocation[response?.data.user.id]?.current?.id))
            } catch (error) {
                console.log(error)
                if (token) removeToken()
                dispatch(setError(error))
                navigate('/login', { replace: true })
            }
        }
        if (location.pathname !== '/login' && !isLoggedIn) {
            fetchUser()
        }
        if (permissionExpired) fetchUser()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn, navigate, permissionExpired])

    return children
}

export default AuthGuard
