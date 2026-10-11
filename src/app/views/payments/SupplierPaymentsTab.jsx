import { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import {
    Alert,
    Box,
    LinearProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography
} from '@mui/material'
import { getSupplierPayments, useGetSupplierPaymentsQuery } from '@/app/store/slices/api/paymentSlice'
import { SUPPLIER_METHODS, errorText, payDate, rupees, supplierExportRows } from './paymentFacts'
import { ProofLink } from './paymentParts'
import { ExportButton, PaymentFilters } from './paymentListParts'
import { EMPTY_FILTERS, saveRows } from './paymentListTools'

const EXPORT_LIMIT = 1000
const TYPES = [
    ['Hotel', 'Hotel'],
    ['Taxi', 'Transport']
]

/** Every payment made to a hotel or transporter, newest first, with its proof. */
function SupplierPaymentsTab({ notify }) {
    const dispatch = useDispatch()
    const [filters, setFilters] = useState({ ...EMPTY_FILTERS })
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(25)
    const [exporting, setExporting] = useState(false)
    const args = { ...filters, page: page + 1, pageSize }
    const { data, error, isFetching } = useGetSupplierPaymentsQuery(args, { refetchOnMountOrArgChange: true })

    const result = data?.data || {}
    const rows = Array.isArray(result.rows) ? result.rows : []
    const count = Number(result.recordsTotal) || 0

    const exportList = async format => {
        setExporting(true)
        try {
            const response = await dispatch(
                getSupplierPayments.initiate(
                    { ...args, page: 1, pageSize: EXPORT_LIMIT },
                    { forceRefetch: true, subscribe: false }
                )
            ).unwrap()
            const list = response?.data?.rows || []
            if (!list.length) {
                notify('Nothing to export for these filters.', 'warning')
                return
            }
            saveRows(supplierExportRows(list), 'Supplier payments', format)
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
            <Stack
                direction={{ xs: 'column', lg: 'row' }}
                spacing={1.5}
                justifyContent='space-between'
                alignItems={{ xs: 'stretch', lg: 'center' }}
                sx={{ mb: 1.5 }}
            >
                <PaymentFilters
                    filters={filters}
                    onChange={next => {
                        setFilters(next)
                        setPage(0)
                    }}
                    methods={SUPPLIER_METHODS}
                    types={TYPES}
                    searchPlaceholder='Supplier, guest, transaction ID'
                />
                <Stack direction='row' spacing={1.5} alignItems='center' justifyContent='flex-end'>
                    <Typography sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                        <b>{rupees(result.total)}</b> in {count} payment{count === 1 ? '' : 's'}
                    </Typography>
                    <ExportButton onExport={exportList} busy={exporting} disabled={!rows.length} />
                </Stack>
            </Stack>

            {error ? (
                <Alert severity='error' sx={{ mb: 2 }}>
                    {errorText(error, 'Couldn’t load the supplier payments.')}
                </Alert>
            ) : null}

            <Box sx={{ position: 'relative' }}>
                {isFetching ? <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} /> : null}
                <TableContainer
                    sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                    <Table size='small' aria-label='Supplier payments'>
                        <TableHead>
                            <TableRow sx={{ '& th': { fontWeight: 600, whiteSpace: 'nowrap', bgcolor: 'grey.50' } }}>
                                <TableCell>Date</TableCell>
                                <TableCell>Booking</TableCell>
                                <TableCell>Guest</TableCell>
                                <TableCell>Supplier</TableCell>
                                <TableCell>Service</TableCell>
                                <TableCell align='right'>Amount</TableCell>
                                <TableCell>Method</TableCell>
                                <TableCell>Transaction ID</TableCell>
                                <TableCell>Recorded by</TableCell>
                                <TableCell>Proof</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map(row => (
                                <TableRow key={row.id} hover>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{payDate(row.paymentDate)}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.bookingNo || '—'}</TableCell>
                                    <TableCell>{row.guestName || '—'}</TableCell>
                                    <TableCell>{row.supplierName || '—'}</TableCell>
                                    <TableCell>
                                        {row.service?.type === 'Taxi' ? 'Transport' : row.service?.type || '—'}
                                    </TableCell>
                                    <TableCell align='right' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        {rupees(row.amount)}
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.paymentMethod}</TableCell>
                                    <TableCell>{row.transactionId || '—'}</TableCell>
                                    <TableCell>{row.recordedByName || '—'}</TableCell>
                                    <TableCell>
                                        <ProofLink kind='supplier' payment={row} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!rows.length && !isFetching ? (
                                <TableRow>
                                    <TableCell colSpan={10} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                                        No supplier payments match these filters.
                                    </TableCell>
                                </TableRow>
                            ) : null}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component='div'
                    count={count}
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
        </Box>
    )
}

SupplierPaymentsTab.propTypes = { notify: PropTypes.func.isRequired }

export default SupplierPaymentsTab
