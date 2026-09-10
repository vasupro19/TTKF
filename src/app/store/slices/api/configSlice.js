import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

/**
 * ============================================================================
 *  RTK QUERY BASE CONFIGURATION
 * ============================================================================
 *
 *  Authentication is entirely cookie-based: the API sets httpOnly `-access` and
 *  `-refresh` cookies that JavaScript cannot read, which is why `credentials:
 *  'include'` is essential and why there is no Authorization header here.
 *
 *  WHAT WAS ADDED
 *  --------------
 *  CSRF. Because the cookies are `sameSite: 'none'` (the SPA and API sit on
 *  different origins), the browser attaches them to cross-site requests too —
 *  so any page the user visits could previously POST to this API as them. The
 *  API now requires a double-submit token on every state-changing request:
 *
 *      GET /v1/auth/csrf-token   sets a readable `<APP_NAME>-csrf` cookie
 *      every write               echoes it in the `x-csrf-token` header
 *
 *  An attacker's page cannot read our cookie (different origin), so it cannot
 *  produce a matching header. `prepareHeaders` below does the echoing, and the
 *  401 handler re-fetches the token if it has expired.
 * ============================================================================
 */

const APP_NAME = import.meta.env.VITE_APP_NAME?.replace(/"/g, '') || 'ttk'
const CSRF_COOKIE = `${APP_NAME}-csrf`

/**
 * @description reads a cookie by name
 * @param {string} name
 * @returns {string|null}
 */
function readCookie(name) {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&')}=([^;]*)`))
    return match ? decodeURIComponent(match[1]) : null
}

/**
 * @description fetches a CSRF token and lets the browser store the cookie.
 *              Called after sign-in, and again if a write is rejected for a
 *              missing token.
 * @returns {Promise<string|null>}
 */
export async function ensureCsrfToken() {
    const existing = readCookie(CSRF_COOKIE)
    if (existing) return existing

    try {
        const response = await fetch(`${import.meta.env.VITE_APP_BASE_URL}/auth/csrf-token`, {
            credentials: 'include'
        })

        if (!response.ok) return null

        const payload = await response.json()
        return payload?.data?.csrfToken || readCookie(CSRF_COOKIE)
    } catch {
        // offline or the API is down; the request that needed it will fail with
        // a clear message rather than this throwing here
        return null
    }
}

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export const apiSliceConfig = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_APP_BASE_URL,
        // sends and receives the httpOnly session cookies
        credentials: 'include',
        prepareHeaders: (headers, { type, endpoint, extra, getState, ...rest }) => {
            headers.set('Accept', 'application/json')

            // Only writes need the CSRF token, and only writes are checked
            // server-side (see Middleware/csrf.middleware.js).
            const method = (rest?.arg?.method || '').toUpperCase()

            if (!method || UNSAFE_METHODS.has(method)) {
                const token = readCookie(CSRF_COOKIE)
                if (token) headers.set('x-csrf-token', token)
            }

            return headers
        }
    }),
    // tag types are declared by the slices that inject endpoints
    endpoints: () => ({})
})

export default apiSliceConfig
