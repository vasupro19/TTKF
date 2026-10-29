/**
 * The mail templates' calls: the addresses and bodies the backend contract names, that a save or a reset puts the kind the server
 * returns into the list at once (and the list loads again after), and what a refusal looks like to the screen.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

vi.stubEnv('VITE_APP_BASE_URL', 'http://api.test/v1/')

const kind = (greeting, customised) => ({
    key: 'guest_receipt',
    label: 'Payment receipt to the guest',
    audience: 'guest',
    customised,
    slots: [{ key: 'greeting', label: 'Greeting', default: 'Dear {guest_name},', value: greeting, customised }],
    placeholders: []
})

// ? the real API slice and a real store, with only the network faked
const setup = async () => {
    const { apiSliceConfig } = await import('./configSlice')
    const { getMailTemplates, saveMailTemplate, resetMailTemplate, previewMailTemplate, saveMailTheme, getMailThemes } =
        (await import('./mailTemplateSlice')).mailTemplateSlice.endpoints
    const store = configureStore({
        reducer: { [apiSliceConfig.reducerPath]: apiSliceConfig.reducer },
        middleware: getDefault =>
            getDefault({ serializableCheck: false, immutableCheck: false }).concat(apiSliceConfig.middleware)
    })
    const cached = () => getMailTemplates.select()(store.getState()).data?.data?.kinds
    return {
        store,
        cached,
        getMailTemplates,
        saveMailTemplate,
        resetMailTemplate,
        previewMailTemplate,
        saveMailTheme,
        getMailThemes
    }
}

const calls = []
// ? what the server will say for each call: { status, body, hold? } — `hold` is a promise the answer waits for
const replies = {}
const fakeNetwork = () => {
    calls.length = 0
    Object.keys(replies).forEach(name => delete replies[name])
    // ? jsdom's AbortSignal is not the one Node's Request wants: the slice only needs to hand the address, method and body on
    vi.stubGlobal(
        'Request',
        class {
            constructor(url, init = {}) {
                this.url = String(url)
                this.method = init.method || 'GET'
                this.headers = new Headers(init.headers)
                this.body = init.body
            }

            clone() {
                return this
            }
        }
    )
    vi.stubGlobal(
        'fetch',
        vi.fn(async request => {
            const path = new URL(request.url).pathname
            calls.push({ method: request.method, path, body: request.body ? JSON.parse(request.body) : undefined })
            const reply = replies[`${request.method} ${path}`] || { status: 200, body: { success: true, data: {} } }
            if (reply.hold) await reply.hold
            return new Response(JSON.stringify(reply.body), {
                status: reply.status,
                headers: { 'Content-Type': 'application/json' }
            })
        })
    )
}
const summary = () => calls.map(call => `${call.method} ${call.path}`)
const held = () => {
    let release
    const hold = new Promise(resolve => {
        release = resolve
    })
    return { hold, release }
}
const settle = () =>
    new Promise(resolve => {
        setTimeout(resolve, 60)
    })

beforeEach(fakeNetwork)
afterEach(() => vi.unstubAllGlobals())

describe('the calls', () => {
    test('the list, a save, a reset and a preview go where the contract says, with its bodies', async () => {
        const { store, getMailTemplates, saveMailTemplate, resetMailTemplate, previewMailTemplate } = await setup()
        await store.dispatch(getMailTemplates.initiate())
        await store.dispatch(
            saveMailTemplate.initiate({ kind: 'guest_receipt', slots: { greeting: 'Hi', footer: null } })
        )
        await store.dispatch(resetMailTemplate.initiate({ kind: 'guest_receipt' }))
        await store.dispatch(previewMailTemplate.initiate({ kind: 'guest_receipt', slots: { greeting: 'Hi' } }))
        // ? the list loads again after a change, so the calls are looked up by what they are, not by their place
        const call = (method, path) => calls.find(item => item.method === method && item.path === path)
        expect(call('GET', '/v1/mail-templates')).toBeDefined()
        expect(call('PUT', '/v1/mail-templates/guest_receipt').body).toEqual({
            slots: { greeting: 'Hi', footer: null }
        })
        expect(call('DELETE', '/v1/mail-templates/guest_receipt')).toBeDefined()
        expect(call('POST', '/v1/mail-templates/guest_receipt/preview').body).toEqual({ slots: { greeting: 'Hi' } })
    })

    test('themes: the list for send dialogs, a theme saved for all or one kind, a preview in a theme', async () => {
        const { store, getMailThemes, saveMailTheme, previewMailTemplate } = await setup()
        await store.dispatch(getMailThemes.initiate())
        await store.dispatch(saveMailTheme.initiate({ kind: 'all', theme: 'coastal' }))
        await store.dispatch(saveMailTheme.initiate({ kind: 'voucher', theme: null }))
        await store.dispatch(previewMailTemplate.initiate({ kind: 'voucher', slots: {}, theme: 'minimal' }))
        const call = (method, path) => calls.find(item => item.method === method && item.path === path)
        expect(call('GET', '/v1/mail-templates/themes')).toBeDefined()
        expect(call('PUT', '/v1/mail-templates/all/theme').body).toEqual({ theme: 'coastal' })
        expect(call('PUT', '/v1/mail-templates/voucher/theme').body).toEqual({ theme: null })
        expect(call('POST', '/v1/mail-templates/voucher/preview').body).toEqual({ slots: {}, theme: 'minimal' })
    })

    test('a kind’s key is made safe for the address', async () => {
        const { store, saveMailTemplate } = await setup()
        await store.dispatch(saveMailTemplate.initiate({ kind: 'odd/key', slots: {} }))
        expect(calls[0].path).toBe('/v1/mail-templates/odd%2Fkey')
    })
})

describe('after a change', () => {
    test('a save puts the kind the server returns into the list at once, and the list loads again', async () => {
        replies['GET /v1/mail-templates'] = {
            status: 200,
            body: { success: true, data: { kinds: [kind('Dear {guest_name},', false)] } }
        }
        replies['PUT /v1/mail-templates/guest_receipt'] = {
            status: 200,
            body: { success: true, data: kind('Hi {guest_name},', true) }
        }
        const { store, cached, getMailTemplates, saveMailTemplate } = await setup()
        await store.dispatch(getMailTemplates.initiate())
        expect(cached()[0].slots[0].value).toBe('Dear {guest_name},')

        // ? the list's answer to the reload is held back, so what is seen meanwhile is the saved kind from the save's own answer
        const { hold, release } = held()
        replies['GET /v1/mail-templates'] = {
            status: 200,
            hold,
            body: { success: true, data: { kinds: [kind('Hi {guest_name},', true)] } }
        }
        await store.dispatch(
            saveMailTemplate.initiate({ kind: 'guest_receipt', slots: { greeting: 'Hi {guest_name},' } })
        )
        await settle()
        expect(summary().filter(call => call === 'GET /v1/mail-templates')).toHaveLength(2)
        expect(cached()[0]).toMatchObject({ customised: true, slots: [{ value: 'Hi {guest_name},' }] })
        release()
        await settle()
        expect(cached()[0].slots[0].value).toBe('Hi {guest_name},')
    })

    test('a reset does the same with the kind it returns', async () => {
        replies['GET /v1/mail-templates'] = {
            status: 200,
            body: { success: true, data: { kinds: [kind('Hi {guest_name},', true)] } }
        }
        replies['DELETE /v1/mail-templates/guest_receipt'] = {
            status: 200,
            body: { success: true, data: kind('Dear {guest_name},', false) }
        }
        const { store, cached, getMailTemplates, resetMailTemplate } = await setup()
        await store.dispatch(getMailTemplates.initiate())
        const { hold, release } = held()
        replies['GET /v1/mail-templates'] = {
            status: 200,
            hold,
            body: { success: true, data: { kinds: [kind('Dear {guest_name},', false)] } }
        }
        await store.dispatch(resetMailTemplate.initiate({ kind: 'guest_receipt' }))
        await settle()
        expect(cached()[0]).toMatchObject({ customised: false, slots: [{ value: 'Dear {guest_name},' }] })
        release()
        await settle()
    })

    test('a refusal changes nothing in the list, and the screen gets the server’s per-slot messages', async () => {
        replies['GET /v1/mail-templates'] = {
            status: 200,
            body: { success: true, data: { kinds: [kind('Dear {guest_name},', false)] } }
        }
        replies['PUT /v1/mail-templates/guest_receipt'] = {
            status: 400,
            body: {
                success: false,
                message: 'Some text can’t be used',
                data: { errors: { greeting: '{guest} is not available here' } }
            }
        }
        const { store, cached, getMailTemplates, saveMailTemplate } = await setup()
        await store.dispatch(getMailTemplates.initiate())
        const result = await store.dispatch(
            saveMailTemplate.initiate({ kind: 'guest_receipt', slots: { greeting: '{guest}' } })
        )
        expect(result.error.status).toBe(400)
        expect(result.error.data.data.errors.greeting).toBe('{guest} is not available here')
        expect(cached()[0].slots[0].value).toBe('Dear {guest_name},')
    })

    test('a 403 and a 409 reach the screen with their status', async () => {
        replies['GET /v1/mail-templates'] = { status: 403, body: { success: false, message: 'Forbidden' } }
        const { store, getMailTemplates } = await setup()
        const forbidden = await store.dispatch(getMailTemplates.initiate())
        expect(forbidden.error.status).toBe(403)

        replies['GET /v1/mail-templates'] = { status: 409, body: { success: false, message: 'Run the upgrade' } }
        const notReady = await store.dispatch(getMailTemplates.initiate(undefined, { forceRefetch: true }))
        expect(notReady.error).toMatchObject({ status: 409, data: { message: 'Run the upgrade' } })
    })
})
