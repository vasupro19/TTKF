/**
 * ============================================================================
 *  WHO OPENS WHICH SCREEN: the logic behind the menu-access editor
 * ============================================================================
 *
 *  The same editor gives screens to an agency user, to an agency (by the
 *  super admin) and to an agency's role. Screens come from the API as a flat
 *  list ({ id, label, url, group, access, fromRole, roleName }); here they are
 *  grouped into sections, counted and compared with what was saved.
 *
 *  A screen the user's role already opens is shown on and locked: it is
 *  changed on the role, and never saved as the user's own.
 * ============================================================================
 */

const GROUP_LABELS = { master: 'Masters', process: 'Operations', integration: 'Integrations' }
// ? the order the sidebar shows them in; anything else follows, by name
const GROUP_ORDER = ['master', 'process', 'integration']

/** @description a section's title: "master" → "Masters", anything else capitalised */
export const groupLabel = group => {
    const key = String(group || '').trim()
    if (!key) return 'Other'
    if (GROUP_LABELS[key.toLowerCase()]) return GROUP_LABELS[key.toLowerCase()]
    return key.charAt(0).toUpperCase() + key.slice(1)
}

/** @description an id as the API compares it (numbers stay numbers) */
const sameId = id => (typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : id)

/** @description the screens the user's role opens: on and locked here */
export const lockedIdsOf = menus => (menus || []).filter(menu => menu?.fromRole).map(menu => sameId(menu.id))

/** @description the role name to show on locked screens ("SALES"), when there is one */
export const roleNameOf = menus => (menus || []).find(menu => menu?.fromRole && menu?.roleName)?.roleName || null

/** @description the screens ticked as saved — the user's own only, never what their role gives */
export const initialIdsOf = menus =>
    (menus || [])
        .filter(menu => !menu?.fromRole && (menu?.access === true || menu?.access === 1))
        .map(menu => sameId(menu.id))

/**
 * @description the screens grouped into sections, each with how many are on
 * @param {Array} menus every screen
 * @param {Array} onIds the ids ticked now (not counting locked ones)
 * @param {string} [search] only the screens whose name or address matches
 * @returns {Array<{ group, label, items, total, on, visible }>} items are the screens shown; total/on count the whole section
 */
export const groupMenus = (menus, onIds, search = '') => {
    const on = new Set((onIds || []).map(sameId))
    const term = String(search || '')
        .trim()
        .toLowerCase()
    const sections = new Map()
    ;(menus || []).forEach(menu => {
        const group = String(menu?.group || '').trim() || 'other'
        if (!sections.has(group)) sections.set(group, { group, label: groupLabel(group), all: [] })
        const id = sameId(menu.id)
        const locked = Boolean(menu.fromRole)
        sections.get(group).all.push({ ...menu, id, locked, checked: locked || on.has(id) })
    })
    const rank = group => {
        const index = GROUP_ORDER.indexOf(group.toLowerCase())
        return index === -1 ? GROUP_ORDER.length : index
    }
    return [...sections.values()]
        .sort((a, b) => rank(a.group) - rank(b.group) || a.label.localeCompare(b.label))
        .map(({ all, ...section }) => {
            const items = term
                ? all.filter(
                      item =>
                          String(item.label || '')
                              .toLowerCase()
                              .includes(term) ||
                          String(item.url || '')
                              .toLowerCase()
                              .includes(term) ||
                          section.label.toLowerCase().includes(term)
                  )
                : all
            return {
                ...section,
                items,
                total: all.length,
                on: all.filter(item => item.checked).length,
                visible: items.length > 0
            }
        })
}

/** @description "8 of 12 screens": how many are on (locked ones too) out of all */
export const summaryOf = (menus, onIds) => {
    const on = new Set((onIds || []).map(sameId))
    const list = menus || []
    const locked = list.filter(menu => menu?.fromRole).length
    const count = list.filter(menu => menu?.fromRole || on.has(sameId(menu.id))).length
    return { on: count, total: list.length, locked }
}

/** @description the ids turned on and off since it was saved */
export const diffIds = (initial, current) => {
    const before = new Set((initial || []).map(sameId))
    const now = new Set((current || []).map(sameId))
    const added = [...now].filter(id => !before.has(id))
    const removed = [...before].filter(id => !now.has(id))
    return { added, removed, count: added.length + removed.length }
}

/** @description what to send: the ids ticked, without what the role gives, each once */
export const idsToSave = (current, lockedIds = []) => {
    const locked = new Set((lockedIds || []).map(sameId))
    return [...new Set((current || []).map(sameId))].filter(id => !locked.has(id))
}

/** @description turns one screen on or off */
export const toggleId = (current, id) => {
    const target = sameId(id)
    const list = (current || []).map(sameId)
    return list.includes(target) ? list.filter(item => item !== target) : [...list, target]
}

/**
 * @description turns every unlocked screen of a list on, or off
 * @param {Array} current the ids ticked now
 * @param {Array} items the screens to change (a section, maybe only what the search shows)
 * @param {boolean} value on or off
 */
