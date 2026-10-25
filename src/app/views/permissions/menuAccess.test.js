import { describe, expect, it } from 'vitest'
import {
    accessLevelsWith,
    accessMeta,
    diffIds,
    groupLabel,
    groupMenus,
    idsToSave,
    initialIdsOf,
    isPlatformUser,
    lockedIdsOf,
    roleFormChanges,
    roleNameProblem,
    roleNameOf,
    setManyIds,
    summaryOf,
    toggleId,
    whyNotDeletable
} from './menuAccess'

const menus = [
    {
        id: 1,
        label: 'Leads',
        url: '/process/leads',
        group: 'process',
        access: false,
        fromRole: true,
        roleName: 'SALES'
    },
    { id: 2, label: 'Packages', url: '/process/packages', group: 'process', access: true, fromRole: false },
    { id: 3, label: 'Transactions', url: '/process/transactions', group: 'process', access: false, fromRole: false },
    { id: 4, label: 'Destinations', url: '/master/destinations', group: 'master', access: false, fromRole: false },
    {
        id: 5,
        label: 'Email Leads',
        url: '/integration/gmail',
        group: 'integration',
        access: true,
        fromRole: true,
        roleName: 'SALES'
    },
    { id: 6, label: 'Reports', url: '/reports', group: 'reports', access: false }
]

describe('sections', () => {
    it('names the groups as the sidebar does, anything else capitalised', () => {
        expect(groupLabel('master')).toBe('Masters')
        expect(groupLabel('process')).toBe('Operations')
        expect(groupLabel('integration')).toBe('Integrations')
        expect(groupLabel('reports')).toBe('Reports')
        expect(groupLabel('')).toBe('Other')
    })

    it('groups in sidebar order and counts what is on, role screens included', () => {
        const sections = groupMenus(menus, [2])
        expect(sections.map(section => section.label)).toEqual(['Masters', 'Operations', 'Integrations', 'Reports'])
        const operations = sections.find(section => section.group === 'process')
        expect(operations).toMatchObject({ total: 3, on: 2 })
        expect(operations.items.find(item => item.id === 1)).toMatchObject({ locked: true, checked: true })
        expect(sections.find(section => section.group === 'integration').on).toBe(1)
    })

    it('a search shows only matching screens but keeps the section counts', () => {
        const sections = groupMenus(menus, [2], 'trans')
        const operations = sections.find(section => section.group === 'process')
        expect(operations.items.map(item => item.id)).toEqual([3])
        expect(operations.total).toBe(3)
        expect(sections.filter(section => section.visible).map(section => section.group)).toEqual(['process'])
    })

    it('sums up "n of m screens"', () => {
        expect(summaryOf(menus, [2, 4])).toEqual({ on: 4, total: 6, locked: 2 })
    })
})

describe('what is saved', () => {
    it('starts from the user’s own screens only — never what the role gives', () => {
        expect(initialIdsOf(menus)).toEqual([2])
        expect(lockedIdsOf(menus)).toEqual([1, 5])
        expect(roleNameOf(menus)).toBe('SALES')
    })

    it('counts what changed', () => {
        expect(diffIds([2], [2, 3, 4])).toEqual({ added: [3, 4], removed: [], count: 2 })
        expect(diffIds([2, 3], [3])).toEqual({ added: [], removed: [2], count: 1 })
        expect(diffIds(['2'], [2]).count).toBe(0)
    })

    it('sends the ticked ids without the role’s, each once', () => {
        expect(idsToSave([2, 1, 2, '3', 5], [1, 5])).toEqual([2, 3])
    })

    it('toggles one, and a whole section, leaving locked screens alone', () => {
        expect(toggleId([2], 3)).toEqual([2, 3])
        expect(toggleId([2, 3], 2)).toEqual([3])
        const process = groupMenus(menus, [2]).find(section => section.group === 'process').items
        expect(setManyIds([2], process, true).sort()).toEqual([2, 3])
        expect(setManyIds([2, 3, 4], process, false)).toEqual([4])
    })
})

describe('access levels', () => {
    it('gives each level a title, a colour and what it means', () => {
        expect(accessMeta('manager')).toMatchObject({
            title: 'Manager',
            color: 'warning',
            meaning: 'sees and assigns every lead and booking; can’t manage users or roles'
        })
        expect(accessMeta('nonsense').value).toBe('staff')
    })

    it('uses the server’s wording when it sends one', () => {
        const levels = accessLevelsWith({ staff: 'Staff — their own work' })
        expect(levels.map(level => level.value)).toEqual(['admin', 'manager', 'accounts', 'operations', 'staff'])
        expect(levels[4].meaning).toBe('their own work')
    })

    it('has an Operations level: it books hotels and transport, sales only asks', () => {
        expect(accessMeta('operations')).toMatchObject({
            title: 'Operations',
            meaning:
                'books hotels and transport on every booking; sales staff only ask them; can’t manage users or roles'
        })
    })
})

describe('roles', () => {
    it('knows the super admin by having no agency', () => {
        expect(isPlatformUser({ user: { id: 1, clientId: null } })).toBe(true)
        expect(isPlatformUser({ user: { id: 2, clientId: 7 } })).toBe(false)
        expect(isPlatformUser({ user: null })).toBe(false)
    })

    it('checks a role name as the server does', () => {
        expect(roleNameProblem('s')).toMatch(/at least 2/)
        expect(roleNameProblem('sales!')).toMatch(/letters, numbers/)
        expect(roleNameProblem('admin')).toMatch(/reserved/)
        expect(roleNameProblem('field sales')).toBe('')
        expect(roleNameProblem('', { isSystem: true })).toBe('')
    })

    it('says why a role can’t be deleted', () => {
        expect(whyNotDeletable({ name: 'ADMIN', isSystem: true, users: 0 })).toMatch(/can’t be deleted/)
        expect(whyNotDeletable({ name: 'SALES', users: 2 })).toMatch(/2 users still have/)
        expect(whyNotDeletable({ name: 'SALES', users: 0 })).toBeNull()
    })

    it('sends only what changed on a role, never a system role’s name or access', () => {
        const saved = { name: 'SALES', access: 'staff', description: '', menuIds: [1, 2] }
        expect(roleFormChanges(saved, { ...saved })).toEqual({ count: 0, payload: {} })
        expect(roleFormChanges(saved, { ...saved, name: ' field  sales ', menuIds: [2, 3] })).toEqual({
            count: 3,
            payload: { name: 'FIELD SALES', menuIds: [2, 3] }
        })
        const admin = { name: 'ADMIN', access: 'admin', description: '', menuIds: [] }
        expect(
            roleFormChanges(
                admin,
                { ...admin, name: 'BOSS', access: 'staff', description: 'Owners' },
                { isSystem: true }
            )
        ).toEqual({
            count: 1,
            payload: { description: 'Owners' }
        })
    })

    it('sends a whole new role', () => {
        const empty = { name: '', access: 'staff', description: '', menuIds: [] }
        expect(
            roleFormChanges(empty, { name: 'sales', access: 'manager', description: '', menuIds: [4] }, { isNew: true })
                .payload
        ).toEqual({
            name: 'SALES',
            access: 'manager',
            description: '',
            menuIds: [4]
        })
    })
})
