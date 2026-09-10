import { createSlice } from '@reduxjs/toolkit'

import { SCOPES } from '@/constants/permissions'

/**
 * ============================================================================
 *  AUTH STATE
 * ============================================================================
 *
 *  Holds the signed-in user plus the two things the UI needs to render itself
 *  correctly:
 *
 *    permissions   Set<string>  what the API will let this user do. Comes
 *                               straight from `GET /v1/auth/user`, which
 *                               resolves it server-side on every request.
 *    allowedPaths  Set<string>  which screens are in this user's navigation.
 *
 *  WHAT CHANGED
 *  ------------
 *  The permission derivation inside `setUserDetails` was entirely commented
 *  out, so `menuAccess`, `moduleAccess` and `pathAccess` stayed empty forever.
 *  Every guard that read them therefore either passed everything or would have
 *  blocked everything — which is why the enforcement block in
 *  UrlPermissionGuard had been commented out as well. The whole
 *  role-and-permission feature was inert at both ends: a full editing UI that
 *  changed nothing, and an API that checked nothing.
 *
 *  `masterAdminAllowedRoutes` has also gone. It listed 37 route keys —
 *  `warehouse_location`, `storage_location`, `bin`, `pallet`, `sku_master`,
 *  `generate_serials`, … — from the warehouse management product this codebase
 *  was forked from. None of them exist in a travel CRM.
 * ============================================================================
 */

const FACEBOOK_INTEGRATION_MENU = {
    id: 'facebook_integration',
    label: 'Facebook Integration',
    icon: 'Memory',
    url: '/integration/facebook',
    group: 'integration',
    access: true,
    type: 'item'
}

const JOB_CANDIDATES_MENU = {
    id: 'job_candidates',
    label: 'Job Candidates',
    icon: 'UsergroupAddOutlined',
    url: '/process/candidates',
    group: 'process',
    access: true,
    type: 'item'
}

/**
 * Appends menu entries that exist as screens but may have no row in the menu
 * table yet, so a tenant provisioned before those features shipped does not
 * lose access to them.
 *
 * @param {Array} menuItems grouped menu from the API
 * @returns {Array}
 */
const normalizeMenuItems = menuItems => {
    if (!Array.isArray(menuItems)) return []

    const appendIfMissing = (group, extra) => {
        if (!Array.isArray(group.children)) return group
        if (group.children.some(child => child?.url === extra.url)) return group
        return { ...group, children: [...group.children, extra] }
    }

    return menuItems.map(item => {
        if (item?.id === 'integration') return appendIfMissing(item, FACEBOOK_INTEGRATION_MENU)
        if (item?.id === 'process') return appendIfMissing(item, JOB_CANDIDATES_MENU)
        return item
    })
}

/**
 * Flattens the grouped menu into the set of paths this user may open.
 *
 * @param {Array} menuItems
 * @returns {Set<string>}
 */
const collectAllowedPaths = menuItems => {
    const paths = new Set()

    const visit = item => {
        if (!item) return
        if (item.url) paths.add(item.url)
        if (Array.isArray(item.children)) item.children.forEach(visit)
    }

    if (Array.isArray(menuItems)) menuItems.forEach(visit)
    return paths
}

const initialState = {
    isLoggedIn: false,
    user: null,
    loading: false,
    error: null,
    selectedLocation: null,
    menuItems: [],

    /** effective permissions from the API — the source of truth for the UI */
    permissions: new Set(),

    /** paths present in this user's navigation */
    allowedPaths: new Set(),

    /** 'PLATFORM' for vendor staff, 'TENANT' for a customer's user */
    scope: null,

    /** the workspace this session belongs to */
    clientId: null,
    clientName: '',

    /** tenant-side role name, e.g. 'MANAGER' — for display */
    roleName: null,

    permissionExpired: false
}

const AuthSlice = createSlice({
    name: 'Auth',
    initialState,
    reducers: {
        logout: state => {
            // Reset everything. Leaving permissions populated after sign-out
            // briefly renders the previous user's navigation to the next one.
            Object.assign(state, initialState, { permissions: new Set(), allowedPaths: new Set() })
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        },
        setLocation: (state, action) => {
            state.selectedLocation = action.payload
        },
        setMenuItems: (state, action) => {
            const normalized = normalizeMenuItems(action.payload)
            state.menuItems = normalized
            state.allowedPaths = collectAllowedPaths(normalized)
        },
        setUserDetails: (state, action) => {
            const user = action.payload?.user || action.payload || null

            state.user = user ? { ...user } : null
            state.isLoggedIn = Boolean(user)
            state.error = null
            state.permissionExpired = false

            // The API is authoritative: it recomputes permissions from the
            // database on every request, so revoking a role takes effect
            // immediately rather than when the access token expires.
            state.permissions = new Set(Array.isArray(user?.permissions) ? user.permissions : [])
            state.scope = user?.scope || SCOPES.TENANT
            state.clientId = user?.clientId ?? null
            state.clientName = user?.clientName || ''
            state.roleName = user?.roleName || null
        },
        setPermissionExpired: state => {
            state.permissionExpired = true
        }
    }
})

export const { logout, setLoading, setError, setLocation, setMenuItems, setUserDetails, setPermissionExpired } =
    AuthSlice.actions

// ------------------------------------------------------------- SELECTORS

/**
 * @description true when the user holds at least one of the given permissions
 * @param {object} state redux state
 * @param {...string} required
 * @returns {boolean}
 */
export const selectCan = (state, ...required) => required.some(permission => state.auth.permissions.has(permission))

export const selectPermissions = state => state.auth.permissions
export const selectIsPlatformAdmin = state => state.auth.scope === SCOPES.PLATFORM

export default AuthSlice.reducer
