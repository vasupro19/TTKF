import PropTypes from 'prop-types'

const id = PropTypes.oneOfType([PropTypes.number, PropTypes.string])
const money = PropTypes.oneOfType([PropTypes.number, PropTypes.string])

const paymentRowShape = PropTypes.shape({
    id,
    amount: money,
    paymentDate: PropTypes.string,
    paymentMethod: PropTypes.string,
    transactionId: PropTypes.string,
    remarks: PropTypes.string,
    status: PropTypes.string,
    hasProof: PropTypes.bool,
    proofName: PropTypes.string,
    recordedByName: PropTypes.string,
    reviewedByName: PropTypes.string,
    reviewedAt: PropTypes.string,
    rejectionReason: PropTypes.string,
    reversedByName: PropTypes.string,
    reversedAt: PropTypes.string,
    reversalReason: PropTypes.string,
    bookingNo: PropTypes.string,
    guestName: PropTypes.string,
    duplicateOf: PropTypes.arrayOf(id)
})

export default paymentRowShape
