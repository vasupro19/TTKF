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
    setTax: vi.fn(),
    // ? the rate card: what the server says a quote is worth, and the call that asks for it
    rates: null,
    ratesError: null,
    priceFromRates: vi.fn()
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
vi.mock('@/app/store/slices/api/ratesSlice', () => ({
    usePriceFromRatesMutation: () => [
        payload => ({
            unwrap: () => {
                api.priceFromRates(payload)
                return api.ratesError ? Promise.reject(api.ratesError) : Promise.resolve({ data: api.rates })
            }
        }),
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
    api.rates = null
    api.ratesError = null
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

// ? the quote's four prices worked out from the agency's rate card
const priced = (extra = {}) => ({
    canSeeCosts: true,
    inputs: { persons: 4, nights: 3, rooms: 2, mealPlan: 'CP', vehicle: 'Sedan', marginPct: 15 },
    notes: [],
    categories: [
        {
            key: 'delux',
            priceKey: 'deluxePrice',
            label: 'Deluxe',
            ok: true,
            missing: [],
            cost: 23000,
            perPerson: 13200,
            lines: [
                { label: 'Deluxe stay in Manali', detail: '3 nights × 2 rooms × ₹3,000 (CP)', amount: 18000 },
                { label: 'Cost', detail: '', amount: 23000 },
                { label: 'Margin 15%', detail: '', amount: 3450 }
            ]
        },
        {
            key: 'superDelux',
            priceKey: 'superDeluxePrice',
            label: 'Super Deluxe',
            ok: true,
            missing: [],
            cost: 27500,
            perPerson: 15800,
            lines: []
        },
        {
            key: 'luxury',
            priceKey: 'luxuryPrice',
            label: 'Luxury',
            ok: false,
            missing: ['No Luxury rate for Manali'],
            cost: null,
            perPerson: null,
            lines: []
        },
        {
            key: 'premium',
            priceKey: 'premiumPrice',
            label: 'Premium',
            ok: false,
            missing: ['No Luxury rate for Manali'],
            cost: null,
            perPerson: null,
            lines: []
        }
    ],
    ...extra
})

describe('calculating the prices from the rate card', () => {
    const open = (people = 4) => {
        render(<GuestTourPriceForm tourId={7} quotationNo={2} activeTab={1} people={people} />)
        fireEvent.click(screen.getByRole('button', { name: 'Calculate from rates' }))
    }

    test('asks the server about this quote and shows each category’s price, and what is missing', async () => {
        api.rates = priced()
        open()
        expect(await screen.findByText('Prices from your rates — Quote 2')).toBeInTheDocument()
        expect(api.priceFromRates).toHaveBeenCalledWith({ leadId: 7, quoteNo: 2 })
        expect(
            screen.getByText('4 guests · 3 nights · 2 rooms · CP meals · Sedan cab · 15% margin')
        ).toBeInTheDocument()
        expect(screen.getByText('₹13,200')).toBeInTheDocument()
        expect(screen.getByText('per person · ₹52,800 for 4')).toBeInTheDocument()
        expect(screen.getAllByText('No Luxury rate for Manali')).toHaveLength(2)
        expect(screen.getByText(/left out instead of guessed/)).toBeInTheDocument()
    })

    test('"Use these prices" fills only the categories that were priced, and leaves the rest as typed', async () => {
        api.rates = priced()
        render(<GuestTourPriceForm tourId={7} quotationNo={2} activeTab={1} people={4} />)
        fireEvent.change(screen.getByLabelText('Luxury'), { target: { value: '99000' } })
        fireEvent.click(screen.getByRole('button', { name: 'Calculate from rates' }))
        fireEvent.click(await screen.findByRole('button', { name: 'Use these prices' }))
        expect(screen.getByLabelText('Deluxe')).toHaveValue('13200')
        expect(screen.getByLabelText('Super Deluxe')).toHaveValue('15800')
        expect(screen.getByLabelText('Luxury')).toHaveValue('99000')
        expect(screen.getByLabelText('Premium')).toHaveValue('')
        // ? filled in the boxes, not saved: the agent saves them
        expect(api.savePrices).not.toHaveBeenCalled()
        expect(screen.getByRole('button', { name: 'Save prices' })).toBeEnabled()
        expect(screen.queryByText('Prices from your rates — Quote 2')).not.toBeInTheDocument()
    })

    test('a quote priced as a total for the group gets the per-person price times the guests', async () => {
        api.rates = priced()
        render(<GuestTourPriceForm tourId={7} quotationNo={2} activeTab={1} people={4} />)
        fireEvent.click(screen.getByRole('button', { name: 'Total for the group' }))
        fireEvent.click(screen.getByRole('button', { name: 'Calculate from rates' }))
        fireEvent.click(await screen.findByRole('button', { name: 'Use these prices' }))
        expect(screen.getByLabelText('Deluxe')).toHaveValue('52800')
    })

    test('a manager sees how a price was worked out, and can try another margin', async () => {
        api.rates = priced()
        open()
        fireEvent.click(await screen.findByRole('button', { name: /Cost ₹23,000 · show how/ }))
        const lines = within(screen.getByRole('list', { name: 'How Deluxe was worked out' }))
        expect(lines.getByText('3 nights × 2 rooms × ₹3,000 (CP)')).toBeInTheDocument()
        expect(lines.getByText('Margin 15%')).toBeInTheDocument()

        fireEvent.change(screen.getByLabelText('Margin for this quote'), { target: { value: '20' } })
        fireEvent.click(screen.getByRole('button', { name: 'Recalculate' }))
        await waitFor(() =>
            expect(api.priceFromRates).toHaveBeenLastCalledWith({ leadId: 7, quoteNo: 2, marginPct: 20 })
        )
    })

    test('a salesperson sees the prices only: no cost, no margin, no workings', async () => {
        api.rates = priced({
            canSeeCosts: false,
            inputs: { persons: 4, nights: 3, rooms: 2, mealPlan: 'CP', vehicle: 'Sedan', marginPct: null },
            categories: priced().categories.map(({ key, priceKey, label, ok, missing, perPerson }) => ({
                key,
                priceKey,
                label,
                ok,
                missing,
                perPerson
            }))
        })
        open()
        expect(await screen.findByText('₹13,200')).toBeInTheDocument()
        expect(screen.getByText('4 guests · 3 nights · 2 rooms · CP meals · Sedan cab')).toBeInTheDocument()
        expect(screen.queryByText(/margin/i)).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /show how/ })).not.toBeInTheDocument()
        expect(screen.queryByLabelText('Margin for this quote')).not.toBeInTheDocument()
        expect(screen.getByText(/Ask your admin to add them/)).toBeInTheDocument()
    })

    test('says why it cannot price the quote, and offers nothing to use', async () => {
        api.ratesError = { data: { message: 'Enter the number of adults for this quote first' } }
        open()
        expect(await screen.findByText('Enter the number of adults for this quote first')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Use these prices' })).toBeDisabled()
    })

    test('passes on the notes, such as a meal plan that was assumed', async () => {
        api.rates = priced({ notes: ['No meal plan is chosen on this quote, so CP (breakfast) rates are used.'] })
        open()
        expect(await screen.findByText(/No meal plan is chosen on this quote/)).toBeInTheDocument()
    })
})
