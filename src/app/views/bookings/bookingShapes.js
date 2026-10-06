/**
 * Prop shapes for a confirmed booking's services and payments, as the bookings API returns them.
 */
import PropTypes from 'prop-types'

const money = PropTypes.oneOfType([PropTypes.number, PropTypes.string])
const id = PropTypes.oneOfType([PropTypes.number, PropTypes.string])

export const serviceShape = PropTypes.shape({
    id,
    type: PropTypes.string,
    cost: money,
    paidAmount: money,
    paymentStatus: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    quantity: PropTypes.number,
    remarks: PropTypes.string,
    roomType: PropTypes.string,
    // ? vehicle, pickup, drop, driver for transport; meal plan for a hotel
    details: PropTypes.objectOf(PropTypes.string),
    // ? how the last email to this supplier went, and which it was: 'request', 'amendment' or 'cancellation'
    lastEmail: PropTypes.shape({
        status: PropTypes.string,
        sentAt: PropTypes.string,
        notes: PropTypes.string,
        kind: PropTypes.string
    }),
    supplier: PropTypes.shape({ businessname: PropTypes.string, phone: PropTypes.string })
})

export const paymentShape = PropTypes.shape({
    id,
    amount: money,
    paymentDate: PropTypes.string,
    paymentMethod: PropTypes.string,
    transactionId: PropTypes.string,
    remarks: PropTypes.string,
    // ? how this payment's receipt last went; null when none was sent
    receipt: PropTypes.shape({ status: PropTypes.string, sentAt: PropTypes.string, notes: PropTypes.string })
})
