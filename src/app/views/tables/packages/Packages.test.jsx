import { useEffect } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import MasterPackagesTable from './index'

const api = vi.hoisted(() => ({ queries: [], reply: { data: [], count: 0 }, removed: [] }))
vi.mock('react-redux', () => ({
    useDispatch: () => action => {
        if (action?.type === 'getPackages') {
            api.queries.push(action.arg)
            return Promise.resolve({ data: api.reply })
        }
        return action
    },
    useSelector: select => select({ loading: {}, auth: { user: { id: 1 }, moduleAccess: new Set() }, modal: {} })
}))
vi.mock('@store/helpers', () => ({ dispatchLoaderEvent: vi.fn() }))
vi.mock('@app/store/slices/snackbar', () => ({
    default: (state = {}) => state,
    openSnackbar: payload => ({ type: 'snackbar', payload })
}))
vi.mock('@/app/store/slices/modalSlice', () => ({
    openModal: () => ({ type: 'open' }),
    closeModal: () => ({ type: 'close' })
}))
vi.mock('@/app/store/slices/api/campaignSlice', () => ({
    useGetCampaignByIdQuery: () => ({ data: { data: { title: 'Kerala Monsoon' } } })
}))
vi.mock('@/app/store/slices/api/packageSlice', () => ({
    getPackageClients: { initiate: arg => ({ type: 'getPackages', arg }) },
    useDeletePackageClientMutation: () => [id => ({ unwrap: () => Promise.resolve(api.removed.push(id) && {}) })]
}))
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
                        <tr key={row.id}>
                            {columns.map(column => (
                                <td key={column.key}>
                                    {column.onClick ? (
                                        <button type='button' onClick={() => column.onClick(row)}>
                                            {row[column.key]}
                                        </button>
                                    ) : (
                                        row[column.key]
                                    )}
                                </td>
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
    default: ({ title, onConfirm, confirmText }) => (
        <div>
            <h2>{title}</h2>
            <button type='button' onClick={onConfirm}>
                {confirmText}
            </button>
        </div>
    )
}))
vi.mock('@/core/components/extended/CreateCSV', () => ({ CSVExport: () => <button type='button'>Export</button> }))
vi.mock('@/core/components/ToggleColumns', () => ({ default: () => null }))

let where = ''
function Spy() {
    const location = useLocation()
    where = location.pathname + location.search
    return null
}
const renderPage = (url = '/master/packages/7') =>
    render(
        <MemoryRouter initialEntries={[url]}>
            <Routes>
                <Route path='/master/packages/:id' element={<MasterPackagesTable />} />
                <Route path='*' element={null} />
            </Routes>
            <Spy />
        </MemoryRouter>
    )

beforeEach(() => {
    api.queries = []
    api.removed = []
    api.reply = {
        data: [{ id: 3, name: 'Munnar 4N', campaignId: 7, campaignTitle: 'Kerala Monsoon', status: 'Active' }],
        count: 1
    }
})

describe('Packages list', () => {
    test('asks for this campaign only, names it, and sends the filters from the address', async () => {
        renderPage('/master/packages/7?active=false&plan=empty')
        await screen.findByText('Munnar 4N')
        expect(screen.getByText(/Campaign: Kerala Monsoon/)).toBeInTheDocument()
        const query = new URLSearchParams(api.queries.at(-1))
        expect(query.get('campaignId')).toBe('7')
        expect(query.get('active')).toBe('false')
        expect(query.get('plan')).toBe('empty')
        expect(query.get('length')).toBe('10')
    })

    test('the package name and the plan button open the day-by-day plan', async () => {
        renderPage()
        fireEvent.click(await screen.findByRole('button', { name: 'Munnar 4N' }))
        expect(where).toBe('/package/activities/7/3')
    })

    test('deleting asks first, then removes that package', async () => {
        renderPage()
        fireEvent.click(await screen.findByRole('button', { name: 'Delete Munnar 4N' }))
        fireEvent.click(screen.getByRole('button', { name: 'Yes, Delete' }))
        await waitFor(() => expect(api.removed).toEqual([3]))
    })

    test('says nothing matches when a filter finds no package', async () => {
        api.reply = { data: [], count: 0 }
        renderPage('/master/packages/7?active=false')
        expect(await screen.findByText(/No packages match these filters/)).toBeInTheDocument()
    })
})
