import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    CAMPAIGN_EVENT,
    activeKeyFor,
    agencyLogoFor,
    agencyNameFor,
    buildSections,
    campaignIdFromPath,
    flattenApiMenus,
    readCollapsed,
    readRememberedCampaign,
    rememberCampaign,
    writeCollapsed
} from './navModel'

const item = (url, label, group) => ({ id: url, url, label, group, type: 'item', icon: 'BlurOn' })

// ? the shape GET /menu returns (after normalizeMenuItems), in the API's own order and groups
const API_MENU = [
    {
        id: 'master',
        label: 'Master',
        children: [
            item('/dashboard', 'DashBoard', 'master'),
            item('/master/user', 'User', 'master'),
            item('/master/campaigns', 'Campaigns', 'master'),
            item('/master/supplier', 'Supplier', 'master'),
            item('/master/agent', 'Agent', 'master')
        ]
    },
    {
        id: 'process',
        label: 'Process',
        children: [
            item('/process/leads', 'Leads', 'process'),
            item('/process/packages', 'Packages', 'process'),
            item('/process/transactions', 'Transactions', 'process'),
            item('/process/candidates', 'Job Candidates', 'process')
        ]
    },
    {
        id: 'integration',
        label: 'Integration',
        children: [
            item('/integration/gmail', 'Gmail', 'integration'),
            item('/integration/facebook', 'Facebook Leads', 'integration')
        ]
    },
    {
        id: 'userManagement',
        label: 'User Management',
        children: [item('/userManagement/role', 'Role', 'userManagement')]
    }
]

const shape = sections => sections.map(s => [s.label, s.items.map(i => i.label)])

describe('buildSections', () => {
    it('orders and names screens by address, not by the API group', () => {
        expect(shape(buildSections(API_MENU))).toEqual([
            [null, ['Dashboard']],
            ['Sales', ['Leads', 'Bookings', 'Transactions', 'Job Candidates']],
            ['Products', ['Campaigns', 'Suppliers', 'Agents']],
            ['Lead channels', ['Email Leads', 'Facebook Leads']],
            ['Setup', ['Users', 'Roles']]
        ])
    })

    it('shows only screens the API returned, and hides empty sections', () => {
        const sections = buildSections([
            { id: 'process', label: 'Process', children: [item('/process/leads', 'Leads', 'process')] },
            { id: 'master', label: 'Master', children: [item('/master/client', 'Client', 'master')] }
        ])
        expect(shape(sections)).toEqual([
            ['Sales', ['Leads']],
            ['Setup', ['Clients']]
        ])
    })

    it('puts a screen the config does not know under its API group, with its API label', () => {
        const sections = buildSections([
            ...API_MENU,
            { id: 'reports', label: 'Reports', children: [item('/reports/sales/', 'Sales report', 'reports')] }
        ])
        expect(shape(sections).at(-1)).toEqual(['Reports', ['Sales report']])
        expect(sections.at(-1).items[0].url).toBe('/reports/sales')
    })

    it('copes with no menu yet, nested groups and duplicates', () => {
        expect(buildSections(undefined)).toEqual([])
        expect(buildSections(null)).toEqual([])
        const nested = [
            {
                id: 'process',
                label: 'Process',
                children: [
                    { id: 'sub', label: 'Sub', children: [item('/process/leads', 'Leads')] },
                    item('/process/leads', 'Leads')
                ]
            }
        ]
        expect(flattenApiMenus(nested)).toHaveLength(2)
        expect(shape(buildSections(nested))).toEqual([['Sales', ['Leads']]])
    })
})

