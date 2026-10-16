import { describe, expect, test } from 'vitest'
import {
    STAGES,
    clockTime,
    filtersFromSearch,
    followUpMeta,
    fullDateTime,
    leadsCsv,
    nextAction,
    quoteOpened,
    relativeTime,
    searchWithFilters,
    shortDate,
    stageDetail,
    stageMeta,
    withLeadFilters,
    withPaging
} from './leadStages'

describe('stages', () => {
    test('five steps in order, each with a hint and an empty message', () => {
        expect(STAGES.map(stage => stage.key)).toEqual(['new', 'verified', 'quoting', 'sent', 'booked'])
        STAGES.forEach((stage, index) => {
            expect(stage.step).toBe(index + 1)
            expect(stage.hint).toBeTruthy()
            expect(stage.empty).toBeTruthy()
        })
    })

    test('an unknown stage reads as New', () => {
        expect(stageMeta('nope').key).toBe('new')
        expect(stageMeta(undefined).label).toBe('New')
    })

    test('each step has its one next action and route', () => {
        expect(nextAction({ id: 7, stage: 'new' })).toMatchObject({ label: 'Verify', kind: 'verify', to: null })
        expect(nextAction({ id: 7, stage: 'verified' })).toMatchObject({
            label: 'Build quote',
            to: '/process/guest/add/7'
        })
        expect(nextAction({ id: 7, stage: 'quoting' })).toMatchObject({
            label: 'Continue quote',
            to: '/process/guest/add/7'
        })
        expect(nextAction({ id: 7, stage: 'sent' })).toMatchObject({ label: 'Open quote', to: '/process/guest/add/7' })
        expect(nextAction({ id: 7, stage: 'booked' })).toMatchObject({
            label: 'Open booking',
            to: '/process/packages/7'
        })
    })

    test('follow-up states explain themselves', () => {
        expect(followUpMeta('Overdue').meaning).toMatch(/5 days/)
        expect(followUpMeta('Due Today').meaning).toMatch(/2–4 days/)
        expect(followUpMeta('Something').label).toBe('Something')
    })
})

describe('address bar', () => {
    test('?stage= is read as is', () => {
        expect(filtersFromSearch('?stage=sent')).toEqual({ stage: 'sent', followUpState: '', assignedTo: '' })
        expect(filtersFromSearch('?stage=bogus')).toEqual({ stage: 'all', followUpState: '', assignedTo: '' })
        expect(filtersFromSearch('')).toEqual({ stage: 'all', followUpState: '', assignedTo: '' })
    })

    test('the old ?status= links map onto steps', () => {
        expect(filtersFromSearch('?status=verified').stage).toBe('verified')
        expect(filtersFromSearch('?status=Confirmed').stage).toBe('booked')
        expect(filtersFromSearch('?status=Pending').stage).toBe('new')
        expect(filtersFromSearch('?status=All').stage).toBe('all')
        expect(filtersFromSearch('?stage=quoting&status=Confirmed').stage).toBe('quoting')
    })

    test('?followUpState= is kept when known', () => {
        expect(filtersFromSearch('?followUpState=Due%20Today').followUpState).toBe('Due Today')
        expect(filtersFromSearch('?followUpState=Later').followUpState).toBe('')
    })

    test('?assignedTo= is a user id, or nothing', () => {
        expect(filtersFromSearch('?assignedTo=12').assignedTo).toBe('12')
        expect(filtersFromSearch('?assignedTo=0').assignedTo).toBe('')
        expect(filtersFromSearch('?assignedTo=abc').assignedTo).toBe('')
        expect(searchWithFilters('?stage=new', { stage: 'new', followUpState: '', assignedTo: '4' })).toBe(
            '?stage=new&assignedTo=4'
        )
        expect(searchWithFilters('?assignedTo=4', { stage: 'all', followUpState: '', assignedTo: '' })).toBe('')
    })

    test('choosing a step writes ?stage= and drops ?status=', () => {
        expect(searchWithFilters('?status=Confirmed', { stage: 'new', followUpState: '' })).toBe('?stage=new')
        expect(searchWithFilters('?stage=new&x=1', { stage: 'all', followUpState: 'Overdue' })).toBe(
            '?x=1&followUpState=Overdue'
        )
        expect(searchWithFilters('?stage=new', { stage: 'all', followUpState: '' })).toBe('')
    })
})

describe('queries', () => {
    test('the step and follow-up go on the table query', () => {
        expect(withLeadFilters('?start=0&length=10', { stage: 'sent', followUpState: '' })).toBe(
            '?start=0&length=10&stage=sent'
        )
        expect(withLeadFilters('?start=0', { stage: 'all', followUpState: 'Due Today' })).toBe(
            '?start=0&followUpState=Due+Today'
        )
        expect(withLeadFilters('?start=0', { stage: 'all', followUpState: '' })).toBe('?start=0')
        expect(withLeadFilters('?start=0', { stage: 'new', followUpState: '', assignedTo: '7' })).toBe(
            '?start=0&stage=new&assignedTo=7'
        )
        expect(withLeadFilters('', { stage: 'new', followUpState: '' })).toBe('?stage=new')
    })

    test('export all asks from the first row, without the export flags', () => {
        const query = withPaging('?start=20&length=10&search%5Bvalue%5D=asha&stage=new&export=true&ext=csv', 0, 57)
        const params = new URLSearchParams(query.slice(1))
        expect(params.get('start')).toBe('0')
        expect(params.get('length')).toBe('57')
        expect(params.get('search[value]')).toBe('asha')
        expect(params.get('stage')).toBe('new')
        expect(params.has('export')).toBe(false)
    })
})

