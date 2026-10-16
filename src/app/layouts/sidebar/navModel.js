// ? The sidebar's sections, order and labels are decided here, by each screen's address — not by the group the API
// ? files a menu under ("Master", "Process"…). The API still decides WHICH screens appear: only the ones it returns.

export const SIDEBAR_WIDTH = 248
export const SIDEBAR_RAIL_WIDTH = 72

export const CAMPAIGNS_URL = '/master/campaigns'
export const CAMPAIGN_ADD_URL = '/master/campaigns/add'

// ? `also`: other addresses that belong to the same screen (its sub-pages live elsewhere)
export const NAV_SECTIONS = [
    { id: 'top', label: null, items: [{ url: '/dashboard', label: 'Dashboard' }] },
    {
        id: 'sales',
        label: 'Sales',
        items: [
            { url: '/process/leads', label: 'Leads', also: ['/process/guest'] },
            { url: '/process/packages', label: 'Bookings' },
            { url: '/process/transactions', label: 'Transactions' },
            { url: '/process/invoices', label: 'Invoices' },
            { url: '/process/incentives', label: 'Incentives' },
            { url: '/process/candidates', label: 'Job Candidates' }
        ]
    },
    {
        id: 'products',
        label: 'Products',
        items: [
            { url: CAMPAIGNS_URL, label: 'Campaigns', campaigns: true },
            { url: '/master/supplier', label: 'Suppliers' },
            { url: '/master/agent', label: 'Agents' }
        ]
    },
    {
        id: 'channels',
        label: 'Lead channels',
        items: [
            { url: '/integration/gmail', label: 'Email Leads' },
            { url: '/integration/facebook', label: 'Facebook Leads' }
        ]
    },
    {
        id: 'setup',
        label: 'Setup',
        items: [
            { url: '/master/user', label: 'Users', also: ['/userManagement/user'] },
            { url: '/userManagement/role', label: 'Roles' },
            { url: '/master/company', label: 'Company' },
            { url: '/master/gst', label: 'GST Settings' },
            { url: '/master/client', label: 'Clients' }
        ]
    }
]

// ? the lists that belong to one campaign: each address ends with the campaign's id
export const CAMPAIGN_SUB_ITEMS = [
    { key: 'campaign:destinations', label: 'Destinations', base: '/master/destinations' },
    { key: 'campaign:itineraries', label: 'Itineraries', base: '/master/itenary' },
    { key: 'campaign:packages', label: 'Packages', base: '/master/packages', also: ['/package/activities'] }
]

export const campaignSubItemUrl = (subItem, campaignId) => `${subItem.base}/${campaignId}`

const trimSlash = url => (url && url.length > 1 ? url.replace(/\/+$/, '') : url)

/**
 * @description every screen in the API's menu (groups with children, at any depth), with the group it came from
 * @param {Array} menus state.auth.menuItems
 * @returns {Array<{ url: string, label: string, group: { id?: string, label?: string } }>}
 */
export const flattenApiMenus = menus => {
    const out = []
    const walk = (items, group) => {
        if (!Array.isArray(items)) return
        items.forEach(item => {
            if (!item) return
            if (Array.isArray(item.children) && item.children.length) {
                walk(item.children, item.url ? group : { id: item.id, label: item.label })
            }
            if (item.url) out.push({ ...item, url: trimSlash(item.url), group })
        })
    }
    walk(menus, {})
    return out
}

/**
 * @description the sidebar's sections from the API's menu: config sections first (in their order, with their labels,
 * holding only screens the API returned), then a section per API group for screens the config does not know.
 * Empty sections are left out.
 * @returns {Array<{ id: string, label: string|null, items: Array<{ key, url, label, also?, campaigns?, apiItem }> }>}
 */
export const buildSections = menus => {
    const apiItems = flattenApiMenus(menus)
    const byUrl = new Map()
    apiItems.forEach(item => {
        if (!byUrl.has(item.url)) byUrl.set(item.url, item)
    })

    const known = new Set()
    const sections = NAV_SECTIONS.map(section => ({
        id: section.id,
        label: section.label,
        items: section.items
            .filter(item => byUrl.has(item.url))
            .map(item => {
                known.add(item.url)
                return { ...item, key: item.url, apiItem: byUrl.get(item.url) }
            })
    }))

    const extra = new Map()
    byUrl.forEach((item, url) => {
        if (known.has(url)) return
        const groupId = item.group?.id || item.group || 'other'
        const groupKey = `api:${typeof groupId === 'string' ? groupId : 'other'}`
        if (!extra.has(groupKey)) {
            extra.set(groupKey, { id: groupKey, label: item.group?.label || 'More', items: [] })
        }
        extra.get(groupKey).items.push({ key: url, url, label: item.label || url, apiItem: item })
    })

    return [...sections, ...extra.values()].filter(section => section.items.length > 0)
}

