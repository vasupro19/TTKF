import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    Box,
    Button,
    ButtonBase,
    CircularProgress,
    InputAdornment,
    LinearProgress,
    MenuItem,
    Pagination,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { CheckCircle, FilterAltOff, RadioButtonUnchecked, Search } from '@mui/icons-material'
import MainCard from '@core/components/extended/MainCard'
import AssigneeFilter from '@/core/components/AssigneeFilter'
import CustomButton from '@core/components/extended/CustomButton'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import ListEmptyState from '@/core/listing/ListEmptyState'
import { downloadCsv } from '@/core/listing/listingFacts'
import { openSnackbar } from '@app/store/slices/snackbar'
import {
    getBookingsPage,
    useGetBookingsPageQuery,
    useGetServiceRequestsQuery
} from '@/app/store/slices/api/packageConvert'
import {
    DEFAULT_PAGE_SIZE,
    EMPTY_FILTERS,
    EXPORT_CAP,
    INVOICE_OPTIONS,
    PAGE_SIZES,
    PAYMENT_OPTIONS,
    bookingsCsv,
    filtersFromSearch,
    hasAnyFilter,
    searchWithFilters
} from './bookingsListFacts'
import {
    STAGES,
    dateRange,
    doneCount,
    guestMoney,
    nextStep,
    progressOf,
    rupees,
    stepsFor,
    urgency
} from './bookingFacts'
import { RequestRow } from './serviceRequestParts'

const rowShape = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    leadId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    guestName: PropTypes.string,
    phone: PropTypes.string,
    selectedPackage: PropTypes.string,
    quotationNo: PropTypes.number,
    travelDate: PropTypes.string,
    travelEnd: PropTypes.string,
    bookingNo: PropTypes.string
})

function StagePill({ label, count, selected, onClick }) {
    return (
        <ButtonBase
            onClick={onClick}
            aria-pressed={selected}
            sx={theme => ({
                px: 1.75,
                py: 0.75,
                borderRadius: 999,
                border: '1px solid',
                borderColor: selected ? theme.palette.primary.main : theme.palette.divider,
                bgcolor: selected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                color: selected ? theme.palette.primary.main : theme.palette.text.primary,
                fontSize: '0.9375rem',
                fontWeight: selected ? 600 : 400
            })}
        >
            {label}
            <Box component='span' sx={{ ml: 0.75, color: 'text.secondary', fontWeight: 400 }}>
                {count}
            </Box>
        </ButtonBase>
    )
}

StagePill.propTypes = {
    label: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired,
    selected: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired
}

const progressShape = PropTypes.objectOf(PropTypes.bool)

function BookingRow({ row, progress, steps, onOpen }) {
    const money = guestMoney(row)
    const step = nextStep(progress, steps)
    const dates = dateRange(row.travelDate, row.travelEnd)
    const soon = urgency(row.travelDate, !step)
    return (
        <Box component='li' sx={{ listStyle: 'none', borderTop: '1px solid', borderColor: 'divider' }}>
            <ButtonBase
                onClick={onOpen}
                sx={{ width: '100%', textAlign: 'left', display: 'block', py: 2.25, px: { xs: 0.5, sm: 1 } }}
                aria-label={`Open the booking for ${row.guestName}`}
            >
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={{ xs: 1.5, md: 3 }}
                    alignItems={{ md: 'center' }}
                >
                    <Box sx={{ flex: 1.3, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '1.0625rem', fontWeight: 600 }} noWrap>
                            {row.guestName || 'Guest'}
                        </Typography>
                        <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }} noWrap>
                            {[
                                row.bookingNo,
                                dates,
                                row.selectedPackage,
                                row.quotationNo ? `Quote ${row.quotationNo}` : '',
                                row.phone
                            ]
                                .filter(value => value && value !== 'N/A')
                                .join(' · ')}
                        </Typography>
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.875rem' }}>
                            <strong>{rupees(money.received)}</strong>
                            <Box component='span' sx={{ color: 'text.secondary' }}>
                                {' '}
                                of {rupees(money.price)} received
                            </Box>
                        </Typography>
                        <LinearProgress
                            variant='determinate'
                            value={money.share * 100}
                            color={money.balance ? 'primary' : 'success'}
                            sx={{ height: 4, borderRadius: 2, mt: 0.75, maxWidth: 240 }}
                            aria-label={`${Math.round(money.share * 100)}% received`}
                        />
                    </Box>

                    <Box sx={{ flex: 1.4, minWidth: 0 }}>
                        <Stack direction='row' spacing={0.5} alignItems='center' sx={{ mb: 0.5 }}>
                            {steps.map(item =>
                                progress[item.key] ? (
                                    <CheckCircle
                                        key={item.key}
                                        sx={{ fontSize: 16, color: 'success.main' }}
                                        titleAccess={item.label}
                                    />
                                ) : (
                                    <RadioButtonUnchecked
                                        key={item.key}
                                        sx={{ fontSize: 16, color: 'text.disabled' }}
                                        titleAccess={item.label}
                                    />
                                )
                            )}
                            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', pl: 0.5 }}>
                                {doneCount(progress, steps)} of {steps.length}
                            </Typography>
                        </Stack>
                        <Typography
                            sx={{
                                fontSize: '0.875rem',
                                color: step ? 'text.primary' : 'success.main',
                                fontWeight: 500
                            }}
                        >
                            {step ? `Next: ${step.next}` : 'Ready to travel'}
                            {soon ? (
                                <Box component='span' sx={{ color: 'error.main', fontWeight: 600 }}>
                                    {` · ${soon}`}
                                </Box>
                            ) : null}
                        </Typography>
                    </Box>
                </Stack>
            </ButtonBase>
        </Box>
    )
}

