import { useEffect } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { HowLeadsWork, LeadProcessBar, LeadRowActions } from './leadParts'
import MasterLeadsTable from './index'

const api = vi.hoisted(() => ({
    queries: [],
    reply: { data: [], count: 0, summary: { stages: {}, total: 0 } },
    updates: [],
    snackbars: [],
    access: new Set(),
    people: []
}))
vi.mock('react-redux', () => ({
    useDispatch: () => action => {
        if (action?.type === 'getLeads') {
            api.queries.push(action.arg)
            return Promise.resolve({ data: api.reply })
        }
        if (action?.type === 'snackbar') api.snackbars.push(action.payload.message)
        return action
    },
    useSelector: select => select({ loading: {}, auth: { user: { id: 1 }, moduleAccess: api.access }, modal: {} })
}))
vi.mock('@app/store/slices/snackbar', () => ({ openSnackbar: payload => ({ type: 'snackbar', payload }) }))
vi.mock('@/app/store/slices/api/leadSlice', () => ({
    useGetAssigneesQuery: () => ({ data: { data: api.people } }),
    getLeads: { initiate: arg => ({ type: 'getLeads', arg }) },
    getLeadTimeline: { initiate: arg => ({ type: 'timeline', arg }) },
    useDeleteLeadMutation: () => [() => ({ unwrap: () => Promise.resolve({}) })],
    useUpdateLeadMutation: () => [
        payload => ({
            unwrap: () => {
                api.updates.push(payload)
                return Promise.resolve({})
            }
        })
    ]
}))
// ? the shared table: asks for the first page when drawn, then shows each row's cells and actions
vi.mock('@core/components/extended/table/Table', () => ({
    default: function FakeTable({ data, columns, queryHandler, renderAction }) {
        useEffect(() => {
            queryHandler('?start=0&length=10')
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [])
        return (
            <table>
                <tbody>
                    {data.map(row => (
                        <tr key={row.id} data-testid={`row-${row.id}`}>
                            {columns.map(column => (
                                <td key={column.key}>{row[column.key]}</td>
                            ))}
                            <td>{renderAction(row)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )
    }
}))
vi.mock('@/core/components/modals/ConfirmModal', () => ({
    default: ({ title, message, confirmText, onConfirm }) => (
        <div data-testid='confirm'>
            <h2>{title}</h2>
            <div>{message}</div>
            <button type='button' onClick={onConfirm}>
                {confirmText}
            </button>
        </div>
    )
}))
vi.mock('@/core/components/extended/CreateCSV', () => ({ CSVExport: () => <button type='button'>Export</button> }))
vi.mock('@/core/components/ToggleColumns', () => ({ default: () => null }))

const lead = (id, stage, extra = {}) => ({
    id,
    fullName: `Guest ${id}`,
    leadNo: `L-${id}`,
    phone: '+919876543210',
    senderEmail: `g${id}@example.com`,
    leadSource: 'Facebook',
    stage,
    followUpState: 'Overdue',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    ...extra
})

let currentSearch = ''
let currentPath = ''
function SearchSpy() {
    const location = useLocation()
    currentSearch = location.search
    currentPath = location.pathname
    return null
}

const renderPage = (url = '/process/leads') =>
    render(
        <MemoryRouter initialEntries={[url]}>
            <Routes>
                <Route path='/process/leads' element={<MasterLeadsTable />} />
            </Routes>
            <SearchSpy />
        </MemoryRouter>
    )

beforeEach(() => {
    api.queries = []
    api.updates = []
    api.snackbars = []
    api.access = new Set()
    api.people = []
    window.localStorage.clear()
})

describe('process bar', () => {
    test('shows each step with its count and hint, and picks one', () => {
        const onSelect = vi.fn()
        render(
            <LeadProcessBar
                stages={{ new: 4, verified: 2, quoting: 1, sent: 3, booked: 5 }}
                total={15}
                selected='sent'
                onSelect={onSelect}
            />
        )
        const sent = screen.getByRole('button', { name: /Step 4: Quote sent, 3 leads/ })
        expect(sent).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByText('Follow up, then convert')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /All leads/ })).toHaveTextContent('15')

        fireEvent.click(screen.getByRole('button', { name: /Step 1: New, 4 leads/ }))
        expect(onSelect).toHaveBeenLastCalledWith('new')
        fireEvent.click(sent) // ? the chosen step again goes back to all
        expect(onSelect).toHaveBeenLastCalledWith('all')
    })
})

describe('how leads work', () => {
    test('open the first time, stays closed once closed', () => {
        const { unmount } = render(<HowLeadsWork />)
        expect(screen.getByRole('button', { name: /How leads work/ })).toHaveAttribute('aria-expanded', 'true')
        expect(screen.getByText(/spoken to the guest and the enquiry is real/)).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: /How leads work/ }))
        unmount()
        render(<HowLeadsWork />)
        expect(screen.getByRole('button', { name: /How leads work/ })).toHaveAttribute('aria-expanded', 'false')
    })
})