export const setManyIds = (current, items, value) => {
    const ids = (items || []).filter(item => !item.locked && !item.fromRole).map(item => sameId(item.id))
    const set = new Set((current || []).map(sameId))
    ids.forEach(id => (value ? set.add(id) : set.delete(id)))
    return [...set]
}

/* ------------------------------------------------------------------------ */
/*  Access levels of an agency's roles                                      */
/* ------------------------------------------------------------------------ */

export const ACCESS_LEVELS = Object.freeze([
    {
        value: 'admin',
        title: 'Agency admin',
        color: 'error',
        label: 'Agency admin — manages users, roles, menus and integrations; sees every lead and booking; verifies payments'
    },
    {
        value: 'manager',
        title: 'Manager',
        color: 'warning',
        label: 'Manager — sees and assigns every lead and booking; can’t manage users or roles'
    },
    {
        value: 'accounts',
        title: 'Accounts',
        color: 'info',
        label: 'Accounts — verifies payments and sees every booking; can’t manage users or roles'
    },
    {
        value: 'staff',
        title: 'Staff',
        color: 'success',
        label: 'Staff — works on their own leads and bookings'
    }
])

/**
 * @description a level's title, colour and meaning; the server's wording wins when it sends one
 * @param {string} access admin | manager | accounts | staff
 * @param {object} [serverOptions] accessOptions from the API ({ admin: '…' })
 */
export const accessMeta = (access, serverOptions = null) => {
    const key = String(access || '').toLowerCase()
    const known = ACCESS_LEVELS.find(level => level.value === key) || ACCESS_LEVELS[ACCESS_LEVELS.length - 1]
    const label = serverOptions?.[known.value] || known.label
    // ? "Manager — sees…": what follows the dash says what the level may do
    const meaning = label.includes('—') ? label.split('—').slice(1).join('—').trim() : label
    return { ...known, label, meaning }
}

/** @description the four levels, worded as the server sends them when it does */
export const accessLevelsWith = serverOptions => ACCESS_LEVELS.map(level => accessMeta(level.value, serverOptions))

/**
 * @description whether the signed-in user is the platform's super admin (no agency of their own)
 * @param {object} auth the auth slice of the store
 */
export const isPlatformUser = auth => {
    if (!auth?.user) return false
    return (auth.clientId ?? auth.user?.clientId ?? null) === null
}

/** @description "1 user", "3 screens" */
export const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`

/** @description why a role can't be deleted (the server says the same), or null when it can */
export const whyNotDeletable = role => {
    if (!role) return null
    if (role.isSystem) return `${role.name} is the agency’s own role and can’t be deleted`
    const users = Number(role.users) || 0
    if (users > 0)
        return `${plural(users, 'user')} still ${users === 1 ? 'has' : 'have'} this role — give them another role first`
    return null
}

/* ------------------------------------------------------------------------ */
/*  The role form                                                           */
/* ------------------------------------------------------------------------ */

/** @description a role name as the server saves it: trimmed, single spaces, capitals */
export const roleNameAsSaved = value =>
    String(value || '')
        .trim()
        .replace(/\s+/g, ' ')
        .toUpperCase()
        .slice(0, 60)

/** @description what is wrong with a role name (the server checks the same), or '' */
export const roleNameProblem = (value, { isSystem = false } = {}) => {
    if (isSystem) return ''
    const name = roleNameAsSaved(value)
    if (name.length < 2) return 'Give the role a name of at least 2 letters'
    if (!/^[A-Z0-9 &/_-]+$/.test(name)) return 'Use letters, numbers, spaces, & / _ - in the role name'
    if (name === 'ADMIN' || name === 'CLIENT') return `${name} is reserved — choose another name`
    return ''
}

/**
 * @description how many things changed on the role form, and what to send
 * @param {{ name, access, description, menuIds }} saved as loaded (empty for a new role)
 * @param {{ name, access, description, menuIds }} form as it is now
 * @param {{ isSystem?: boolean, isNew?: boolean }} [options] a system role's name and access are never sent
 */
export const roleFormChanges = (saved, form, { isSystem = false, isNew = false } = {}) => {
    const fields = {}
    if (!isSystem && roleNameAsSaved(form.name) !== roleNameAsSaved(saved.name))
        fields.name = roleNameAsSaved(form.name)
    if (!isSystem && (form.access || 'staff') !== (saved.access || 'staff')) fields.access = form.access || 'staff'
    const description = String(form.description || '').trim()
    if (description !== String(saved.description || '').trim()) fields.description = description
    const menus = diffIds(saved.menuIds, form.menuIds)
    const count = Object.keys(fields).length + menus.count
    const payload = isNew
        ? {
              name: roleNameAsSaved(form.name),
              access: form.access || 'staff',
              description,
              menuIds: idsToSave(form.menuIds)
          }
        : { ...fields, ...(menus.count ? { menuIds: idsToSave(form.menuIds) } : {}) }
    return { count, payload }
}
