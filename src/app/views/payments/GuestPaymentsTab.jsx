import { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { Alert, Box, Stack, Tab, TablePagination, Tabs, Typography } from '@mui/material'
import ListEmptyState from '@/core/listing/ListEmptyState'
import { downloadCsv } from '@/core/listing/listingFacts'
import { csvOfShown } from '@/core/listing/screenFacts'
import { getGuestPayments, useGetGuestPaymentsQuery } from '@/app/store/slices/api/paymentSlice'
import { GUEST_METHODS, PAYMENT_STATUSES, errorText, rupees, summaryTotal } from './paymentFacts'
import { GUEST_COLUMNS } from './paymentColumns'
import { PaymentsTable, PaymentsToolbar } from './paymentListParts'
import { emptyPayments } from './paymentListTools'
import usePaymentDecision from './usePaymentDecision'
import usePaymentListState from './usePaymentListState'

const EXPORT_LIMIT = 1000
const STATUS_TABS = [...PAYMENT_STATUSES, { key: 'ALL', label: 'All' }]

/**
 * Every guest payment accounts may see, by status — awaiting verification first — with the proof beside each, and
 * Verify / Reject / Reverse for accounts and the agency's admin. The filters, status and columns work as on the Leads
 * list: kept in the address, with "Clear filters", a count, the column picker and CSV.
 */
function GuestPaymentsTab({ notify }) {
    const dispatch = useDispatch()
    const list = usePaymentListState({ methods: GUEST_METHODS, baseColumns: GUEST_COLUMNS })
    const { filters, status, page, pageSize } = list
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
    const total = Number(result.recordsTotal) || 0
    const statusLabel = STATUS_TABS.find(tab => tab.key === status)?.label || 'All'

    const empty = emptyPayments({
        loaded: Boolean(data) && !isFetching,
        count: rows.length,
        hasFilters: list.hasFilters,
        status,
        statusLabel,
        anyPayments: all.count > 0
    })

    const exportCurrent = () => {
        if (!rows.length) return notify('Nothing to export for these filters.', 'warning')
        return downloadCsv(csvOfShown(rows, list.columns), `Guest payments - ${statusLabel}.csv`)
    }

    // ? every matching payment, up to the cap the server allows in one go
    const exportAll = async () => {
        setExporting(true)
        try {
            const response = await dispatch(
                getGuestPayments.initiate(
                    { ...args, page: 1, pageSize: EXPORT_LIMIT },
                    { forceRefetch: true, subscribe: false }
                )
            ).unwrap()
            const everything = response?.data?.rows || []
            if (!everything.length) {
                notify('Nothing to export for these filters.', 'warning')
                return
            }
            downloadCsv(csvOfShown(everything, list.columns), `Guest payments - ${statusLabel} - all.csv`)
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
            <Tabs
                value={status}
                onChange={(event, value) => list.change({ status: value })}
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

            <Stack spacing={1.5} sx={{ mb: 1.5 }}>
                <PaymentsToolbar
                    filters={filters}
                    onChange={list.change}
                    onClear={list.clear}
                    hasFilters={list.hasFilters}
                    methods={GUEST_METHODS}
                    searchPlaceholder='Guest, transaction ID, recorded by'
                    count={total}
                    showCount={Boolean(data) && !isFetching}
                    columns={list.columns}
                    onToggle={list.toggle}
                    onCurrent={exportCurrent}
                    onAll={exportAll}
                />
                <Typography sx={{ fontSize: '0.875rem' }}>
                    <b>{rupees(current.amount)}</b> in {current.count} payment{current.count === 1 ? '' : 's'}
                    <Typography component='span' color='text.secondary' sx={{ fontSize: '0.8125rem', ml: 1.5 }}>
                        {PAYMENT_STATUSES.map(({ key, label }) => `${label} ${rupees(summary[key]?.amount)}`).join(
                            ' · '
                        )}
                    </Typography>
                </Typography>
            </Stack>

            {error ? (
                <Alert severity='error' sx={{ mb: 2 }}>
                    {errorText(error, 'Couldn’t load the payments.')}
                </Alert>
            ) : null}

            {empty ? (
                <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: '12px' }}>
                    <ListEmptyState
                        kind={empty.kind}
                        noun='payments'
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
                        context={{ canDecide, decide }}
                        label='Guest payments'
                        fetching={isFetching}
                    />
                    <TablePagination
                        component='div'
                        count={total}
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
