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
    supplier: PropTypes.shape({ businessname: PropTypes.string, phone: PropTypes.string })
})

export const paymentShape = PropTypes.shape({
    id,
    amount: money,
    paymentDate: PropTypes.string,
    paymentMethod: PropTypes.string,
    transactionId: PropTypes.string,
    remarks: PropTypes.string
})
