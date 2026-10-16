import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CompanyProfile from './CompanyProfile'

const mocks = vi.hoisted(() => ({
    dispatch: vi.fn(),
    save: vi.fn(),
    company: {
        data: {
            data: {
                canEdit: true,
                company: {
                    id: 1,
                    name: 'Himalayan Trails',
                    email: 'owner@ht.in',
                    phoneNumber: '9876543210',
                    address: 'Manali',
                    website: '',
                    insta: '',
                    logo: ''
                }
            }
        },
        isFetching: false,
        error: null
    }
}))
vi.mock('react-redux', () => ({
    useDispatch: () => mocks.dispatch,
    useSelector: select => select({ auth: { user: { id: 2, clientId: 1, clientName: 'Himalayan Trails' } } })
}))
vi.mock('@/app/store/slices/api/companySlice', () => ({
    useGetCompanyQuery: () => mocks.company,
    useUpdateCompanyMutation: () => [(...args) => ({ unwrap: () => mocks.save(...args) }), { isLoading: false }]
}))
vi.mock('@core/components/extended/MainCard', () => ({
    default: ({ title, children }) => <section aria-label={title}>{children}</section>
}))

beforeEach(() => {
    mocks.dispatch.mockClear()
    mocks.save.mockReset()
    mocks.company.data.data.canEdit = true
})

describe('CompanyProfile', () => {
    it('shows the saved details, with the save button waiting for a change', () => {
        render(<CompanyProfile />)
        expect(screen.getByLabelText('Company name')).toHaveValue('Himalayan Trails')
        expect(screen.getByLabelText('Login email')).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    })

    it('saves an edit, and updates the signed-in user so the menu changes at once', async () => {
        mocks.save.mockResolvedValue({ data: { company: { name: 'HT Holidays', logo: 'http://x.test/l.png' } } })
        render(<CompanyProfile />)
        fireEvent.change(screen.getByLabelText('Company name'), { target: { value: 'HT Holidays' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
        await waitFor(() => expect(mocks.save).toHaveBeenCalled())
        const body = mocks.save.mock.calls[0][0]
        expect(body.get('name')).toBe('HT Holidays')
        const actions = mocks.dispatch.mock.calls.map(call => call[0])
        expect(
            actions.some(
                a => a.payload?.clientName === 'HT Holidays' && a.payload?.clientLogo === 'http://x.test/l.png'
            )
        ).toBe(true)
    })

    it('says what is wrong instead of saving', async () => {
        render(<CompanyProfile />)
        fireEvent.change(screen.getByLabelText('Phone'), { target: { value: 'call me' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
        expect(await screen.findByText(/Enter a phone number/)).toBeInTheDocument()
        expect(mocks.save).not.toHaveBeenCalled()
    })

    it('refuses a logo that is not an image, and shows a chosen one before saving', async () => {
        URL.createObjectURL = vi.fn(() => 'blob:preview')
        URL.revokeObjectURL = vi.fn()
        render(<CompanyProfile />)
        const input = screen.getByTestId('logo-input')
        fireEvent.change(input, { target: { files: [new File(['x'], 'a.pdf', { type: 'application/pdf' })] } })
        expect(await screen.findByText(/PNG, JPG, WebP or GIF/)).toBeInTheDocument()
        fireEvent.change(input, { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } })
        expect(await screen.findByText(/New logo chosen/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled()
    })

    it('is read-only for a user who can’t edit', () => {
        mocks.company.data.data.canEdit = false
        render(<CompanyProfile />)
        expect(screen.getByLabelText('Company name')).toBeDisabled()
        expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull()
        expect(screen.getByText(/Only your agency’s owner or admins/)).toBeInTheDocument()
    })
})
