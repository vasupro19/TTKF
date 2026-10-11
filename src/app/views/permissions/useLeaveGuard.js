import { useEffect } from 'react'

/**
 * @description asks before the tab is closed or reloaded while there are unsaved changes.
 * The app's router (BrowserRouter) can't hold back an in-app move, so only leaving the page is caught.
 * @param {boolean} dirty whether something is unsaved
 */
const useLeaveGuard = dirty => {
    useEffect(() => {
        if (!dirty) return undefined
        const onBeforeUnload = event => {
            event.preventDefault()
            // eslint-disable-next-line no-param-reassign
            event.returnValue = ''
            return ''
        }
        window.addEventListener('beforeunload', onBeforeUnload)
        return () => window.removeEventListener('beforeunload', onBeforeUnload)
    }, [dirty])
}

export default useLeaveGuard
