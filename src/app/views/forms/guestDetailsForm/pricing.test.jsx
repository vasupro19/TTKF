import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import GuestTourPriceForm from './pricingTour'
import PackageConversion from './packageConvertModal'
import { groupPrice, headCount } from './quote/pricing'

const api = vi.hoisted(() => ({
    price: null,
    savePrices: vi.fn(),
    convert: vi.fn(),
    navigate: vi.fn(),
    // ? GST: what the API says about the agency and about this quote; `setTax` is the call that saves a quote's GST
    gstQuotes: null,
    gstProfile: null,
    setTax: vi.fn()
}))

vi.mock('react-router-dom', async importOriginal => ({ ...(await importOriginal()), useNavigate: () => api.navigate }))

vi.mock('react-redux', () => ({ useDispatch: () => vi.fn() }))
vi.mock('@app/store/slices/snackbar', () => ({ openSnackbar: payload => ({ type: 'snackbar', payload }) }))
vi.mock('@/app/store/slices/api/guestTourPrice', () => ({
    useGetGuestTourPriceQuery: () => ({ data: api.price, isFetching: false }),
    useUpsertGuestTourPriceMutation: () => [
        payload => ({ unwrap: () => Promise.resolve(api.savePrices(payload)) }),
        { isLoading: false }
    ]
}))
vi.mock('@/app/store/slices/api/gstSlice', () => ({
    useGetQuoteTaxesQuery: () => ({ data: api.gstQuotes, isFetching: false }),
    useGetTaxProfileQuery: () => ({ data: api.gstProfile, isFetching: false }),
    useSetQuoteTaxMutation: () => [
        payload => ({ unwrap: () => Promise.resolve(api.setTax(payload)) }),
        { isLoading: false }
    ]
}))
vi.mock('@/app/store/slices/api/packageConvert', () => ({
    useConvertPackageMutation: () => [
        payload => ({ unwrap: () => Promise.resolve(api.convert(payload)) }),
        { isLoading: false }
    ]
}))

beforeEach(() => {
    vi.clearAllMocks()
    api.price = null
    api.gstQuotes = null
    api.gstProfile = null
    api.savePrices.mockImplementation(payload => ({ success: true, data: { priceBasis: payload.priceBasis } }))
    api.convert.mockImplementation(() => ({ success: true }))
})

describe('pricing rules', () => {
    test('a per-person price is multiplied by adults and children; a total is not', () => {
        expect(headCount({ adults: 3, children: 1 })).toBe(4)
        expect(groupPrice('41000', 'perPerson', 4)).toBe(164000)
        expect(groupPrice('164000', 'total', 4)).toBe(164000)
        expect(groupPrice('41000', 'perPerson', 0)).toBe(41000)
        expect(groupPrice('', 'perPerson', 4)).toBe(0)
    })
})

describe('the price form', () => {
    const renderForm = (people = 4) =>
        render(<GuestTourPriceForm tourId={7} quotationNo={2} activeTab={1} guestCategory='Deluxe' people={people} />)

    test('a per-person price shows what the group pays', () => {
        renderForm()
        fireEvent.change(screen.getByLabelText('Deluxe'), { target: { value: '41000' } })
        expect(screen.getByText('Guest’s choice · ₹41,000 per person · ₹1,64,000 for 4')).toBeInTheDocument()
        expect(screen.getByText('4 guests on this trip')).toBeInTheDocument()
    })

    test('prices can be a total for the group, and are saved that way', async () => {
        renderForm()
        fireEvent.click(screen.getByRole('button', { name: 'Total for the group' }))
        fireEvent.change(screen.getByLabelText('Deluxe'), { target: { value: '164000' } })
        expect(screen.getByText('Guest’s choice · ₹1,64,000 for the group')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Save prices' }))
        await waitFor(() =>
            expect(api.savePrices).toHaveBeenCalledWith(
                expect.objectContaining({ leadId: 7, quotationNo: 2, priceBasis: 'total', deluxePrice: '164000' })
            )
        )
    })

    test('a quote saved as a total opens as a total; switching back is a change to save', () => {
        api.price = { data: { deluxePrice: '164000', priceBasis: 'total' } }
        renderForm()
        expect(screen.getByRole('button', { name: 'Total for the group' })).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByRole('status')).toHaveTextContent('Saved')
        fireEvent.click(screen.getByRole('button', { name: 'Per person' }))
        expect(screen.getByRole('status')).toHaveTextContent('Changes not saved')
    })
})

