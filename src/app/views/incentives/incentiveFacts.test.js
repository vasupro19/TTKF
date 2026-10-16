import { describe, expect, it, test } from 'vitest'
import { csvOf } from '@/core/listing/listingFacts'
import { BASIS_HELP, TEAM_COLUMNS, earnedNote, filterTeamRows } from './incentiveFacts'

describe('earnedNote', () => {
    test('shows the base and the bonus once the bonus is earned', () => {
        expect(earnedNote({ bonusEarned: true, base: 3000, bonus: 5000, packagesToBonus: 0 })).toBe(
            '₹3,000.00 + ₹5,000.00 bonus'
        )
    })

    test('says how many packages are left for the bonus', () => {
        expect(earnedNote({ bonusEarned: false, packagesToBonus: 1 })).toBe('1 more package for the bonus')
        expect(earnedNote({ bonusEarned: false, packagesToBonus: 3 })).toBe('3 more packages for the bonus')
    })

    test('says nothing when there is no bonus', () => {
        expect(earnedNote({ bonusEarned: false, packagesToBonus: 0 })).toBe('')
    })
})

test('every way of earning has its help', () => {
    expect(Object.keys(BASIS_HELP).sort()).toEqual(['package', 'profit', 'sales'])
})

describe('the team table filters', () => {
    const rows = [
        {
            user: { name: 'Anil Kumar', role: 'Sales', active: true },
            plan: { summary: '10% of profit' },
            earned: { bonusEarned: true, total: 900 },
            sales: 5000,
            profit: 100,
            leads: 2,
            packages: 1
        },
        {
            user: { name: 'Bela', role: 'Manager', active: true },
            plan: null,
            earned: { total: 0 },
            sales: 0,
            profit: null,
            costPending: 1,
            leads: 0,
            packages: 0
        }
    ]
    it('searches the name or role, ignoring case', () => {
        expect(filterTeamRows(rows, { q: 'anil' })).toHaveLength(1)
        expect(filterTeamRows(rows, { q: 'MANAGER' })[0].user.name).toBe('Bela')
        expect(filterTeamRows(rows, { q: 'zzz' })).toHaveLength(0)
    })
    it('filters by plan', () => {
        expect(filterTeamRows(rows, { plan: 'has' }).map(r => r.user.name)).toEqual(['Anil Kumar'])
        expect(filterTeamRows(rows, { plan: 'none' }).map(r => r.user.name)).toEqual(['Bela'])
        expect(filterTeamRows(rows, { plan: 'bonus' }).map(r => r.user.name)).toEqual(['Anil Kumar'])
        expect(filterTeamRows(rows, {})).toHaveLength(2)
    })
    it('writes what is shown to CSV, leaving an unknown profit empty', () => {
        const text = csvOf(rows, TEAM_COLUMNS)
        expect(text.split('\r\n')[0]).toBe('Person,Role,Leads,Packages,Sales (no GST),Profit,Plan,Earned')
        expect(text.split('\r\n')[2]).toBe('Bela,Manager,0,0,0,,No plan,0')
    })
})
