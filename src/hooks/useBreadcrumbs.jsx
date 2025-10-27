import { clearCustomBreadcrumbs, setCustomBreadcrumbs } from '@/app/store/slices/breadcrumbsSlice'
import { useDispatch, useSelector } from 'react-redux'

// to set custom NavbarBreadcrumbs
// eslint-disable-next-line import/prefer-default-export
export const useBreadcrumbs = () => {
    const dispatch = useDispatch()
    const customBreadcrumbs = useSelector(state => state.breadcrumbs.customBreadcrumbs)

    const setBreadcrumbs = breadcrumbs => {
        dispatch(setCustomBreadcrumbs(breadcrumbs))
    }

    const clearBreadcrumbs = () => {
        dispatch(clearCustomBreadcrumbs())
    }

    return {
        customBreadcrumbs,
        setBreadcrumbs,
        clearBreadcrumbs
    }
}
