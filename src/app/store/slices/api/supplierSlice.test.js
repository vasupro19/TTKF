import { afterEach, describe, expect, test, vi } from 'vitest'
import { store } from '@store'
import { supplierSlice } from './supplierSlice'

/**
 * The suppliers list is asked for two ways: the suppliers table passes '?…', the hotel and transport form
 * 'type=Hotel'. Either way the address has exactly one '?' — it read /suppliers??… or /supplierstype=Hotel.
 */
// ? the address the request is built for (jsdom's Request rejects RTK Query's AbortSignal, so it is stood in for)
const requested = async query => {
    const urls = []
    vi.stubGlobal(
        'Request',
        class {
            constructor(url, init = {}) {
                urls.push(String(url))
                this.url = String(url)
                this.method = init.method || 'GET'
                this.headers = new Headers(init.headers)
            }

            clone() {
                return this
            }
        }
    )
    vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response('{"data":[]}', { headers: { 'Content-Type': 'application/json' } }))
    )
    await store.dispatch(supplierSlice.endpoints.getSuppliers.initiate(query, { forceRefetch: true }))
    return urls[0]
}

afterEach(() => vi.unstubAllGlobals())

describe('the suppliers list address', () => {
    test('from the hotel and transport form', async () => {
        expect(await requested('type=Hotel')).toMatch(/\/suppliers\?type=Hotel$/)
    })

    test('from the suppliers table', async () => {
        expect(await requested('?start=0&length=10')).toMatch(/\/suppliers\?start=0&length=10$/)
    })
})