BookingRow.propTypes = {
    row: rowShape.isRequired,
    progress: progressShape.isRequired,
    steps: PropTypes.arrayOf(
        PropTypes.shape({ key: PropTypes.string, label: PropTypes.string, next: PropTypes.string })
    ).isRequired,
    onOpen: PropTypes.func.isRequired
}

const BOX_SX = { '& .MuiInputBase-root': { height: 34 } }

function SelectFilter({ label, value, options, onChange, width = 160 }) {
    return (
        <TextField
            select
            size='small'
            label={label}
            value={value || 'All'}
            onChange={event => onChange(event.target.value === 'All' ? '' : event.target.value)}
            sx={{ width: { xs: '100%', md: width }, ...BOX_SX }}
            inputProps={{ 'aria-label': label }}
        >
            <MenuItem value='All'>All</MenuItem>
            {options.map(option => (
                <MenuItem key={option.value} value={option.value}>
                    {option.label}
                </MenuItem>
            ))}
        </TextField>
    )
}

SelectFilter.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })).isRequired,
    onChange: PropTypes.func.isRequired,
    width: PropTypes.number
}

function DateBox({ label, value, onChange }) {
    return (
        <TextField
            type='date'
            size='small'
            label={label}
            value={value}
            onChange={event => onChange(event.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ 'aria-label': label }}
            sx={{ width: { xs: '100%', md: 150 }, ...BOX_SX }}
        />
    )
}

DateBox.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.string, onChange: PropTypes.func.isRequired }

const snack = (message, color) =>
    openSnackbar({
        open: true,
        message,
        variant: 'alert',
        alert: { color },
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
    })

/**
 * What sales has asked operations to book, across every booking, oldest first: the first thing the operations team
 * looks at. It shows only to those who can answer, and only while something is waiting.
 */