describe('GST on the price form', () => {
    const ready = (over = {}) => {
        api.gstQuotes = {
            data: { ready: true, registered: true, defaultRate: 5, guestState: 'Delhi', quotes: [], ...over }
        }
        api.gstProfile = {
            data: {
                profile: { stateCode: '02' },
                states: [
                    { code: '02', name: 'Himachal Pradesh' },
                    { code: '07', name: 'Delhi' }
                ]
            }
        }
    }
    const renderForm = (people = 2) =>
        render(
            <MemoryRouter>
                <GuestTourPriceForm tourId={7} quotationNo={1} activeTab={1} guestCategory='Deluxe' people={people} />
            </MemoryRouter>
        )

    test('a workspace not updated for GST shows no GST control', () => {
        renderForm()
        expect(screen.queryByRole('button', { name: 'GST extra' })).not.toBeInTheDocument()
    })

    test('GST extra shows what the guest pays with it, and the group’s GST worked out on the group’s price', () => {
        ready({ guestState: 'Himachal Pradesh' })
        renderForm()
        fireEvent.click(screen.getByRole('button', { name: 'GST extra' }))
        fireEvent.change(screen.getByLabelText('Deluxe'), { target: { value: '10000' } })
        expect(screen.getByText('Guest’s choice · ₹10,500 with 5% GST per person · ₹21,000 for 2')).toBeInTheDocument()
        expect(screen.getByText('CGST 2.5% + SGST 2.5%')).toBeInTheDocument()
    })

    test('GST included says how much of the price is GST', () => {
        ready({ guestState: 'Himachal Pradesh' })
        renderForm(1)
        fireEvent.click(screen.getByRole('button', { name: 'GST included' }))
        fireEvent.change(screen.getByLabelText('Deluxe'), { target: { value: '10500' } })
        expect(screen.getByText('Guest’s choice · GST ₹500 included per person')).toBeInTheDocument()
    })

    test('a guest in another state is charged IGST', () => {
        ready({ guestState: 'Delhi' })
        renderForm()
        fireEvent.click(screen.getByRole('button', { name: 'GST extra' }))
        expect(screen.getByText('IGST 5%')).toBeInTheDocument()
    })

    test('saving saves the quote’s GST first, then its prices', async () => {
        ready({ guestState: 'Himachal Pradesh' })
        renderForm()
        fireEvent.click(screen.getByRole('button', { name: 'GST extra' }))
        fireEvent.change(screen.getByLabelText('Deluxe'), { target: { value: '10000' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save prices' }))
        await waitFor(() => expect(api.savePrices).toHaveBeenCalled())
        expect(api.setTax).toHaveBeenCalledWith(
            expect.objectContaining({ leadId: 7, quoteNo: 1, mode: 'exclusive', rate: '5' })
        )
        expect(api.setTax.mock.invocationCallOrder[0]).toBeLessThan(api.savePrices.mock.invocationCallOrder[0])
    })

    test('an agency without a GSTIN is told, and nothing is saved', async () => {
        ready({ registered: false })
        renderForm()
        fireEvent.click(screen.getByRole('button', { name: 'GST extra' }))
        fireEvent.change(screen.getByLabelText('Deluxe'), { target: { value: '10000' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save prices' }))
        expect(await screen.findAllByText(/Add the agency’s GSTIN in GST settings/)).not.toHaveLength(0)
        expect(api.setTax).not.toHaveBeenCalled()
        expect(api.savePrices).not.toHaveBeenCalled()
    })

    test('a quote already set to charge GST opens that way', () => {
        ready({ quotes: [{ quoteNo: 1, mode: 'inclusive', rate: 12, placeOfSupply: null }] })
        renderForm()
        expect(screen.getByRole('button', { name: 'GST included' })).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByRole('status')).toHaveTextContent(/Not saved yet|Saved/)
    })
})

describe('booking a quote', () => {
    const renderBooking = (priceData, people = 4) =>
        render(
            <PackageConversion
                isOpen
                setIsOpen={vi.fn()}
                leadId={7}
                quotationNo={2}
                priceData={priceData}
                people={people}
            />
        )
    const pick = async label => {
        fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Hotel category' }))
        fireEvent.click(await screen.findByRole('option', { name: label }))
    }

    test('a per-person price is multiplied by the guests, and the working is shown', async () => {
        renderBooking({ deluxePrice: '41000', luxuryPrice: '52000', priceBasis: 'perPerson' })
        await pick('Deluxe · ₹41,000 per person')
        expect(screen.getByLabelText('Final selling price')).toHaveValue(164000)
        expect(screen.getByText('₹41,000 per person × 4 guests = ₹1,64,000')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }))
        await waitFor(() =>
            expect(api.convert).toHaveBeenCalledWith(
                expect.objectContaining({
                    leadId: 7,
                    quotationNo: 2,
                    selectedPackage: 'deluxePrice',
                    sellingPrice: '164000'
                })
            )
        )
        // ? then on to the booking: hotels, transport, payments
        await waitFor(() => expect(api.navigate).toHaveBeenCalledWith('/process/packages/7'))
    })

    test('a total price is booked as it is', async () => {
        renderBooking({ deluxePrice: '164000', priceBasis: 'total' })
        await pick('Deluxe · ₹1,64,000 for the group')
        expect(screen.getByLabelText('Final selling price')).toHaveValue(164000)
        expect(screen.getByText('The total for the group, as quoted.')).toBeInTheDocument()
    })

    test('only the categories this quote was priced in are offered', async () => {
        renderBooking({ deluxePrice: '41000', luxuryPrice: '52000', priceBasis: 'perPerson' })
        fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Hotel category' }))
        const options = within(await screen.findByRole('listbox')).getAllByRole('option')
        expect(options.map(option => option.textContent)).toEqual([
            'Deluxe · ₹41,000 per person',
            'Luxury · ₹52,000 per person'
        ])
    })

    test('without the guests counted, the per-person price is used and the agent is told why', async () => {
        renderBooking({ deluxePrice: '41000', priceBasis: 'perPerson' }, 0)
        await pick('Deluxe · ₹41,000 per person')
        expect(screen.getByLabelText('Final selling price')).toHaveValue(41000)
        expect(screen.getByText(/Add the guests in trip details to multiply by them/)).toBeInTheDocument()
    })
})

describe('booking a quote that charges GST', () => {
    const gstPrice = (mode, rate = 5, interState = false) => ({
        deluxePrice: '10000',
        priceBasis: 'perPerson',
        summary: { gst: { mode, rate, interState } }
    })
    const renderBooking = (priceData, people = 2) =>
        render(
            <PackageConversion
                isOpen
                setIsOpen={vi.fn()}
                leadId={7}
                quotationNo={1}
                priceData={priceData}
                people={people}
            />
        )
    const pick = async label => {
        fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Hotel category' }))
        fireEvent.click(await screen.findByRole('option', { name: label }))
    }

    test('GST extra: the booking is made at the price with GST, and the working shows it', async () => {
        renderBooking(gstPrice('exclusive'))
        await pick('Deluxe · ₹10,000 per person + GST')
        expect(screen.getByLabelText('Final selling price')).toHaveValue(21000)
        expect(
            screen.getByText('₹10,000 per person × 2 guests = ₹20,000 + 5% GST ₹1,000 = ₹21,000')
        ).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }))
        await waitFor(() =>
            expect(api.convert).toHaveBeenCalledWith(expect.objectContaining({ sellingPrice: '21000' }))
        )
    })

    test('GST included: the booking is made at the price as quoted', async () => {
        renderBooking(gstPrice('inclusive'))
        await pick('Deluxe · ₹10,000 per person, GST included')
        expect(screen.getByLabelText('Final selling price')).toHaveValue(20000)
        expect(screen.getByText(/which includes 5% GST ₹952.38/)).toBeInTheDocument()
    })

    test('no GST books as before', async () => {
        renderBooking(gstPrice('none', 0))
        await pick('Deluxe · ₹10,000 per person')
        expect(screen.getByLabelText('Final selling price')).toHaveValue(20000)
    })
})
