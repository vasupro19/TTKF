import { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { Link as RouterLink } from 'react-router-dom'
import {
    Alert,
    Box,
    Button,
    LinearProgress,
    Link,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tabs,
    Tooltip,
    Typography
} from '@mui/material'
import { getGuestPayments, useGetGuestPaymentsQuery } from '@/app/store/slices/api/paymentSlice'
import {
    GUEST_METHODS,
    PAYMENT_STATUSES,
    canReverse,
    canVerify,
    errorText,
    guestExportRows,
    payDate,
    rupees,
    summaryTotal
} from './paymentFacts'
import { DuplicateWarning, PaymentStatusChip, ProofLink } from './paymentParts'
import { ExportButton, PaymentFilters } from './paymentListParts'
import { EMPTY_FILTERS, saveRows } from './paymentListTools'
import usePaymentDecision from './usePaymentDecision'

const EXPORT_LIMIT = 1000
const STATUS_TABS = [...PAYMENT_STATUSES, { key: 'ALL', label: 'All' }]

/**
 * Every guest payment accounts may see, by status — awaiting verification first — with the proof beside each, and
 * Verify / Reject / Reverse for accounts and the agency's admin.
 */
function GuestPaymentsTab({ notify }) {
    const dispatch = useDispatch()
    const [status, setStatus] = useState('PENDING')
    const [filters, setFilters] = useState({ ...EMPTY_FILTERS })
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(25)
    const [exporting, setExporting] = useState(false)
    const args = { status, ...filters, page: page + 1, pageSize }
    const { data, error, isFetching } = useGetGuestPaymentsQuery(args, { refetchOnMountOrArgChange: true })
    const { decide, dialog } = usePaymentDecision({ notify })

    const result = data?.data || {}
    const rows = Array.isArray(result.rows) ? result.rows : []
    const summary = result.summary || {}
    const canDecide = Boolean(result.canDecide)
    const all = summaryTotal(summary)
    const countOf = key => (key === 'ALL' ? all.count : Number(summary[key]?.count) || 0)
    const current = status === 'ALL' ? all : summary[status] || { count: 0, amount: 0 }

    const changeFilters = next => {
        setFilters(next)
        setPage(0)
    }

    const exportList = async format => {
        setExporting(true)
        try {
            const response = await dispatch(
                getGuestPayments.initiate(
                    { ...args, page: 1, pageSize: EXPORT_LIMIT },
                    { forceRefetch: true, subscribe: false }
                )
            ).unwrap()
            const list = response?.data?.rows || []
            if (!list.length) {
                notify('Nothing to export for these filters.', 'warning')
                return
            }
            const label = STATUS_TABS.find(tab => tab.key === status)?.label || 'All'
            saveRows(guestExportRows(list), `Guest payments - ${label}`, format)
            if ((response?.data?.recordsTotal || 0) > list.length)
                notify(`Exported the first ${list.length} payments — narrow the dates for the rest.`, 'warning')
        } catch (exportError) {
            notify(errorText(exportError, 'Couldn’t export the payments.'), 'error')
        } finally {
            setExporting(false)
        }
    }

    return (
        <Box>
            <Tabs
                value={status}
                onChange={(event, value) => {
                    setStatus(value)
                    setPage(0)
                }}
                variant='scrollable'
                scrollButtons='auto'
                aria-label='Payment status'
                sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
            >
                {STATUS_TABS.map(tab => (
                    <Tab
                        key={tab.key}
                        value={tab.key}
                        label={`${tab.label} (${countOf(tab.key)})`}
                        sx={{ textTransform: 'none', minHeight: 44 }}
                    />
                ))}
            </Tabs>

            <Stack
                direction={{ xs: 'column', lg: 'row' }}
                spacing={1.5}
                justifyContent='space-between'
                alignItems={{ xs: 'stretch', lg: 'center' }}
                sx={{ mb: 1.5 }}
            >
                <PaymentFilters
                    filters={filters}
                    onChange={changeFilters}
                    methods={GUEST_METHODS}
                    searchPlaceholder='Guest, transaction ID, recorded by'
                />
                <Stack direction='row' spacing={1.5} alignItems='center' justifyContent='flex-end'>
                    <Typography sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                        <b>{rupees(current.amount)}</b> in {current.count} payment{current.count === 1 ? '' : 's'}
                    </Typography>
                    <ExportButton onExport={exportList} busy={exporting} disabled={!rows.length} />
                </Stack>
            </Stack>

            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mb: 1 }}>
                {PAYMENT_STATUSES.map(({ key, label }) => `${label} ${rupees(summary[key]?.amount)}`).join(' · ')}
            </Typography>

            {error ? (
                <Alert severity='error' sx={{ mb: 2 }}>
                    {errorText(error, 'Couldn’t load the payments.')}
                </Alert>
            ) : null}

            <Box sx={{ position: 'relative' }}>
                {isFetching ? <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} /> : null}
                <TableContainer
                    sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                    <Table size='small' aria-label='Guest payments'>
                        <TableHead>
                            <TableRow sx={{ '& th': { fontWeight: 600, whiteSpace: 'nowrap', bgcolor: 'grey.50' } }}>
                                <TableCell>Date</TableCell>
                                <TableCell>Booking</TableCell>
                                <TableCell>Guest</TableCell>
                                <TableCell align='right'>Amount</TableCell>
                                <TableCell>Method</TableCell>
                                <TableCell>Transaction ID</TableCell>
                                <TableCell>Recorded by</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Proof</TableCell>
                                <TableCell align='right'>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map(row => (
                                <TableRow key={row.id} hover>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{payDate(row.paymentDate)}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        {row.package?.leadId ? (
                                            <Link component={RouterLink} to={`/process/packages/${row.package.leadId}`}>
                                                {row.bookingNo || `#${row.packageId}`}
                                            </Link>
                                        ) : (
                                            row.bookingNo || '—'
                                        )}
                                    </TableCell>
                                    <TableCell>{row.guestName || row.package?.lead?.fullName || '—'}</TableCell>
                                    <TableCell align='right' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        {rupees(row.amount)}
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.paymentMethod}</TableCell>
                                    <TableCell>
                                        <Stack direction='row' spacing={0.5} alignItems='center'>
                                            <span>{row.transactionId || '—'}</span>
                                            <DuplicateWarning payment={row} />
                                        </Stack>
                                    </TableCell>
                                    <TableCell>{row.recordedByName || '—'}</TableCell>
                                    <TableCell>
                                        <PaymentStatusChip payment={row} />
                                    </TableCell>
                                    <TableCell>
                                        <ProofLink kind='guest' payment={row} />
                                    </TableCell>
                                    <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
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
                                                <Button
                                                    size='small'
                                                    color='error'
                                                    onClick={() => decide('reject', row)}
                                                >
                                                    Reject
                                                </Button>
                                            </>
                                        ) : null}
                                        {canReverse(row, canDecide) ? (
                                            <Tooltip describeChild title='It stops counting toward the booking'>
                                                <Button
                                                    size='small'
                                                    color='inherit'
                                                    onClick={() => decide('reverse', row)}
                                                >
                                                    Reverse
                                                </Button>
                                            </Tooltip>
                                        ) : null}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!rows.length && !isFetching ? (
                                <TableRow>
                                    <TableCell colSpan={10} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                                        {status === 'PENDING'
                                            ? 'Nothing is waiting for verification.'
                                            : 'No payments match these filters.'}
                                    </TableCell>
                                </TableRow>
                            ) : null}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component='div'
                    count={Number(result.recordsTotal) || 0}
                    page={page}
                    rowsPerPage={pageSize}
                    rowsPerPageOptions={[25, 50, 100]}
                    onPageChange={(event, next) => setPage(next)}
                    onRowsPerPageChange={event => {
                        setPageSize(parseInt(event.target.value, 10))
                        setPage(0)
                    }}
                />
            </Box>
            {!canDecide && data ? (
                <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                    Only accounts or the agency’s admin can verify, reject or reverse payments.
                </Typography>
            ) : null}
            {dialog}
        </Box>
    )
}

GuestPaymentsTab.propTypes = { notify: PropTypes.func.isRequired }

export default GuestPaymentsTab