const matches = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`)

/**
 * @description the key of the sidebar entry for the current address: the entry whose address is the longest prefix
 * of it (campaign sub-items count when the user has Campaigns). Null when none matches.
 */
export const activeKeyFor = (pathname, sections) => {
    const path = trimSlash((pathname || '').split(/[?#]/)[0])
    if (!path) return null
    const candidates = []
    ;(sections || []).forEach(section =>
        section.items.forEach(item => {
            ;[item.url, ...(item.also || [])].forEach(prefix => candidates.push({ prefix, key: item.key }))
            if (item.campaigns) {
                CAMPAIGN_SUB_ITEMS.forEach(sub =>
                    [sub.base, ...(sub.also || [])].forEach(prefix => candidates.push({ prefix, key: sub.key }))
                )
            }
        })
    )
    const best = candidates
        .filter(candidate => matches(path, candidate.prefix))
        .sort((a, b) => b.prefix.length - a.prefix.length)[0]
    return best ? best.key : null
}

export const isCampaignSubKey = key => typeof key === 'string' && key.startsWith('campaign:')

// ? words that sit where a campaign id would, but are pages of their own (/master/packages/add…)
const NOT_AN_ID = new Set(['add', 'edit', 'wizard', 'create', 'view'])

/**
 * @description the campaign a page belongs to, read from its address: /master/destinations/7, /master/itenary/7,
 * /master/packages/7, /package/activities/7/12 → '7'. Null for every other page (add/edit pages included).
 */
export const campaignIdFromPath = pathname => {
    const segments = (pathname || '').split(/[?#]/)[0].split('/').filter(Boolean)
    if (segments[0] === 'master' && ['destinations', 'itenary', 'packages'].includes(segments[1])) {
        const id = segments[2]
        return segments.length === 3 && id && !NOT_AN_ID.has(id) ? decodeURIComponent(id) : null
    }
    if (segments[0] === 'package' && segments[1] === 'activities' && segments.length === 4) {
        return decodeURIComponent(segments[2])
    }
    return null
}

// ---- the chosen campaign, remembered per agency in this browser ----

export const CAMPAIGN_EVENT = 'ttk:nav-campaign'
const COLLAPSED_KEY = 'ttk.sidebar.collapsed'

export const campaignStorageKey = user => `ttk.sidebar.campaign.${user?.clientId || 'platform'}`

export const readRememberedCampaign = user => {
    try {
        const raw = window.localStorage.getItem(campaignStorageKey(user))
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (parsed && parsed.id !== undefined && parsed.id !== null && parsed.id !== '') {
            return { id: String(parsed.id), title: parsed.title ? String(parsed.title) : '' }
        }
    } catch (error) {
        // ? storage blocked or a broken value: nothing remembered
    }
    return null
}

/**
 * @description remembers the campaign (or forgets it with null) and tells the sidebar
 * @param {object} user state.auth.user
 * @param {{ id: string|number, title?: string } | null} campaign
 */
export const rememberCampaign = (user, campaign) => {
    const value = campaign ? { id: String(campaign.id), title: campaign.title || '' } : null
    try {
        if (value) window.localStorage.setItem(campaignStorageKey(user), JSON.stringify(value))
        else window.localStorage.removeItem(campaignStorageKey(user))
    } catch (error) {
        // ? storage blocked: the sidebar still hears about it below, for this visit
    }
    try {
        window.dispatchEvent(new CustomEvent(CAMPAIGN_EVENT, { detail: value }))
    } catch (error) {
        // ? no window (tests outside jsdom)
    }
    return value
}

export const readCollapsed = () => {
    try {
        return window.localStorage.getItem(COLLAPSED_KEY) === '1'
    } catch (error) {
        return false
    }
}

export const writeCollapsed = collapsed => {
    try {
        window.localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0')
    } catch (error) {
        // ? storage blocked: collapsed only for this visit
    }
}

/** @description the name shown at the top of the sidebar */
export const agencyLogoFor = user => (user?.clientId && user.clientLogo) || ''

export const agencyNameFor = user => {
    if (!user) return ''
    if (!user.clientId) return 'Platform admin'
    return user.clientName || 'Your agency'
}
