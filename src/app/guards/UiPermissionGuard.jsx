import PropTypes from 'prop-types'

import useUiAccess from '@/hooks/useUiAccess'
import { usePermissions } from '@/hooks/usePermission'

/**
 * ============================================================================
 *  UI ACCESS GUARD
 * ============================================================================
 *
 *  Hides a control the user is not allowed to use.
 *
 *      <UiAccessGuard permission={PERMISSIONS.MARGIN_READ}>
 *          <SupplierCostColumn />
 *      </UiAccessGuard>
 *
 *  The `type` prop ('create' | 'edit' | 'view' | 'export') is the original
 *  coarse API and still works, resolved through the useUiAccess shim. Prefer
 *  `permission`, which states exactly what is being gated.
 *
 *  It previously read `moduleAccess` — a Set that was never populated, because
 *  the reducer filling it was commented out — and short-circuited on
 *  `moduleAccess.size > 0`, so the guard rendered its children unconditionally
 *  for every user.
 *
 *  As everywhere in this layer: this hides a control, it does not protect the
 *  data behind it. The API re-checks the same permission on every request.
 * ============================================================================
 */

const TYPES = ['create', 'export', 'edit', 'view']

function UiAccessGuard({ children, type = 'export', permission = null, fallback = null }) {
    if (!permission && !TYPES.includes(type)) {
        throw new Error(`Unknown TYPE "${type}" for UiAccessGuard`)
    }

    // Both hooks run unconditionally to satisfy the rules of hooks. Reading the
    // whole Set rather than calling usePermission(permission) avoids passing a
    // sentinel value when `permission` is not supplied.
    const permissions = usePermissions()
    const hasLegacyAccess = useUiAccess(TYPES.includes(type) ? type : 'view')

    const allowed = permission ? permissions.has(permission) : hasLegacyAccess

    return allowed ? children : fallback
}

export default UiAccessGuard

UiAccessGuard.propTypes = {
    children: PropTypes.node,
    /** legacy coarse verb */
    type: PropTypes.oneOf(TYPES),
    /** preferred: an explicit permission string from @/constants/permissions */
    permission: PropTypes.string,
    /** rendered instead of children when access is denied */
    fallback: PropTypes.node
}
