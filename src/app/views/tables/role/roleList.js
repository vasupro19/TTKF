import { accessMeta, ACCESS_LEVELS, plural } from '@views/permissions/menuAccess'

// ? the Roles list is small and arrives whole, so its search and Access filter run here, not on the server

/** @description the Access dropdown: the four levels */
export const ACCESS_OPTIONS = ACCESS_LEVELS.map(level => ({ value: level.value, label: level.title }))

/** @description the roles whose name or description has the text and whose access is the one chosen ('' = any) */
export const filterRoles = (roles, { search = '', access = '' } = {}) => {
    const text = String(search).trim().toLowerCase()
    return (Array.isArray(roles) ? roles : []).filter(role => {
        if (access && accessMeta(role.access).value !== access) return false
        if (!text) return true
        return `${role.name || ''} ${role.description || ''}`.toLowerCase().includes(text)
    })
}

/** @description the CSV columns: label and the text each cell holds */
export const ROLE_CSV_COLUMNS = [
    { key: 'name', label: 'Role' },
    { key: 'description', label: 'Description' },
    { key: 'access', label: 'Access', csv: role => accessMeta(role.access).title },
    { key: 'users', label: 'Users', csv: role => role.users ?? 0 },
    { key: 'screens', label: 'Screens', csv: role => (Array.isArray(role.menuIds) ? role.menuIds.length : 0) },
    { key: 'isSystem', label: 'System role', csv: role => (role.isSystem ? 'Yes' : 'No') }
]

export const countText = (count, total) =>
    count === total ? plural(count, 'role') : `${count} of ${plural(total, 'role')}`
