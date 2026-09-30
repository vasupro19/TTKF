import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import GuestTourPriceForm from './pricingTour'
import PackageConversion from './packageConvertModal'
import { groupPrice, headCount } from './quote/pricing'

const api = vi.hoisted(() => ({ price: null, savePrices: vi.fn(), convert: vi.fn() }))

vi.mock('react-redux', () => ({ useDispatch: () => vi.fn() }))
vi.mock('@app/store/slices/snackbar', () => ({ openSnackbar: payload => ({ type: 'snackbar', payload }) }))
vi.mock('@/app/store/slices/api/guestTourPrice', () => ({
    useGetGuestTourPriceQuery: () => ({ data: api.price, isFetching: false }),
    useUpsertGuestTourPriceMutation: () => [
        payload => ({ unwrap: () => Promise.resolve(api.savePrices(payload)) }),
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
