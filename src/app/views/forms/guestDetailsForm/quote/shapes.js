/**
 * Prop shapes for a quotation day, as the guest page builds it from a GuestTourItenary row.
 */
import PropTypes from 'prop-types'

const { number, oneOfType, shape, string } = PropTypes

export const quoteDayShape = shape({
    title: string,
    description: string,
    image: string,
    entryType: string,
    destination: string,
    hotels: shape({ deluxe: string, superDeluxe: string, luxury: string, premium: string }),
    fullItem: shape({ id: oneOfType([number, string]), order: number, quoteNo: number })
})

export const priceShape = shape({
    deluxePrice: oneOfType([number, string]),
    superDeluxePrice: oneOfType([number, string]),
    luxuryPrice: oneOfType([number, string]),
    premiumPrice: oneOfType([number, string]),
    priceBasis: string
})

export const confirmedShape = shape({
    quotationNo: number,
    selectedPackage: string,
    sellingPrice: oneOfType([number, string])
})

// ? the add/edit-day form: the day plus the destination hotels it saves back
export const dayFormShape = shape({
    itenaryId: oneOfType([number, string]),
    title: string,
    description: string,
    entryType: string,
    destinationId: oneOfType([number, string]),
    destinationName: string,
    delux_hotel: string,
    super_delux_hotel: string,
    luxury_hotel: string,
    premium_hotel: string,
    image: string
})
