import PropTypes from 'prop-types'
import { useMemo, useState } from 'react'
import {
    Alert,
    Box,
    LinearProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
    Typography
} from '@mui/material'
import { useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import MainCard from '@core/components/extended/MainCard'
import AssigneeFilter from '@/core/components/AssigneeFilter'
import ListEmptyState from '@/core/listing/ListEmptyState'
import { downloadCsv } from '@/core/listing/listingFacts'
import { csvOfShown, pickerColumns, shownColumns, toggleColumn } from '@/core/listing/screenFacts'
import {
    ClearFiltersButton,
    ColumnsAndCsv,
    CountText,
    DateBox,
    SearchBox,
    SelectBox,
    ToolbarRow
} from '@/core/listing/ScreenToolbar'
import { openSnackbar } from '@app/store/slices/snackbar'
import { gstSlice, useGetInvoicesQuery } from '@/app/store/slices/api/gstSlice'
import { errorText, money2, thisMonth } from '../gst/gstFacts'
import { InvoiceDialog } from './invoiceParts'
import { INVOICE_COLUMNS } from './invoiceColumns'
import {
    CLEARED,
    GST_OPTIONS,
    KIND_OPTIONS,
    STATUS_OPTIONS,
    emptyInvoices,
    hasInvoiceFilters,
    invoiceFiltersFromSearch,
    invoiceQuery,
    invoiceSearchAfter
} from './invoiceFilters'

const EXPORT_LIMIT = 1000

function Figure({ label, value }) {
    return (
        <Box sx={{ minWidth: 120 }}>
            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: '1.125rem', fontWeight: 600 }}>{value}</Typography>
        </Box>
    )
}

Figure.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.node.isRequired }

/**
 * The agency's invoices, the way Leads looks: a month shortcut or a From / To range of invoice dates (dates win), status,
 * kind, GST, who issued it and a search by invoice number, guest or booking number — all kept in the address — with the
 * GST totals of exactly the invoices listed, a column picker and CSV. Each invoice opens to download, email or (accounts
 * and admins) cancel. A salesperson sees the invoices of their own bookings.
 */