describe('dates', () => {
    const now = new Date(2026, 9, 11, 12, 0)

    test('short dates leave out this year', () => {
        expect(shortDate(new Date(2026, 9, 2, 9, 0), now)).toBe('2 Oct')
        expect(shortDate(new Date(2025, 11, 31), now)).toBe('31 Dec 2025')
        expect(shortDate(null, now)).toBe('')
        expect(shortDate('not a date', now)).toBe('')
    })

    test('times read like a person writes them', () => {
        expect(clockTime(new Date(2026, 9, 12, 15, 0))).toBe('3:00 pm')
        expect(clockTime(new Date(2026, 9, 12, 0, 5))).toBe('12:05 am')
        expect(clockTime(new Date(2026, 9, 12, 12, 30))).toBe('12:30 pm')
        expect(fullDateTime(new Date(2026, 9, 12, 9, 7))).toBe('12 Oct 2026, 9:07 am')
    })

    test('relative times', () => {
        const ago = ms => new Date(now.getTime() - ms)
        const minute = 60 * 1000
        expect(relativeTime(ago(10 * 1000), now)).toBe('just now')
        expect(relativeTime(ago(minute), now)).toBe('1 minute ago')
        expect(relativeTime(ago(5 * minute), now)).toBe('5 minutes ago')
        expect(relativeTime(ago(3 * 60 * minute), now)).toBe('3 hours ago')
        expect(relativeTime(ago(26 * 60 * minute), now)).toBe('yesterday')
        expect(relativeTime(ago(3 * 24 * 60 * minute), now)).toBe('3 days ago')
        expect(relativeTime(ago(65 * 24 * 60 * minute), now)).toBe('2 months ago')
        expect(relativeTime(ago(800 * 24 * 60 * minute), now)).toBe('2 years ago')
        expect(relativeTime(undefined, now)).toBe('')
    })

    test('the line under the step chip', () => {
        const call = new Date(2026, 9, 12, 15, 0)
        const sent = new Date(2026, 9, 2, 10, 0)
        expect(stageDetail({ stage: 'sent', quoteSentAt: sent }, now)).toBe('Quote sent 2 Oct')
        expect(stageDetail({ stage: 'sent', quoteSentAt: sent, nextCallAt: call }, now)).toBe(
            'Next call 12 Oct 3:00 pm'
        )
        expect(stageDetail({ stage: 'booked', quoteSentAt: sent, nextCallAt: call }, now)).toBe('Quote sent 2 Oct')
        expect(stageDetail({ stage: 'verified' }, now)).toBe('Ready for a quotation')
        expect(stageDetail({ stage: 'new' }, now)).toBe('Not verified yet')
    })
})

describe('csv', () => {
    test('a header row, quoted cells, and no formulas', () => {
        const csv = leadsCsv([
            {
                leadNo: 'L-1',
                fullName: 'Asha, R',
                phone: '+919876543210',
                senderEmail: '=cmd',
                campaignName: '+SUM(A1)',
                stage: 'sent'
            }
        ])
        const [head, line] = csv.split('\r\n')
        expect(head.startsWith('Lead no.,Name,Phone')).toBe(true)
        expect(line).toContain('"Asha, R"')
        expect(line).toContain(',+919876543210,')
        expect(line).toContain("'=cmd")
        expect(line).toContain("'+SUM(A1)")
        expect(line).toContain('Quote sent')
    })

    test('a sent quote the guest opened says so, so the team knows when to call', () => {
        const now = new Date(2026, 9, 11, 12, 0)
        const sent = new Date(2026, 9, 2, 10, 0)
        const opened = new Date(now.getTime() - 2 * 60 * 60 * 1000)
        expect(stageDetail({ stage: 'sent', quoteSentAt: sent, quoteViewedAt: opened, quoteViews: 1 }, now)).toBe(
            'Quote opened 2 hours ago'
        )
        expect(stageDetail({ stage: 'sent', quoteSentAt: sent, quoteViewedAt: opened, quoteViews: 3 }, now)).toBe(
            'Quote opened 2 hours ago · 3 times'
        )
        // ? a booked lead shows its booking, and a booked call still comes first
        expect(stageDetail({ stage: 'booked', quoteSentAt: sent, quoteViewedAt: opened, quoteViews: 3 }, now)).toBe(
            'Quote sent 2 Oct'
        )
        expect(quoteOpened({ quoteViewedAt: opened, quoteViews: 2 })).toBe(true)
        expect(quoteOpened({ quoteViewedAt: null, quoteViews: 0 })).toBe(false)
    })
})
