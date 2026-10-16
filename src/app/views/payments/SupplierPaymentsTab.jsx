import { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { Alert, Box, Stack, TablePagination, Typography } from '@mui/material'
import ListEmptyState from '@/core/listing/ListEmptyState'
import { downloadCsv } from '@/core/listing/listingFacts'
import { csvOfShown } from '@/core/listing/screenFacts'
import { getSupplierPayments, useGetSupplierPaymentsQuery } from '@/app/store/slices/api/paymentSlice'
import { SUPPLIER_METHODS, errorText, rupees } from './paymentFacts'
import { SUPPLIER_COLUMNS } from './paymentColumns'
import { PaymentsTable, PaymentsToolbar } from './paymentListParts'
import { emptyPayments } from './paymentListTools'
import usePaymentListState from './usePaymentListState'

const EXPORT_LIMIT = 1000
const TYPES = [
    ['Hotel', 'Hotel'],
    ['Taxi', 'Transport']
]
const TYPE_KEYS = TYPES.map(([value]) => value)

/** Every payment made to a hotel or transporter, newest first, with its proof. */
function SupplierPaymentsTab({ notify }) {
    const dispatch = useDispatch()
    const list = usePaymentListState({ methods: SUPPLIER_METHODS, types: TYPE_KEYS, baseColumns: SUPPLIER_COLUMNS })
    const { filters, page, pageSize } = list
    const [exporting, setExporting] = useState(false)
    const args = { ...filters, page: page + 1, pageSize }
    const { data, error, isFetching } = useGetSupplierPaymentsQuery(args, { refetchOnMountOrArgChange: true })

    const result = data?.data || {}
    const rows = Array.isArray(result.rows) ? result.rows : []
    const count = Number(result.recordsTotal) || 0

    const empty = emptyPayments({
        loaded: Boolean(data) && !isFetching,
        count: rows.length,
        hasFilters: list.hasFilters,
        supplier: true
    })

    const exportCurrent = () => {
        if (!rows.length) return notify('Nothing to export for these filters.', 'warning')
        return downloadCsv(csvOfShown(rows, list.columns), 'Supplier payments.csv')
    }

    const exportAll = async () => {
        setExporting(true)
        try {
            const response = await dispatch(
                getSupplierPayments.initiate(
                    { ...args, page: 1, pageSize: EXPORT_LIMIT },
                    { forceRefetch: true, subscribe: false }
                )
            ).unwrap()
            const everything = response?.data?.rows || []
            if (!everything.length) {
                notify('Nothing to export for these filters.', 'warning')
                return
            }
            downloadCsv(csvOfShown(everything, list.columns), 'Supplier payments - all.csv')
            if ((response?.data?.recordsTotal || 0) > everything.length)
                notify(`Exported the first ${everything.length} payments — narrow the dates for the rest.`, 'warning')
        } catch (exportError) {
            notify(errorText(exportError, 'Couldn’t export the payments.'), 'error')
        } finally {
            setExporting(false)
        }
    }

    return (
        <Box aria-busy={exporting || undefined}>
            <Stack spacing={1.5} sx={{ mb: 1.5 }}>
                <PaymentsToolbar
                    filters={filters}
                    onChange={list.change}
                    onClear={list.clear}
                    hasFilters={list.hasFilters}
                    methods={SUPPLIER_METHODS}
                    types={TYPES}
                    searchPlaceholder='Supplier, guest, transaction ID'
                    count={count}
                    showCount={Boolean(data) && !isFetching}
                    columns={list.columns}
                    onToggle={list.toggle}
                    onCurrent={exportCurrent}
                    onAll={exportAll}
                />
                <Typography sx={{ fontSize: '0.875rem' }}>
                    <b>{rupees(result.total)}</b> in {count} payment{count === 1 ? '' : 's'}
                </Typography>
            </Stack>

            {error ? (
                <Alert severity='error' sx={{ mb: 2 }}>
                    {errorText(error, 'Couldn’t load the supplier payments.')}
                </Alert>
            ) : null}

            {empty ? (
                <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: '12px' }}>
                    <ListEmptyState
                        kind={empty.kind}
                        noun='supplier payments'
                        title={empty.title}
                        text={empty.text}
                        canAdd={false}
                        onClear={list.clear}
                    />
                </Box>
            ) : (
                <>
                    <PaymentsTable
                        columns={list.columns}
                        rows={rows}
                        context={{}}
                        label='Supplier payments'
                        fetching={isFetching}
                    />
                    <TablePagination
                        component='div'
                        count={count}
                        page={page}
                        rowsPerPage={pageSize}
                        rowsPerPageOptions={[25, 50, 100]}
                        onPageChange={(event, next) => list.setPage(next)}
                        onRowsPerPageChange={event => {
                            list.setPageSize(parseInt(event.target.value, 10))
                            list.setPage(0)
                        }}
                    />
                </>
            )}
        </Box>
    )
}

SupplierPaymentsTab.propTypes = { notify: PropTypes.func.isRequired }

export default SupplierPaymentsTab
