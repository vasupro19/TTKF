import { describe, expect, it } from 'vitest'
import { Dashboard, Email, FiberManualRecord, FolderSpecial, People } from '@mui/icons-material'
import { menuIconFor } from './menuIcons'

describe('menuIconFor', () => {
    it('gives each screen its own icon by its address, not the name the API sends', () => {
        expect(menuIconFor({ url: '/dashboard', icon: 'BlurOn' })).toBe(Dashboard)
        expect(menuIconFor({ url: '/master/user', icon: 'BlurOn' })).toBe(People)
        expect(menuIconFor({ url: '/integration/gmail', icon: 'Memory' })).toBe(Email)
    })

    it('gives the groups an icon, and an unknown screen a dot', () => {
        expect(menuIconFor({ id: 'master', icon: 'MasterIcon' })).toBe(FolderSpecial)
        expect(menuIconFor({ url: '/something/new', icon: 'BlurOn' })).toBe(FiberManualRecord)
    })

    it('keeps an icon component a menu already has', () => {
        function Custom() {
            return null
        }
        expect(menuIconFor({ url: '/dashboard', icon: Custom })).toBe(Custom)
    })
})
