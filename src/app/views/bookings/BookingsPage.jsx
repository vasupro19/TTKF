import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import {
    Box,
    Button,
    ButtonBase,
    CircularProgress,
    InputAdornment,
    LinearProgress,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { CheckCircle, RadioButtonUnchecked, Search } from '@mui/icons-material'
import MainCard from '@core/components/extended/MainCard'
import { useGetAllConfirmedPackagesQuery } from '@/app/store/slices/api/packageConvert'
import {
    STAGES,
    STEPS,
    dateRange,
    doneCount,
    guestMoney,
    nextStep,
    rupees,
    urgency,
    visibleBookings
} from './bookingFacts'

const rowShape = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    leadId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    guestName: PropTypes.string,
    phone: PropTypes.string,
    selectedPackage: PropTypes.string,
    quotationNo: PropTypes.number,
    travelDate: PropTypes.string,
    travelEnd: PropTypes.string
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

function BookingRow({ row, progress, onOpen }) {
    const money = guestMoney(row)
    const step = nextStep(progress)
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
                            {[dates, row.selectedPackage, row.quotationNo ? `Quote ${row.quotationNo}` : '', row.phone]
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
                            {STEPS.map(item =>
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
                                {doneCount(progress)} of {STEPS.length}
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
    onOpen: PropTypes.func.isRequired
}

/**
 * Confirmed bookings: where each one stands and what to do next, the soonest trip first. Everything about a
 * booking — hotels, transport, payments, voucher — is one click away on its own page.
 */
function BookingsPage() {
    const navigate = useNavigate()
    const { data, isLoading, isFetching, isError, refetch } = useGetAllConfirmedPackagesQuery(undefined, {
        refetchOnMountOrArgChange: true
    })
    const [stage, setStage] = useState('all')
    const [search, setSearch] = useState('')

    const rows = useMemo(() => (Array.isArray(data?.data) ? data.data : []), [data])
    const everyBooking = useMemo(() => visibleBookings(rows), [rows])
    const shown = useMemo(() => visibleBookings(rows, { stage, search }), [rows, stage, search])
    const counts = Object.fromEntries(
        STAGES.map(item => [item.key, everyBooking.filter(b => b.stage === item.key).length])
    )
    const toCollect = rows.reduce((sum, row) => sum + guestMoney(row).balance, 0)

    return (
        <MainCard sx={{ py: 2 }} contentSX={{ px: { xs: 2, sm: 3 }, py: 2 }}>
            <Box
                sx={{
                    maxWidth: 1100,
                    '& .MuiButton-root': { textTransform: 'none' },
                    '& .MuiInputBase-input': { fontSize: '1rem' }
                }}
            >
                <Typography
                    color='text.secondary'
                    sx={{ fontSize: '0.8125rem', letterSpacing: '0.08em', fontWeight: 600 }}
                >
                    BOOKINGS
                </Typography>
                <Typography component='h1' sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 600, mt: 0.5 }}>
                    Confirmed bookings
                </Typography>
                <Typography color='text.secondary' sx={{ fontSize: '1rem', mt: 0.5, mb: 3 }}>
                    {rows.length
                        ? `${rows.length} booking${rows.length === 1 ? '' : 's'} · ${rupees(toCollect)} still to collect from guests · ${counts.action} not started`
                        : 'A booking appears here when a quotation is converted.'}
                </Typography>

                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    justifyContent='space-between'
                    sx={{ mb: 2 }}
                >
                    <Stack
                        direction='row'
                        spacing={1}
                        flexWrap='wrap'
                        useFlexGap
                        role='group'
                        aria-label='Show bookings'
                    >
                        <StagePill
                            label='All'
                            count={rows.length}
                            selected={stage === 'all'}
                            onClick={() => setStage('all')}
                        />
                        {STAGES.map(item => (
                            <StagePill
                                key={item.key}
                                label={item.label}
                                count={counts[item.key]}
                                selected={stage === item.key}
                                onClick={() => setStage(item.key)}
                            />
                        ))}
                    </Stack>
                    <TextField
                        size='small'
                        placeholder='Search guest, phone or email'
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        sx={{ width: { xs: '100%', md: 300 } }}
                        InputProps={{
                            inputProps: { 'aria-label': 'Search bookings' },
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <Search fontSize='small' />
                                </InputAdornment>
                            )
                        }}
                    />
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
                        {shown.length ? (
                            <Box component='ul' sx={{ m: 0, p: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
                                {shown.map(item => (
                                    <BookingRow
                                        key={item.row.id}
                                        row={item.row}
                                        progress={item.progress}
                                        onOpen={() => navigate(`/process/packages/${item.row.leadId}`)}
                                    />
                                ))}
                            </Box>
                        ) : (
                            <Typography color='text.secondary' sx={{ py: 4 }}>
                                {rows.length ? 'No bookings match.' : 'No confirmed bookings yet.'}
                            </Typography>
                        )}
                        {isFetching ? (
                            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mt: 1 }} role='status'>
                                Updating…
                            </Typography>
                        ) : null}
                    </>
                ) : null}
            </Box>
        </MainCard>
    )
}

export default BookingsPage
