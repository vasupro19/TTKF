import {
    AccountBalanceWallet,
    AdminPanelSettings,
    Business,
    Campaign,
    CardTravel,
    ContactPhone,
    Dashboard,
    Email,
    Facebook,
    FiberManualRecord,
    FolderSpecial,
    Handshake,
    Hub,
    Inventory2,
    Map as MapIcon,
    People,
    Person,
    Place,
    SupportAgent,
    Work,
    WorkOutline
} from '@mui/icons-material'

// ? The API sends each menu's icon as a name ("BlurOn", "MasterIcon"); drawing that string as a component showed
// ? nothing, so no menu had an icon. Each screen gets its own icon here, by its address.
const ICON_BY_URL = {
    '/dashboard': Dashboard,
    '/master/user': People,
    '/master/client': Business,
    '/master/campaigns': Campaign,
    '/master/destinations': Place,
    '/master/itenary': MapIcon,
    '/master/packages': Inventory2,
    '/master/supplier': Handshake,
    '/master/agent': SupportAgent,
    '/process/leads': ContactPhone,
    '/process/packages': CardTravel,
    '/process/transactions': AccountBalanceWallet,
    '/process/candidates': WorkOutline,
    '/integration/gmail': Email,
    '/integration/facebook': Facebook,
    '/userManagement/role': AdminPanelSettings,
    '/userManagement/user': Person
}

// ? the groups (Master, Process, Integration), by id
const ICON_BY_GROUP = {
    master: FolderSpecial,
    process: Work,
    integration: Hub
}

/**
 * @description the icon component for a menu entry or group from the API; a dot when it is not known
 * @param {{ id?: string, url?: string, path?: string, icon?: unknown }} item
 */
export const menuIconFor = item => {
    if (!item) return FiberManualRecord
    // ? menus built in the app itself may already carry a component
    if (item.icon && typeof item.icon !== 'string') return item.icon
    const url = item.url || item.path
    if (url) {
        const match = Object.keys(ICON_BY_URL)
            .filter(prefix => url === prefix || url.startsWith(`${prefix}/`))
            .sort((a, b) => b.length - a.length)[0]
        if (match) return ICON_BY_URL[match]
    }
    return ICON_BY_GROUP[item.id] || FiberManualRecord
}

export default menuIconFor
