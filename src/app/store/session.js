import { store, persistor } from '@store'
import { logout } from '@store/slices/auth'
import { apiSliceConfig } from '@store/slices/api/configSlice'
import { LOCAL_STORAGE_KEYS } from '@/hooks/useLocalStorage'

/**
 * ============================================================================
 *  ONE SIGNED-IN USER PER BROWSER, AND NOTHING LEFT BEHIND
 * ============================================================================
 *
 *  Every list the app loads (leads, bookings, users…) is kept in the RTK Query
 *  cache. Signing out used to reset only the user's name and permissions — the
 *  cache stayed, so the next person to sign in on the same browser saw the
 *  previous user's leads until a refresh fetched theirs. And if the server's
 *  logout call failed, nothing was cleared at all.
 *
 *  Now:
 *   - signing out clears the cache, every slice of app state, what is saved in
 *     the browser (redux-persist, session marker, remembered location/route),
 *     and then reloads the page, so nothing from the session stays in memory
 *     either — not even a request still on its way back. The server call is
 *     made, but its failure doesn't stop any of this.
 *   - signing in starts from an empty cache too.
 *   - other open tabs follow: when another user signs in, or the user signs
 *     out, in one tab, the others reload instead of showing the old session.
 * ============================================================================
 */

// ? what is remembered in the browser for a session; cleared on sign-out
const SESSION_KEYS = [
    LOCAL_STORAGE_KEYS.token,
    LOCAL_STORAGE_KEYS.previousRoute,
    LOCAL_STORAGE_KEYS.clientLocation,
    LOCAL_STORAGE_KEYS.tableId,
    LOCAL_STORAGE_KEYS.sessionUser
]

const removeKeys = () => {
    SESSION_KEYS.forEach(key => {
        try {
            window.localStorage.removeItem(key)
        } catch (error) {
            // storage blocked: nothing saved to remove
        }
    })
    try {
        window.sessionStorage.clear()
    } catch (error) {
        // as above
    }
}

/** @description empties every cached API answer and every slice of app state */
export const clearAppState = () => {
    store.dispatch(apiSliceConfig.util.resetApiState())
    // ? the root reducer resets every slice on logout (store/reducers.js)
    store.dispatch(logout())
}

/**
 * @description signs out completely, then reloads at the sign-in page
 * @param {Function} [callServer] ends the session on the API (clears its cookies); its failure doesn't stop the rest
 * @param {string} [to] where to land
 */
export const signOut = async (callServer = null, to = '/login') => {
    try {
        if (callServer) await callServer()
    } catch (error) {
        // the cookies may already be gone; everything here is cleared regardless
    } finally {
        clearAppState()
        removeKeys()
        try {
            await persistor.purge()
        } catch (error) {
            // nothing persisted
        }
        window.location.replace(to)
    }
}

/** @description before a sign-in: nothing from an earlier session may show in the new one */
export const beginSignIn = () => {
    clearAppState()
}

/** @description after a sign-in: tells other tabs who is signed in now */
export const markSignedIn = user => {
    try {
        window.localStorage.setItem(LOCAL_STORAGE_KEYS.sessionUser, String(user?.id ?? ''))
    } catch (error) {
        // storage blocked: other tabs can't be told
    }
}

/**
 * @description reloads this tab when another tab signs in as someone else or signs out
 * @returns {Function} stops listening
 */
export const followOtherTabs = () => {
    const onStorage = event => {
        if (event.key !== LOCAL_STORAGE_KEYS.sessionUser && event.key !== LOCAL_STORAGE_KEYS.token) return
        if (event.oldValue === event.newValue) return
        // ? another account, or signed out: what this tab shows is no longer this browser's session
        window.location.reload()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
}