function InvoicesPage() {
    const dispatch = useDispatch()
    const [params, setParams] = useSearchParams()
    const search = params.toString()
    const filters = useMemo(() => invoiceFiltersFromSearch(search), [search])
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(25)
    const [columns, setColumns] = useState(() => pickerColumns(INVOICE_COLUMNS))
    const [open, setOpen] = useState(null)

    const change = patch => {
        setParams(new URLSearchParams(invoiceSearchAfter(search, patch)), { replace: true })
        setPage(0)
    }
    const clear = () => change({ ...CLEARED, month: thisMonth() })

    const query = invoiceQuery(filters, { page, pageSize })
    const { data, isFetching, error } = useGetInvoicesQuery(query)
    const rows = data?.data || []
    const summary = data?.summary || {}
    const count = data?.count || 0
    const filtered = hasInvoiceFilters(filters)
    const empty = emptyInvoices({
        loaded: Boolean(data) && !isFetching,
        count: rows.length,
        hasFilters: filtered,
        filters
    })
    const shown = shownColumns(columns)

    const notify = (message, color = 'success') =>
        dispatch(
            openSnackbar({
                open: true,
                message,
                variant: 'alert',
                alert: { color },
                anchorOrigin: { vertical: 'top', horizontal: 'right' }
            })
        )

    const exportCurrent = () =>
        rows.length ? downloadCsv(csvOfShown(rows, columns), 'Invoices.csv') : notify('Nothing to export.', 'warning')

    // ? every matching invoice, up to the cap
    const exportAll = async () => {
        try {
            const { data: response } = await dispatch(
                gstSlice.endpoints.getInvoices.initiate(invoiceQuery(filters, { page: 0, pageSize: EXPORT_LIMIT }), {
                    forceRefetch: true,
                    subscribe: false
                })
            )
            const everything = response?.data || []
            if (!everything.length) return notify('Nothing to export.', 'warning')
            downloadCsv(csvOfShown(everything, columns), 'Invoices - all.csv')
            if ((response?.count || 0) > everything.length)
                notify(`Exported the first ${everything.length} invoices — narrow the dates for the rest.`, 'warning')
        } catch (exportError) {
            notify(errorText(exportError, 'Couldn’t export the invoices.'), 'error')
        }
        return undefined
    }

    return (
        <MainCard content={false} sx={{ py: '2px' }}>
            <Stack spacing={2} sx={{ p: 2.5 }}>
                <Box>
                    <Typography variant='h3'>Invoices</Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                        Every invoice issued from a booking, with the GST in it. Open one to download, email or cancel
                        it.
                    </Typography>
                </Box>

                <ToolbarRow>
                    <SearchBox
                        value={filters.q}
                        onCommit={q => change({ q })}
                        noun='invoices'
                        placeholder='Invoice no., guest, booking no.'
                    />
                    <DateBox
                        label='Month'
                        type='month'
                        value={filters.from || filters.to ? '' : filters.month}
                        onChange={month => change({ month, from: '', to: '' })}
                    />
                    <DateBox
                        label='From'
                        value={filters.from}
                        max={filters.to || undefined}
                        onChange={from => change({ from })}
                    />
                    <DateBox
                        label='To'
                        value={filters.to}
                        min={filters.from || undefined}
                        onChange={to => change({ to })}
                    />
                    <SelectBox
                        label='Status'
                        value={filters.status}
                        onChange={status => change({ status })}
                        options={STATUS_OPTIONS}
                        allLabel='Issued and cancelled'
                        width={180}
                    />
                    <SelectBox
                        label='Kind'
                        value={filters.kind}
                        onChange={kind => change({ kind })}
                        options={KIND_OPTIONS}
                        allLabel='All kinds'
                    />
                    <SelectBox
                        label='GST'
                        value={filters.gst}
                        onChange={gst => change({ gst })}
                        options={GST_OPTIONS}
                        allLabel='With or without'
                    />
                    <AssigneeFilter
                        label='Issued by'
                        value={filters.issuedBy}
                        onChange={issuedBy => change({ issuedBy })}
                    />
                    {filtered && <ClearFiltersButton onClick={clear} />}
                    <CountText
                        count={count}
                        noun={count === 1 ? 'invoice' : 'invoices'}
                        show={Boolean(data) && !isFetching}
                    />
                    <ColumnsAndCsv
                        columns={columns}
                        onToggle={key => setColumns(current => toggleColumn(current, key))}
                        onCurrent={exportCurrent}
                        onAll={exportAll}
                    />
                </ToolbarRow>

                <Stack direction='row' spacing={4} flexWrap='wrap' useFlexGap>
                    <Figure label='Invoices' value={summary.issued ?? 0} />
                    <Figure label='Taxable value' value={money2(summary.taxable)} />
                    <Figure label='GST' value={money2(summary.gst)} />
                    <Figure label='Invoiced total' value={money2(summary.total)} />
                </Stack>
                {Number(summary.gst) > 0 && (
                    <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                        GST: CGST {money2(summary.cgst)} · SGST {money2(summary.sgst)} · IGST {money2(summary.igst)}{' '}
                        (issued invoices {filtered ? 'matching the filters' : 'in this list'})
                    </Typography>
                )}
                {error && <Alert severity='error'>{errorText(error, 'Couldn’t load the invoices.')}</Alert>}
            </Stack>

            {isFetching && <LinearProgress />}
            {empty ? (
                <Box sx={{ mx: 2.5, mb: 2.5, border: '1px dashed', borderColor: 'divider', borderRadius: '12px' }}>
                    <ListEmptyState
                        kind={empty.kind}
                        noun='invoices'
                        title={empty.title}
                        text={empty.text}
                        canAdd={false}
                        onClear={clear}
                    />
                </Box>
            ) : (
                <>
                    <Box sx={{ overflowX: 'auto' }}>
                        <Table size='small' aria-label='Invoices'>
                            <TableHead>
                                <TableRow>
                                    {shown.map(column => (
                                        <TableCell key={column.key} align={column.align}>
                                            {column.label}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map(row => (
                                    <TableRow
                                        key={row.id}
                                        hover
                                        onClick={() => setOpen(row)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        {shown.map(column => (
                                            <TableCell key={column.key} align={column.align}>
                                                {column.render(row)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                    <TablePagination
                        component='div'
                        count={count}
                        page={page}
                        rowsPerPage={pageSize}
                        rowsPerPageOptions={[25, 50, 100]}
                        onPageChange={(event, next) => setPage(next)}
                        onRowsPerPageChange={event => {
                            setPageSize(Number(event.target.value))
                            setPage(0)
                        }}
                    />
                </>
            )}

            <InvoiceDialog
                invoice={open}
                canCancel={Boolean(summary.canCancel)}
                onClose={() => setOpen(null)}
                notify={notify}
            />
        </MainCard>
    )
}

export default InvoicesPage