describe('row actions', () => {
    const handlers = () => ({
        onVerify: vi.fn(),
        onGo: vi.fn(),
        onTimeline: vi.fn(),
        onEdit: vi.fn(),
        onDelete: vi.fn()
    })
    const actions = (row, canEdit, fns) => (
        <LeadRowActions
            row={row}
            canEdit={canEdit}
            onVerify={fns.onVerify}
            onGo={fns.onGo}
            onTimeline={fns.onTimeline}
            onEdit={fns.onEdit}
            onDelete={fns.onDelete}
        />
    )

    test('one button for the next step', () => {
        const fns = handlers()
        const { rerender } = render(actions(lead(3, 'verified'), true, fns))
        fireEvent.click(screen.getByRole('button', { name: 'Build quote' }))
        expect(fns.onGo).toHaveBeenCalledWith('/process/guest/add/3')

        rerender(actions(lead(3, 'booked'), true, fns))
        fireEvent.click(screen.getByRole('button', { name: 'Open booking' }))
        expect(fns.onGo).toHaveBeenCalledWith('/process/packages/3')

        rerender(actions(lead(3, 'new'), true, fns))
        fireEvent.click(screen.getByRole('button', { name: 'Verify' }))
        expect(fns.onVerify).toHaveBeenCalled()
    })

    test('without edit access: no Verify, and only the timeline in the menu', () => {
        const fns = handlers()
        render(actions(lead(3, 'new'), false, fns))
        expect(screen.queryByRole('button', { name: 'Verify' })).toBeNull()
        fireEvent.click(screen.getByRole('button', { name: /More for Guest 3/ }))
        expect(screen.queryByRole('menuitem', { name: 'Edit' })).toBeNull()
        expect(screen.queryByRole('menuitem', { name: 'Delete' })).toBeNull()
        fireEvent.click(screen.getByRole('menuitem', { name: 'View timeline' }))
        expect(fns.onTimeline).toHaveBeenCalled()
    })
})

