import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { store } from '@store'
import { setUserDetails } from '@store/slices/auth'
import { apiSliceConfig } from '@store/slices/api/configSlice'
import '@store/slices/api/authApiSlice'
import { beginSignIn, followOtherTabs, markSignedIn, signOut } from './session'

/**
 * Signing out leaves nothing of the session behind: the lists it loaded, any app state, what was saved in the
 * browser — and the page reloads. The next user to sign in on this browser sees only their own data.
 */

// ? a leads list as it sits in the API cache after a page loaded it
const cacheLeads = () =>
    store.dispatch(
        apiSliceConfig.util.upsertQueryData('getAuthUser', 'admin-leads', {
            data: [{ id: 1, fullName: 'Admin’s lead' }]
        })
    )
const cachedQueries = () => Object.keys(store.getState()[apiSliceConfig.reducerPath].queries)

let replace
let reload
beforeEach(() => {
    replace = vi.fn()
    reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, replace, reload })
    window.localStorage.setItem('token', 'active')
    window.localStorage.setItem('clientLocation', '{"1":{}}')
    window.localStorage.setItem('previousRoute', '/process/leads')
    window.localStorage.setItem('sessionUser', '1')
    window.sessionStorage.setItem('draft', 'x')
    store.dispatch(setUserDetails({ user: { id: 1, name: 'Admin', permissions: ['lead:readAll'] } }))
})

afterEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
})

describe('signing out', () => {
    test('clears the cached lists, the user and what the browser kept, then reloads at sign-in', async () => {
        await cacheLeads()
        expect(cachedQueries().length).toBeGreaterThan(0)

        await signOut(() => Promise.resolve())

        expect(cachedQueries()).toEqual([])
        expect(store.getState().auth.isLoggedIn).toBeFalsy()
        expect(store.getState().auth.user).toBeNull()
        ;['token', 'clientLocation', 'previousRoute', 'sessionUser'].forEach(key =>
            expect(window.localStorage.getItem(key)).toBeNull()
        )
        expect(window.sessionStorage.length).toBe(0)
        expect(replace).toHaveBeenCalledWith('/login')
    })

    test('still clears everything when the server’s logout call fails', async () => {
        await cacheLeads()
        await signOut(() => Promise.reject(new Error('Network down')))
        expect(cachedQueries()).toEqual([])
        expect(window.localStorage.getItem('token')).toBeNull()
        expect(replace).toHaveBeenCalledWith('/login')
    })
})

describe('signing in', () => {
    test('starts from an empty cache, and tells other tabs who is signed in', async () => {
        await cacheLeads()
        beginSignIn()
        expect(cachedQueries()).toEqual([])
        markSignedIn({ id: 5 })
        expect(window.localStorage.getItem('sessionUser')).toBe('5')
    })
})

describe('other tabs', () => {
    test('a different account signing in elsewhere reloads this tab; unrelated storage does not', () => {
        const stop = followOtherTabs()
        window.dispatchEvent(new StorageEvent('storage', { key: 'tableId', oldValue: '1', newValue: '2' }))
        expect(reload).not.toHaveBeenCalled()
        window.dispatchEvent(new StorageEvent('storage', { key: 'sessionUser', oldValue: '1', newValue: '5' }))
        expect(reload).toHaveBeenCalledTimes(1)
        window.dispatchEvent(new StorageEvent('storage', { key: 'token', oldValue: 'active', newValue: null }))
        expect(reload).toHaveBeenCalledTimes(2)
        stop()
    })
})
