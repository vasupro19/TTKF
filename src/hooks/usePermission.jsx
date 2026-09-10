import { useSelector } from 'react-redux'

import { permissionForPath } from '@/constants/permissions'

/**
 * ============================================================================
 *  usePermission
 * ============================================================================
 *
 *  The single hook components should use to decide whether to offer an action.
 *
 *      const canEditPricing = usePermission(PERMISSIONS.QUOTATION_WRITE)
 *      const canSeeMargin  = usePermission(PERMISSIONS.MARGIN_READ)
 *
 *  Pass several permissions to mean "any of these":
 *
 *      const canSend = usePermission(PERMISSIONS.QUOTATION_SEND, PERMISSIONS.BOOKING_WRITE)
 *
 *  Reminder: hiding a button is a courtesy, not a control. The API enforces the
 *  same permission on the request the button would make.
 *
 * @param {...string} required one or more permission strings
 * @returns {boolean}
 */
export function usePermission(...required) {
    const permissions = useSelector(state => state.auth.permissions)

    // Called with no arguments means "is the user authenticated at all", which
    // the caller almost certainly did not intend — treat it as a no.
    if (!required.length) return false

    return required.some(permission => permissions.has(permission))
}

/**
 * @description the caller's full permission set, for components that need to
 *              make several checks without re-subscribing per check
 * @returns {Set<string>}
 */
export function usePermissions() {
    return useSelector(state => state.auth.permissions)
}

/**
 * @description true when the signed-in user is vendor staff rather than a
 *              customer's user
 * @returns {boolean}
 */
export function useIsPlatformAdmin() {
    return useSelector(state => state.auth.scope === 'PLATFORM')
}

/**
 * @description whether a given route path is open to the caller. Useful for
 *              deciding whether to render a link at all.
 * @param {string} pathname
 * @returns {boolean}
 */
export function useCanOpenPath(pathname) {
    const { permissions, allowedPaths } = useSelector(state => state.auth)

    const required = permissionForPath(pathname)
    if (required && permissions.has(required)) return true

    return allowedPaths.has(pathname)
}

export default usePermission