describe('activeKeyFor', () => {
    const sections = buildSections(API_MENU)
    it.each([
        ['/dashboard', '/dashboard'],
        ['/process/leads', '/process/leads'],
        ['/process/leads/add', '/process/leads'],
        ['/process/guest/add/12', '/process/leads'],
        ['/process/packages/44', '/process/packages'],
        ['/master/campaigns/edit/3', '/master/campaigns'],
        ['/master/destinations/7', 'campaign:destinations'],
        ['/master/destinations/edit/5', 'campaign:destinations'],
        ['/master/itenary/add', 'campaign:itineraries'],
        ['/master/packages/wizard', 'campaign:packages'],
        ['/package/activities/7/12', 'campaign:packages'],
        ['/userManagement/user/create', '/master/user'],
        ['/userManagement/role/9', '/userManagement/role'],
        ['/master/user/', '/master/user']
    ])('%s → %s', (path, key) => {
        expect(activeKeyFor(path, sections)).toBe(key)
    })

    it('matches whole segments only, and nothing for unknown pages', () => {
        expect(activeKeyFor('/process/leadsx', sections)).toBeNull()
        expect(activeKeyFor('/somewhere', sections)).toBeNull()
        expect(activeKeyFor('/master/client', sections)).toBeNull() // not returned by the API for this user
    })

    it('does not light campaign lists for a user without Campaigns', () => {
        const noCampaigns = buildSections([{ id: 'process', children: [item('/process/leads', 'Leads')] }])
        expect(activeKeyFor('/master/destinations/7', noCampaigns)).toBeNull()
    })
})

describe('campaignIdFromPath', () => {
    it.each([
        ['/master/destinations/7', '7'],
        ['/master/itenary/12', '12'],
        ['/master/packages/3', '3'],
        ['/package/activities/7/99', '7'],
        ['/master/destinations/add', null],
        ['/master/destinations/edit/5', null],
        ['/master/packages/wizard', null],
        ['/master/packages/edit/4', null],
        ['/package/activities/99', null],
        ['/master/campaigns/edit/7', null],
        ['/process/leads', null],
        ['', null],
        [undefined, null]
    ])('%s → %s', (path, id) => {
        expect(campaignIdFromPath(path)).toBe(id)
    })
})

describe('remembered campaign and collapsed state', () => {
    afterEach(() => {
        window.localStorage.clear()
        vi.restoreAllMocks()
    })

    it('remembers a campaign per agency and tells the sidebar', () => {
        const heard = vi.fn()
        window.addEventListener(CAMPAIGN_EVENT, heard)
        rememberCampaign({ clientId: 5 }, { id: 7, title: 'Bali' })
        window.removeEventListener(CAMPAIGN_EVENT, heard)
        expect(readRememberedCampaign({ clientId: 5 })).toEqual({ id: '7', title: 'Bali' })
        expect(readRememberedCampaign({ clientId: 6 })).toBeNull()
        expect(heard.mock.calls[0][0].detail).toEqual({ id: '7', title: 'Bali' })
        rememberCampaign({ clientId: 5 }, null)
        expect(readRememberedCampaign({ clientId: 5 })).toBeNull()
    })

    it('ignores broken values and blocked storage', () => {
        window.localStorage.setItem('ttk.sidebar.campaign.5', '{nope')
        expect(readRememberedCampaign({ clientId: 5 })).toBeNull()
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('blocked')
        })
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('blocked')
        })
        expect(readRememberedCampaign({ clientId: 5 })).toBeNull()
        expect(readCollapsed()).toBe(false)
        expect(() => writeCollapsed(true)).not.toThrow()
        expect(rememberCampaign({ clientId: 5 }, { id: 1, title: 'X' })).toEqual({ id: '1', title: 'X' })
    })

    it('remembers collapsed', () => {
        writeCollapsed(true)
        expect(readCollapsed()).toBe(true)
        writeCollapsed(false)
        expect(readCollapsed()).toBe(false)
    })
})

describe('agencyNameFor', () => {
    it('names the agency, or the platform admin', () => {
        expect(agencyNameFor({ clientId: 5, clientName: 'Acme Tours' })).toBe('Acme Tours')
        expect(agencyNameFor({ clientId: null })).toBe('Platform admin')
        expect(agencyNameFor(null)).toBe('')
    })
})

describe('agencyLogoFor', () => {
    it('is the agency’s logo for an agency user, and nothing for the platform admin or a user without one', () => {
        expect(agencyLogoFor({ clientId: 5, clientLogo: 'http://x.test/l.png' })).toBe('http://x.test/l.png')
        expect(agencyLogoFor({ clientId: 5 })).toBe('')
        expect(agencyLogoFor({ clientLogo: 'http://x.test/l.png' })).toBe('')
        expect(agencyLogoFor(null)).toBe('')
    })
})
