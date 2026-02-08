import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useGetMenuQuery } from '@/app/store/slices/api/authApiSlice'
import { setMenuItems } from '@/app/store/slices/auth'

const MenuInitializer = ({ children }) => {
    const dispatch = useDispatch()
    const user = useSelector(state => state.auth.user) // Get user from persisted auth state

    // 1. Fetch menu. Skip if no user is found.
    const { data: menuData, isSuccess } = useGetMenuQuery(user?.id, {
        skip: !user?.id,
        refetchOnMountOrArgChange: true
    })

    // 2. Sync with Redux state once data is fetched
    useEffect(() => {
        if (isSuccess && menuData?.data) {
            dispatch(setMenuItems(menuData.data))
        }
    }, [isSuccess, menuData, dispatch])

    return children
}

export default MenuInitializer
