import { describe, expect, it } from 'vitest'
import { csvOf } from '@core/listing/listingFacts'
import { ROLE_CSV_COLUMNS, countText, filterRoles } from './roleList'

const roles = [
    {
        id: 1,
        name: 'ADMIN',
        access: 'admin',
        description: 'Runs the agency',
        users: 1,
        menuIds: [1, 2],
        isSystem: true
    },
    { id: 2, name: 'Sales', access: 'staff', description: 'Works leads', users: 3, menuIds: [1] },
    { id: 3, name: 'Accounts desk', access: 'accounts', users: 0, menuIds: [] }
]

describe('filterRoles', () => {
    it('keeps everything with no search and no access', () => {
        expect(filterRoles(roles)).toHaveLength(3)
    })
    it('searches name and description, ignoring case', () => {
        expect(filterRoles(roles, { search: ' SALES ' }).map(r => r.id)).toEqual([2])
        expect(filterRoles(roles, { search: 'runs the' }).map(r => r.id)).toEqual([1])
    })
    it('filters by access, and combines it with the search', () => {
        expect(filterRoles(roles, { access: 'accounts' }).map(r => r.id)).toEqual([3])
        expect(filterRoles(roles, { access: 'staff', search: 'accounts' })).toEqual([])
    })
    it('treats a role with no access as staff and survives bad input', () => {
        expect(filterRoles([{ id: 9, name: 'X' }], { access: 'staff' })).toHaveLength(1)
        expect(filterRoles(undefined, { search: 'a' })).toEqual([])
    })
})

describe('role CSV and count', () => {
    it('writes one line per role', () => {
        const lines = csvOf(roles, ROLE_CSV_COLUMNS).split('\r\n')
        expect(lines[0]).toBe('Role,Description,Access,Users,Screens,System role')
        expect(lines[2]).toBe('Sales,Works leads,Staff,3,1,No')
    })
    it('says how many match', () => {
        expect(countText(3, 3)).toBe('3 roles')
        expect(countText(1, 3)).toBe('1 of 3 roles')
    })
})
