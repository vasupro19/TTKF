import { Link as RouterLink } from 'react-router-dom'
import { Button, Link, Stack, Tooltip } from '@mui/material'
import { amountOf, canReverse, canVerify, payDate, payDay, rupees, statusLabel } from './paymentFacts'
import { DuplicateWarning, PaymentStatusChip, ProofLink } from './paymentParts'

const proofText = row => (row.hasProof ? row.proofName || 'Attached' : 'None')
const serviceOf = row => (row.service?.type === 'Taxi' ? 'Transport' : row.service?.type || '')
const dash = value => value || '—'

/**
 * The guest payments table: each column says how it is drawn (`render(row, { canDecide, decide })`) and how it is
 * written to CSV (`csv(row)`) and to Excel (`excel(row)`, a real date or number where the cell should be one). `visible: false`
 * columns start hidden and can be picked.
 */
export const GUEST_COLUMNS = [
    {
        key: 'date',
        label: 'Date',
        nowrap: true,
        render: row => payDate(row.paymentDate),
        csv: row => payDate(row.paymentDate),
        excel: row => payDay(row.paymentDate)
    },
    {
        key: 'bookingNo',
        label: 'Booking',
        nowrap: true,
        render: row =>
            row.package?.leadId ? (
                <Link component={RouterLink} to={`/process/packages/${row.package.leadId}`}>
                    {row.bookingNo || `#${row.packageId}`}
                </Link>
            ) : (
                dash(row.bookingNo)
            ),
        csv: row => row.bookingNo || ''
    },
    {
        key: 'guest',
        label: 'Guest',
        render: row => dash(row.guestName || row.package?.lead?.fullName),
        csv: row => row.guestName || row.package?.lead?.fullName || ''
    },
    {
        key: 'amount',
        label: 'Amount',
        align: 'right',
        nowrap: true,
        bold: true,
        render: row => rupees(row.amount),
        csv: row => amountOf(row.amount)
    },
    {
        key: 'method',
        label: 'Method',
        nowrap: true,
        render: row => row.paymentMethod,
        csv: row => row.paymentMethod || ''
    },
    {
        key: 'transactionId',
        label: 'Transaction ID',
        render: row => (
            <Stack direction='row' spacing={0.5} alignItems='center'>
                <span>{dash(row.transactionId)}</span>
                <DuplicateWarning payment={row} />
            </Stack>
        ),
        csv: row => row.transactionId || ''
    },
    {
        key: 'recordedBy',
        label: 'Recorded by',
        render: row => dash(row.recordedByName),
        csv: row => row.recordedByName || ''
    },
    {
        key: 'status',
        label: 'Status',
        render: row => <PaymentStatusChip payment={row} />,
        csv: row => statusLabel(row.status)
    },
    { key: 'proof', label: 'Proof', render: row => <ProofLink kind='guest' payment={row} />, csv: proofText },
    {
        key: 'checkedBy',
        label: 'Checked by',
        visible: false,
        render: row => dash(row.reversedByName || row.reviewedByName),
        csv: row => row.reversedByName || row.reviewedByName || ''
    },
    {
        key: 'reason',
        label: 'Reason',
        visible: false,
        render: row => dash(row.reversalReason || row.rejectionReason),
        csv: row => row.reversalReason || row.rejectionReason || ''
    },
    {
        key: 'remarks',
        label: 'Remarks',
        visible: false,
        render: row => dash(row.remarks),
        csv: row => row.remarks || ''
    },
    {
        key: 'action',
        label: 'Actions',
        align: 'right',
        nowrap: true,
        render: (row, { canDecide, decide }) => (
            <>
                {canVerify(row, canDecide) ? (
                    <>
                        <Button
                            size='small'
                            variant='contained'
                            color='success'
                            onClick={() => decide('verify', row)}
                            sx={{ mr: 0.5 }}
                        >
                            Verify
                        </Button>
                        <Button size='small' color='error' onClick={() => decide('reject', row)}>
                            Reject
                        </Button>
                    </>
                ) : null}
                {canReverse(row, canDecide) ? (
                    <Tooltip describeChild title='It stops counting toward the booking'>
                        <Button size='small' color='inherit' onClick={() => decide('reverse', row)}>
                            Reverse
                        </Button>
                    </Tooltip>
                ) : null}
            </>
        )
    }
]

export const SUPPLIER_COLUMNS = [
    {
        key: 'date',
        label: 'Date',
        nowrap: true,
        render: row => payDate(row.paymentDate),
        csv: row => payDate(row.paymentDate),
        excel: row => payDay(row.paymentDate)
    },
    {
        key: 'bookingNo',
        label: 'Booking',
        nowrap: true,
        render: row => dash(row.bookingNo),
        csv: row => row.bookingNo || ''
    },
    { key: 'guest', label: 'Guest', render: row => dash(row.guestName), csv: row => row.guestName || '' },
    { key: 'supplier', label: 'Supplier', render: row => dash(row.supplierName), csv: row => row.supplierName || '' },
    { key: 'service', label: 'Service', render: row => dash(serviceOf(row)), csv: serviceOf },
    {
        key: 'amount',
        label: 'Amount',
        align: 'right',
        nowrap: true,
        bold: true,
        render: row => rupees(row.amount),
        csv: row => amountOf(row.amount)
    },
    {
        key: 'method',
        label: 'Method',
        nowrap: true,
        render: row => row.paymentMethod,
        csv: row => row.paymentMethod || ''
    },
    {
        key: 'transactionId',
        label: 'Transaction ID',
        render: row => dash(row.transactionId),
        csv: row => row.transactionId || ''
    },
    {
        key: 'recordedBy',
        label: 'Recorded by',
        render: row => dash(row.recordedByName),
        csv: row => row.recordedByName || ''
    },
    { key: 'proof', label: 'Proof', render: row => <ProofLink kind='supplier' payment={row} />, csv: proofText },
    {
        key: 'remarks',
        label: 'Remarks',
        visible: false,
        render: row => dash(row.remarks),
        csv: row => row.remarks || ''
    }
]