describe('leads screen', () => {
    test('counts from the server, the step in the query, and the next step after verifying', async () => {
        api.reply = {
            data: [lead(1, 'new'), lead(2, 'sent', { quoteSentAt: new Date(2026, 9, 2).toISOString() })],
            count: 2,
            summary: { stages: { new: 1, verified: 0, quoting: 0, sent: 1, booked: 0 }, total: 2 }
        }
        renderPage()
        await screen.findByTestId('row-1')
        expect(api.queries[0]).toBe('?start=0&length=10')
        expect(screen.getByRole('button', { name: /Step 1: New, 1 lead\./ })).toBeInTheDocument()
        expect(within(screen.getByTestId('row-2')).getByText(/Quote sent 2 Oct/)).toBeInTheDocument()

        // ? choosing a step puts it in the address bar and in the query
        fireEvent.click(screen.getByRole('button', { name: /Step 4: Quote sent/ }))
        await waitFor(() => expect(currentSearch).toBe('?stage=sent'))
        await waitFor(() => expect(api.queries.at(-1)).toBe('?start=0&length=10&stage=sent'))

        // ? verify: the dialog says what it means, then the next step is offered
        fireEvent.click(within(screen.getByTestId('row-1')).getByRole('button', { name: 'Verify' }))
        expect(screen.getByTestId('confirm')).toHaveTextContent(
            "Mark Guest 1 as verified? Do this once you've spoken to the guest and the enquiry is real."
        )
        api.reply = { ...api.reply, data: [lead(1, 'verified'), api.reply.data[1]] }
        fireEvent.click(screen.getByRole('button', { name: 'Mark as verified' }))
        await waitFor(() => expect(api.updates).toEqual([{ id: 1, leadStatus: 'verified', updatedBy: 1 }]))
        expect(await screen.findByText(/Guest 1 is verified/)).toBeInTheDocument()
    })

    test('old dashboard links still filter', async () => {
        api.reply = { data: [lead(1, 'booked')], count: 1, summary: { stages: { booked: 1 }, total: 1 } }
        renderPage('/process/leads?status=Confirmed&followUpState=Overdue')
        await screen.findByTestId('row-1')
        expect(api.queries[0]).toBe('?start=0&length=10&stage=booked&followUpState=Overdue')
        expect(screen.getByRole('button', { name: /Step 5: Booked/ })).toHaveAttribute('aria-pressed', 'true')
    })

    test('first run: ways to get leads in', async () => {
        api.reply = { data: [], count: 0, summary: { stages: {}, total: 0 } }
        renderPage()
        expect(await screen.findByText('No leads yet')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Connect Email Leads' })).toHaveAttribute('href', '/integration/gmail')
        expect(screen.getByRole('link', { name: 'Connect Facebook Leads' })).toHaveAttribute(
            'href',
            '/integration/facebook'
        )
        fireEvent.click(screen.getAllByRole('button', { name: /Add lead/ }).at(-1))
        expect(currentPath).toBe('/process/leads/add')
    })

    test('an empty step says what lands there', async () => {
        api.reply = { data: [], count: 0, summary: { stages: { new: 0 }, total: 3 } }
        renderPage('/process/leads?stage=new')
        expect(
            await screen.findByText(/No new leads — new enquiries from email and Facebook land here/)
        ).toBeInTheDocument()
    })

    test('Assigned to: only for those who see more than one person', async () => {
        api.reply = { data: [lead(1, 'new')], count: 1, summary: { stages: { new: 1 }, total: 1 } }
        api.people = [{ id: 1, name: 'Asha', isMe: true }]
        const { unmount } = renderPage()
        await screen.findByTestId('row-1')
        expect(screen.queryByRole('combobox', { name: /Assigned to/ })).toBeNull()
        unmount()
    })

    test('Assigned to: in the address bar and the query, kept with the step, cleared by Clear filters', async () => {
        api.reply = { data: [lead(1, 'new')], count: 1, summary: { stages: { new: 1 }, total: 1 } }
        api.people = [
            { id: 1, name: 'Asha', isMe: true },
            { id: 4, name: 'Neha', isMe: false }
        ]
        renderPage('/process/leads?stage=new')
        await screen.findByTestId('row-1')
        fireEvent.mouseDown(screen.getByRole('combobox', { name: /Assigned to/ }))
        fireEvent.click(screen.getByRole('option', { name: 'Neha' }))
        await waitFor(() => expect(currentSearch).toBe('?stage=new&assignedTo=4'))
        // ? a new table (first page) asks again with the person
        await waitFor(() => expect(api.queries.at(-1)).toBe('?start=0&length=10&stage=new&assignedTo=4'))

        fireEvent.click(screen.getByRole('button', { name: /Clear filters/ }))
        await waitFor(() => expect(currentSearch).toBe('?stage=new'))
    })

    test('a link with ?assignedTo= opens one person’s leads', async () => {
        api.reply = { data: [lead(1, 'new')], count: 1, summary: { stages: { new: 1 }, total: 1 } }
        api.people = [
            { id: 1, name: 'Asha', isMe: true },
            { id: 4, name: 'Neha', isMe: false }
        ]
        renderPage('/process/leads?assignedTo=4')
        await screen.findByTestId('row-1')
        expect(api.queries[0]).toBe('?start=0&length=10&assignedTo=4')
        expect(screen.getByRole('combobox', { name: /Assigned to/ })).toHaveTextContent('Neha')
    })
})
