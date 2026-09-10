import PropTypes from 'prop-types'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

import Forbidden from '@views/pages/Forbidden'
import LoadingPermissions from '@views/pages/LoadingPermissions'
import { permissionForPath, SCOPES } from '@/constants/permissions'

/**
 * ============================================================================
 *  ROUTE ACCESS GUARD
 * ============================================================================
 *
 *  Decides whether the signed-in user may open the current route.
 *
 *  WHAT WAS WRONG
 *  --------------
 *  The previous implementation computed an `isAllowed` value through a chain of
 *  six conditions, stored it in state — and then ended with an unconditional
 *  `return children`. The two blocks that actually denied access were commented
 *  out. So the product shipped a route guard, a permission editor and a role
 *  management screen, and every user could still open every screen.
 *
 *  It also read `pathAccess`, `menuAccess` and `moduleAccess`, all three of
 *  which were permanently empty because the reducer that populated them was
 *  commented out too.
 *
 *  HOW IT WORKS NOW
 *  ----------------
 *  Two independent checks, either of which is sufficient:
 *
 *    1. PERMISSION — the route's required permission (from ROUTE_PERMISSIONS)
 *       is in the set the API reported for this user. This is the primary check
 *       and mirrors what the server will enforce on the request the screen is
 *       about to make.
 *
 *    2. NAVIGATION — the path is in the user's menu grants. This covers screens
 *       with no explicit permission mapping, so a tenant's custom menu
 *       configuration keeps working.
 *
 *  WHAT THIS IS FOR: stopping a user wandering into a screen that can only show
 *  them errors. It is NOT a security control — anyone can edit the redux store
 *  in devtools. Access is enforced by the API on every request; see
 *  `requirePermission` in the backend.
 * ============================================================================
 */

/** Paths every authenticated user may reach, regardless of grants. */
const ALWAYS_ALLOWED = new Set(['/dashboard', '/select-client-location', '/profile', '/userprofile'])

/**
 * Strips the action and id segments the router appends, so
 * `/master/campaigns/edit/12` is evaluated as `/master/campaigns`.
 *
 * @param {string} pathname
 * @returns {string}
 */
function toBasePath(pathname) {
    return (
        pathname
            // trailing numeric id
            .replace(/\/\d+$/, '')
            // trailing uuid / cuid
            .replace(/\/[0-9a-f]{8}-[0-9a-f-]+$/i, '')
            // action segments, plus anything after them
            .replace(/\/(edit|create|add|view|permissions|wizard|activities)(\/.*)?$/, '') || '/'
    )
}

function UrlAccessGuard({ children }) {
    const location = useLocation()
    const { permissions, allowedPaths, scope, isLoggedIn, user } = useSelector(state => state.auth)

    const verdict = useMemo(() => {
        const cleanPath = location.pathname.split('?')[0]

        if (ALWAYS_ALLOWED.has(cleanPath)) return { allowed: true }

        // Permissions have not arrived yet. Show a spinner rather than a
        // Forbidden page — flashing "access denied" during a normal page load
        // is exactly why the original author disabled this guard.
        if (!isLoggedIn || !user) return { pending: true }
        if (permissions.size === 0 && allowedPaths.size === 0) return { pending: true }

        const basePath = toBasePath(cleanPath)

        // 1. explicit permission mapping
        const required = permissionForPath(basePath) || permissionForPath(cleanPath)
        if (required && permissions.has(required)) return { allowed: true }

        // 2. navigation grant
        if (allowedPaths.has(basePath) || allowedPaths.has(cleanPath)) return { allowed: true }

        // Platform staff manage tenants and have no tenant menu of their own,
        // so for unmapped routes they are judged on permissions alone.
        if (scope === SCOPES.PLATFORM && !required) return { allowed: true }

        return {
            allowed: false,
            reason: required
                ? 'Your role does not include the permission needed for this screen.'
                : 'This screen has not been enabled for your account.'
        }
    }, [location.pathname, permissions, allowedPaths, scope, isLoggedIn, user])

    if (verdict.pending) return <LoadingPermissions />
    if (!verdict.allowed) return <Forbidden message={verdict.reason} />

    return children
}

export default UrlAccessGuard

UrlAccessGuard.propTypes = {
    children: PropTypes.node
}
