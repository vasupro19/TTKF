/**
 * The suppliers list must load again after a supplier is added or changed. It did not: the list was cached under the tag
 * 'getSuppliers' while adding one invalidated 'createSuppliers', so a new supplier never appeared until the page was reloaded.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

vi.stubEnv('VITE_APP_BASE_URL', 'http://api.test/v1/')

// ? the real API slice and a real store, with only the network faked
const setup = async () => {
    const { apiSliceConfig } = await import('./configSlice')
    const { getSuppliers, createSuppliers, updateSupplier, importSuppliers } = (await import('./supplierSlice'))
        .supplierSlice.endpoints
    const store = configureStore({
        reducer: { [apiSliceConfig.reducerPath]: apiSliceConfig.reducer },
        middleware: getDefault =>
            getDefault({ serializableCheck: false, immutableCheck: false }).concat(apiSliceConfig.middleware)
    })
    return { store, getSuppliers, createSuppliers, updateSupplier, importSuppliers }
}

const calls = []
const fakeNetwork = () => {
    calls.length = 0
    // ? jsdom's AbortSignal is not the one Node's Request wants: the slice only needs to hand a url and method on
    vi.stubGlobal(
        'Request',
        class {
            constructor(url, init = {}) {
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
        vi.fn(async request => {
            calls.push(`${request.method} ${new URL(request.url).pathname}`)
            return new Response(
                JSON.stringify({ success: true, status_code: 200, data: [], count: 0, message: 'ok' }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        })
    )
}
const lists = () => calls.filter(call => call === 'GET /v1/suppliers').length
const settle = () =>
    new Promise(resolve => {
        setTimeout(resolve, 60)
    })

beforeEach(fakeNetwork)
afterEach(() => vi.unstubAllGlobals())

describe('the suppliers list after a change', () => {
    test('a supplier added makes the list load again', async () => {
        const { store, getSuppliers, createSuppliers } = await setup()
        await store.dispatch(getSuppliers.initiate('?start=0&length=10'))
        expect(lists()).toBe(1)
        await store.dispatch(
            createSuppliers.initiate({ businessname: 'Hotel Snowline', type: 'Hotel', phone: '9876543210' })
        )
        await settle()
        expect(lists()).toBe(2)
    })

    test('a supplier changed makes the list load again', async () => {
        const { store, getSuppliers, updateSupplier } = await setup()
        await store.dispatch(getSuppliers.initiate('?start=0&length=10'))
        await store.dispatch(updateSupplier.initiate({ id: 5, city: 'Kasol' }))
        await settle()
        expect(lists()).toBe(2)
    })

    test('suppliers imported make it load again — but a check that saves nothing does not', async () => {
        const { store, getSuppliers, importSuppliers } = await setup()
        await store.dispatch(getSuppliers.initiate('?start=0&length=10'))
        await store.dispatch(importSuppliers.initiate({ rows: [{ row: 2 }], dryRun: true }))
        await settle()
        expect(lists()).toBe(1)
        await store.dispatch(importSuppliers.initiate({ rows: [{ row: 2 }] }))
        await settle()
        expect(lists()).toBe(2)
        expect(calls).toContain('POST /v1/suppliers/import')
    })

    test('the list page asks the server every time it is shown: an answer cached earlier is not reused', async () => {
        const { store, getSuppliers } = await setup()
        await store.dispatch(getSuppliers.initiate('?start=0&length=10', { forceRefetch: true }))
        await store.dispatch(getSuppliers.initiate('?start=0&length=10', { forceRefetch: true }))
        expect(lists()).toBe(2)
    })

    test('whereas without that, the first answer is served again — which is how a new row stayed hidden', async () => {
        const { store, getSuppliers } = await setup()
        await store.dispatch(getSuppliers.initiate('?start=0&length=10', false))
        await store.dispatch(getSuppliers.initiate('?start=0&length=10', false))
        expect(lists()).toBe(1)
    })
})
