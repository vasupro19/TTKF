import { useSelector } from 'react-redux'

import { PERMISSIONS, permissionForPath } from '@/constants/permissions'

/**
 * ============================================================================
 *  useUiAccess — legacy shim
 * ============================================================================
 *
 *  Kept so the existing `useUiAccess('create')` call sites keep working while
 *  they migrate to `usePermission`.
 *
 *  It used to read `moduleAccess`, a Set that was never populated (the reducer
 *  filling it was commented out), and returned `moduleAccess.size === 0 || ...`
 *  — so it answered `true` for everyone, always.
 *
 *  It now resolves the coarse verb to the write permission for the screen the
 *  user is on. That is necessarily approximate: 'create' on the leads table
 *  means lead:write, on the supplier table supplier:write. Prefer
 *  `usePermission(PERMISSIONS.X)` in new code, where the intent is explicit.
 *
 *  @deprecated use `usePermission` from '@/hooks/usePermission'
 * ============================================================================
 */

const TYPES = ['create', 'export', 'edit', 'view']

/**
 * Maps a read permission to the matching write permission, so a screen guarded
 * by `campaign:read` treats 'create'/'edit' as needing `campaign:write`.
 */
const READ_TO_WRITE = {
    [PERMISSIONS.CAMPAIGN_READ]: PERMISSIONS.CAMPAIGN_WRITE,
    [PERMISSIONS.PACKAGE_TEMPLATE_READ]: PERMISSIONS.PACKAGE_TEMPLATE_WRITE,
    [PERMISSIONS.SUPPLIER_READ]: PERMISSIONS.SUPPLIER_WRITE,
    [PERMISSIONS.AGENT_READ]: PERMISSIONS.AGENT_WRITE,
    [PERMISSIONS.LEAD_READ]: PERMISSIONS.LEAD_WRITE,
    [PERMISSIONS.QUOTATION_READ]: PERMISSIONS.QUOTATION_WRITE,
    [PERMISSIONS.BOOKING_READ]: PERMISSIONS.BOOKING_WRITE,
    [PERMISSIONS.PAYMENT_READ]: PERMISSIONS.PAYMENT_WRITE,
    [PERMISSIONS.TENANT_USER_READ]: PERMISSIONS.TENANT_USER_WRITE,
    [PERMISSIONS.TENANT_ROLE_READ]: PERMISSIONS.TENANT_ROLE_WRITE,
    [PERMISSIONS.CLIENT_READ]: PERMISSIONS.CLIENT_WRITE,
    [PERMISSIONS.INTEGRATION_READ]: PERMISSIONS.INTEGRATION_WRITE,
    [PERMISSIONS.JOB_APPLICATION_READ]: PERMISSIONS.JOB_APPLICATION_WRITE
}

function useUiAccess(type) {
    if (!TYPES.includes(type)) {
        throw new Error('Unknown TYPE input for useUiAccess')
    }

    const permissions = useSelector(state => state.auth.permissions)

    // 'view' and 'export' are covered by simply being able to open the screen,
    // which UrlAccessGuard has already decided.
    if (type === 'view' || type === 'export') return true

    // Resolve the current screen to its read permission, then to the matching
    // write permission.
    const readPermission = permissionForPath(window.location.pathname)
    const writePermission = READ_TO_WRITE[readPermission]

    // An unmapped screen falls back to permissive rather than blocking a
    // working feature on an incomplete mapping. The API still enforces.
    if (!writePermission) return true

    return permissions.has(writePermission)
}

export default useUiAccess