function RequestQueue({ onOpen }) {
    const { data } = useGetServiceRequestsQuery({ status: 'Open' }, { refetchOnMountOrArgChange: true })
    const waiting = Array.isArray(data?.data) ? data.data : []
    if (!data?.summary?.canAnswer || !waiting.length) return null
    return (
        <Box sx={{ border: '1px solid', borderColor: 'warning.main', borderRadius: 2, px: 2, pt: 1.5, pb: 0.5 }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>
                {`Waiting for operations (${waiting.length})`}
            </Typography>
            <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                Sales asked for these hotels and transport. Open the booking to add them.
            </Typography>
            <Box component='ul' sx={{ m: 0, p: 0 }} aria-label='Requests from sales'>
                {waiting.slice(0, 8).map(request => (
                    <RequestRow key={request.id} request={request} withBooking onOpen={item => onOpen(item.leadId)} />
                ))}
            </Box>
            {waiting.length > 8 ? (
                <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', pb: 1 }}>
                    {`${waiting.length - 8} more waiting`}
                </Typography>
            ) : null}
        </Box>
    )
}

RequestQueue.propTypes = { onOpen: PropTypes.func.isRequired }

/**
 * Confirmed bookings: where each one stands and what to do next, upcoming trips first. A page at a time — the server
 * works out stage, search, filters, order and the chip counts — and everything about a booking (hotels, transport,
 * payments, voucher) is one click away on its own page. The stage and filters live in the address bar.
 */
function BookingsPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useDispatch()
    const [search, setSearch] = useState('')
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

    const { stage, ...values } = useMemo(() => filtersFromSearch(location.search), [location.search])

    // ? search once the agent stops typing, from the first page
    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(search.trim())
            setPage(0)
        }, 350)
        return () => clearTimeout(timer)
    }, [search])

    const setFilters = next => {
        setPage(0)
        navigate({ pathname: location.pathname, search: searchWithFilters(location.search, next) }, { replace: true })
    }

    const args = { stage, q: query, ...values }
    const { data, isLoading, isFetching, isError, refetch } = useGetBookingsPageQuery(
        { page, pageSize, ...args },
        { refetchOnMountOrArgChange: true }
    )

    // ? what this person may see of suppliers: sales has no supplier column, filter or step
    const suppliers = data?.summary?.access?.suppliers || 'manage'
    const steps = stepsFor(suppliers)
    const rows = Array.isArray(data?.data) ? data.data : []
    const count = Number(data?.count) || 0
    const summary = data?.summary || { total: 0, toCollect: 0, stages: {} }
    const total = Number(summary.total) || 0
    const pages = Math.max(1, Math.ceil(count / pageSize))
    const from = count ? page * pageSize + 1 : 0
    const to = Math.min(count, (page + 1) * pageSize)
    const filtered = hasAnyFilter(values, query)

    const clearFilters = () => {
        setSearch('')
        setQuery('')
        setFilters({ ...EMPTY_FILTERS })
    }

    const exportCurrent = () => downloadCsv(bookingsCsv(rows, suppliers), 'bookings.csv')

    const exportAll = async () => {
        try {
            const all = []
            const wanted = Math.min(count, EXPORT_CAP)
            for (let next = 0; all.length < wanted; next += 1) {
                // eslint-disable-next-line no-await-in-loop
                const { data: reply } = await dispatch(
                    getBookingsPage.initiate({ page: next, pageSize: 100, ...args }, { forceRefetch: true })
                )
                const batch = Array.isArray(reply?.data) ? reply.data : []
                all.push(...batch)
                if (batch.length < 100) break
            }
            downloadCsv(bookingsCsv(all.slice(0, EXPORT_CAP), suppliers), 'bookings-all.csv')
            if (count > EXPORT_CAP) {
                dispatch(
                    snack(
                        `Exported the first ${EXPORT_CAP} of ${count} bookings. Narrow the filters to get the rest.`,
                        'warning'
                    )
                )
            }
        } catch (error) {
            dispatch(snack('Couldn’t export the bookings.', 'error'))
        }
    }

    // ? nothing yet (no booking exists) or nothing matches (the filters or the stage hide them all)
    const emptyKind = filtered || (stage !== 'all' && total) ? 'filtered' : 'first'

    return (
        <MainCard content={false} sx={{ py: '2px' }}>
            <Stack spacing={2} sx={{ py: 1.5, px: { xs: 2, sm: 2.5 } }}>
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        flexDirection: { xs: 'column', md: 'row' }
                    }}
                >
                    <Box>
                        <Typography variant='h3' component='h1'>
                            Bookings
                        </Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                            {total
                                ? `${total} booking${total === 1 ? '' : 's'} · ${rupees(summary.toCollect)} still to collect from guests · ${Number(summary.stages?.action) || 0} not started`
                                : 'A booking appears here when a quotation is converted.'}
                        </Typography>
                    </Box>
                    <CSVExport handleExcelClick={exportCurrent} exportAllFunc={exportAll} />
                </Box>

                <RequestQueue onOpen={leadId => navigate(`/process/packages/${leadId}`)} />

                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap role='group' aria-label='Show bookings'>
                    <StagePill
                        label='All'
                        count={total}
                        selected={stage === 'all'}
                        onClick={() => setFilters({ stage: 'all' })}
                    />
                    {STAGES.map(item => (
                        <StagePill
                            key={item.key}
                            label={item.label}
                            count={Number(summary.stages?.[item.key]) || 0}
                            selected={stage === item.key}
                            onClick={() => setFilters({ stage: item.key })}
                        />
                    ))}
                </Stack>

                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1.5}
                    alignItems={{ md: 'center' }}
                    useFlexGap
                    flexWrap='wrap'
                >
                    <TextField
                        size='small'
                        placeholder='Search guest, phone, email or booking no.'
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        sx={{ width: { xs: '100%', md: 340 }, ...BOX_SX }}
                        InputProps={{
                            inputProps: { 'aria-label': 'Search bookings' },
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <Search fontSize='small' />
                                </InputAdornment>
                            )
                        }}
                    />
                    <DateBox
                        label='Created from'
                        value={values.createdFrom}
                        onChange={day => setFilters({ createdFrom: day })}
                    />
                    <DateBox
                        label='Created to'
                        value={values.createdTo}
                        onChange={day => setFilters({ createdTo: day })}
                    />
                    <DateBox
                        label='Travel from'
                        value={values.travelFrom}
                        onChange={day => setFilters({ travelFrom: day })}
                    />
                    <DateBox
                        label='Travel to'
                        value={values.travelTo}
                        onChange={day => setFilters({ travelTo: day })}
                    />
                    <SelectFilter
                        label='Guest payment'
                        value={values.guestPayment}
                        options={PAYMENT_OPTIONS}
                        onChange={value => setFilters({ guestPayment: value })}
                    />
                    {suppliers === 'none' ? null : (
                        <SelectFilter
                            label='Supplier payment'
                            value={values.supplierPayment}
                            options={PAYMENT_OPTIONS}
                            onChange={value => setFilters({ supplierPayment: value })}
                        />
                    )}
                    <SelectFilter
                        label='Invoice'
                        value={values.invoice}
                        options={INVOICE_OPTIONS}
                        onChange={value => setFilters({ invoice: value })}
                    />
                    <AssigneeFilter
                        label='Converted by'
                        value={values.convertedBy}
                        onChange={id => setFilters({ convertedBy: id })}
                        width={180}
                    />
                    {filtered && (
                        <CustomButton
                            variant='text'
                            customStyles={{
                                color: 'error.main',
                                '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
                            }}
                            startIcon={<FilterAltOff />}
                            onClick={clearFilters}
                        >
                            Clear filters
                        </CustomButton>
                    )}
                </Stack>

                {isLoading ? (
                    <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : null}

                {isError ? (
                    <Stack direction='row' spacing={1.5} alignItems='center' sx={{ py: 3 }} role='alert'>
                        <Typography color='error'>Couldn’t load the bookings.</Typography>
                        <Button onClick={refetch}>Try again</Button>
                    </Stack>
                ) : null}

                {!isLoading && !isError ? (
                    <>
                        {rows.length ? (
                            <Box component='ul' sx={{ m: 0, p: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
                                {rows.map(row => (
                                    <BookingRow
                                        key={row.id}
                                        row={row}
                                        progress={progressOf({ booking: row })}
                                        steps={steps}
                                        onOpen={() => navigate(`/process/packages/${row.leadId}`)}
                                    />
                                ))}
                            </Box>
                        ) : (
                            <ListEmptyState
                                kind={emptyKind || 'first'}
                                noun='bookings'
                                title='No confirmed bookings yet'
                                text='A booking appears here when a quotation is converted.'
                                onClear={clearFilters}
                            />
                        )}

                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1.5}
                            justifyContent='space-between'
                            alignItems={{ sm: 'center' }}
                        >
                            <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }} role='status'>
                                {count
                                    ? `Showing ${from}–${to} of ${count} booking${count === 1 ? '' : 's'}`
                                    : '0 bookings'}
                                {filtered && total ? ` (filtered from ${total})` : ''}
                                {isFetching ? ' · Updating…' : ''}
                            </Typography>
                            <Stack direction='row' spacing={1.5} alignItems='center'>
                                <TextField
                                    select
                                    size='small'
                                    label='Rows'
                                    value={pageSize}
                                    onChange={event => {
                                        setPageSize(Number(event.target.value))
                                        setPage(0)
                                    }}
                                    sx={{ width: 90, ...BOX_SX }}
                                    inputProps={{ 'aria-label': 'Rows per page' }}
                                >
                                    {PAGE_SIZES.map(size => (
                                        <MenuItem key={size} value={size}>
                                            {size}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                {count > pageSize ? (
                                    <Pagination
                                        count={pages}
                                        page={page + 1}
                                        onChange={(event, value) => setPage(value - 1)}
                                        shape='rounded'
                                        size='small'
                                        aria-label='Pages of bookings'
                                    />
                                ) : null}
                            </Stack>
                        </Stack>
                    </>
                ) : null}
            </Stack>
        </MainCard>
    )
}

export default BookingsPage
