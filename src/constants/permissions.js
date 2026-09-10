/**
 * ============================================================================
 *  PERMISSIONS — must mirror TTKB/Constants/permissions.js
 * ============================================================================
 *
 *  The API returns the signed-in user's effective permissions on
 *  `GET /v1/auth/user` as `user.permissions`, a flat array of `resource:action`
 *  strings. This file names them so components can reference a constant rather
 *  than a magic string.
 *
 *  IMPORTANT — what this layer is and is not.
 *
 *  These checks decide what the UI OFFERS. They are not a security boundary:
 *  anyone can open devtools and dispatch whatever they like. Every permission
 *  is enforced again server-side by `requirePermission` on the route. Hiding a
 *  button is a courtesy to the user, not protection for the data.
 *
 *  That distinction was lost in the original build: the product shipped a full
 *  role-and-permission editor, the API applied none of it, and the guard that
 *  consumed it in the browser had its enforcement commented out — so the
 *  feature looked complete and did nothing at either end.
 *
 *  When adding a permission, add it in BOTH files. The backend is authoritative;
 *  a string here that the backend does not know simply never matches.
 * ============================================================================
 */

export const PERMISSIONS = {
    // ---- platform administration (vendor staff only) ----
    CLIENT_READ: 'client:read',
    CLIENT_WRITE: 'client:write',
    CLIENT_BILLING: 'client:billing',
    PLATFORM_USER_READ: 'platformUser:read',
    PLATFORM_USER_WRITE: 'platformUser:write',
    PLATFORM_ROLE_READ: 'platformRole:read',
    PLATFORM_ROLE_WRITE: 'platformRole:write',
    MENU_READ: 'menu:read',
    MENU_WRITE: 'menu:write',
    JOB_APPLICATION_READ: 'jobApplication:read',
    JOB_APPLICATION_WRITE: 'jobApplication:write',

    // ---- tenant administration ----
    TENANT_USER_READ: 'tenantUser:read',
    TENANT_USER_WRITE: 'tenantUser:write',
    TENANT_ROLE_READ: 'tenantRole:read',
    TENANT_ROLE_WRITE: 'tenantRole:write',
    TENANT_PERMISSION_WRITE: 'tenantPermission:write',
    INTEGRATION_READ: 'integration:read',
    INTEGRATION_WRITE: 'integration:write',

    // ---- product catalogue ----
    CAMPAIGN_READ: 'campaign:read',
    CAMPAIGN_WRITE: 'campaign:write',
    CAMPAIGN_DELETE: 'campaign:delete',
    PACKAGE_TEMPLATE_READ: 'packageTemplate:read',
    PACKAGE_TEMPLATE_WRITE: 'packageTemplate:write',

    // ---- partners ----
    SUPPLIER_READ: 'supplier:read',
    SUPPLIER_WRITE: 'supplier:write',
    AGENT_READ: 'agent:read',
    AGENT_WRITE: 'agent:write',

    // ---- sales pipeline ----
    LEAD_READ: 'lead:read',
    LEAD_WRITE: 'lead:write',
    LEAD_DELETE: 'lead:delete',
    LEAD_ASSIGN: 'lead:assign',
    LEAD_READ_ALL: 'lead:readAll',
    QUOTATION_READ: 'quotation:read',
    QUOTATION_WRITE: 'quotation:write',
    QUOTATION_SEND: 'quotation:send',

    // ---- confirmed bookings & money ----
    BOOKING_READ: 'booking:read',
    BOOKING_WRITE: 'booking:write',
    PAYMENT_READ: 'payment:read',
    PAYMENT_WRITE: 'payment:write',
    // Buy-side cost and profit visibility. The commercial reason the roles
    // exist: a salesperson must not see what the agency paid the hotel.
    MARGIN_READ: 'margin:read',

    // ---- misc ----
    DASHBOARD_READ: 'dashboard:read',
    FILE_UPLOAD: 'file:upload',
    AI_ASSIST: 'ai:assist'
}

/** Access scopes returned by the API as `user.scope`. */
export const SCOPES = {
    PLATFORM: 'PLATFORM',
    TENANT: 'TENANT'
}

/**
 * Route path -> permission required to open it.
 *
 * Paths are matched by longest prefix, so `/master/campaigns/edit/12` inherits
 * the entry for `/master/campaigns`. A path with no entry falls back to the
 * menu grants the API returns, which is how custom screens keep working
 * without being listed here.
 */
export const ROUTE_PERMISSIONS = {
    '/dashboard': PERMISSIONS.DASHBOARD_READ,

    // platform administration
    '/master/client': PERMISSIONS.CLIENT_READ,

    // workspace setup
    '/master/user': PERMISSIONS.TENANT_USER_READ,
    '/userManagement/user': PERMISSIONS.TENANT_USER_WRITE,
    '/userManagement/role': PERMISSIONS.TENANT_ROLE_READ,

    // catalogue
    '/master/campaigns': PERMISSIONS.CAMPAIGN_READ,
    '/master/destinations': PERMISSIONS.CAMPAIGN_READ,
    '/master/itenary': PERMISSIONS.CAMPAIGN_READ,
    '/master/packages': PERMISSIONS.PACKAGE_TEMPLATE_READ,
    '/package/activities': PERMISSIONS.PACKAGE_TEMPLATE_READ,

    // partners
    '/master/supplier': PERMISSIONS.SUPPLIER_READ,
    '/master/agent': PERMISSIONS.AGENT_READ,

    // pipeline
    '/process/leads': PERMISSIONS.LEAD_READ,
    '/process/guest': PERMISSIONS.QUOTATION_READ,
    '/process/packages': PERMISSIONS.BOOKING_READ,
    // The transactions ledger shows supplier costs and profit, so it needs
    // margin visibility rather than plain payment access.
    '/process/transactions': PERMISSIONS.MARGIN_READ,
    '/process/candidates': PERMISSIONS.JOB_APPLICATION_READ,

    // integrations
    '/integration/gmail': PERMISSIONS.INTEGRATION_READ,
    '/integration/facebook': PERMISSIONS.INTEGRATION_READ
}

/**
 * @description finds the permission guarding a path, by longest-prefix match
 * @param {string} pathname
 * @returns {string|null}
 */
export function permissionForPath(pathname) {
    if (!pathname) return null

    // Longest-prefix wins, so `/master/packages` beats `/master` if both were
    // listed. Written with reduce rather than a for..of loop because the
    // airbnb config forbids iterators here (no-restricted-syntax).
    const match = Object.entries(ROUTE_PERMISSIONS).reduce(
        (best, [prefix, permission]) => {
            const matches = pathname === prefix || pathname.startsWith(`${prefix}/`)
            if (matches && prefix.length > best.length) return { permission, length: prefix.length }
            return best
        },
        { permission: null, length: 0 }
    )

    return match.permission
}

export default PERMISSIONS
