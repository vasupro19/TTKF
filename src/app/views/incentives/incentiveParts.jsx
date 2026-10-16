import PropTypes from 'prop-types'
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography
} from '@mui/material'
import { useGetIncentiveUserQuery } from '@/app/store/slices/api/gstSlice'
import { errorText, money2, monthName } from '../gst/gstFacts'
import { earnedNote } from './incentiveFacts'

export function Figure({ label, value, note = '' }) {
    return (
        <Box sx={{ minWidth: 130 }}>
            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 600 }}>{value}</Typography>
            {note && (
                <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                    {note}
                </Typography>
            )}
        </Box>
    )
}

Figure.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.node.isRequired, note: PropTypes.string }

const cell = { whiteSpace: 'nowrap' }

/** @description profit of a month with its "cost pending" flag: a booking with no cost recorded has no profit yet */
export function ProfitCell({ profit, pending }) {
    return (
        <>
            {money2(profit)}
            {pending > 0 && (
                <Tooltip title='No cost has been recorded for these bookings yet, so they have no profit and earn nothing on a profit plan'>
                    <Chip
                        size='small'
                        color='warning'
                        variant='outlined'
                        label={`${pending} cost pending`}
                        sx={{ ml: 1 }}
                    />
                </Tooltip>
            )}
        </>
    )
}

ProfitCell.propTypes = { profit: PropTypes.number.isRequired, pending: PropTypes.number }

/** @description a month's bookings, each with what it added to the person's earnings */
export function BookingsTable({ bookings }) {
    if (!bookings.length) {
        return (
            <Typography color='text.secondary' sx={{ py: 3, textAlign: 'center' }}>
                No packages sold this month.
            </Typography>
        )
    }
    return (
        <Box sx={{ overflowX: 'auto' }}>
            <Table size='small'>
                <TableHead>
                    <TableRow>
                        <TableCell>Booking</TableCell>
                        <TableCell align='right'>Sales (no GST)</TableCell>
                        <TableCell align='right'>GST</TableCell>
                        <TableCell align='right'>Cost</TableCell>
                        <TableCell align='right'>Profit</TableCell>
                        <TableCell align='right'>Earned</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {bookings.map(booking => (
                        <TableRow key={booking.id}>
                            <TableCell sx={cell}>
                                <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                                    {booking.guestName || 'Guest'}
                                </Typography>
                                <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                                    {[booking.bookingNo, booking.selectedPackage].filter(Boolean).join(' · ')}
                                </Typography>
                            </TableCell>
                            <TableCell align='right'>{money2(booking.sales)}</TableCell>
                            <TableCell align='right'>{money2(booking.gst)}</TableCell>
                            <TableCell align='right'>{booking.costKnown ? money2(booking.cost) : '—'}</TableCell>
                            <TableCell align='right'>
                                {booking.costKnown ? (
                                    money2(booking.profit)
                                ) : (
                                    <Chip size='small' color='warning' variant='outlined' label='cost pending' />
                                )}
                            </TableCell>
                            <TableCell align='right'>
                                <strong>{money2(booking.earned)}</strong>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    )
}

BookingsTable.propTypes = {
    bookings: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number,
            guestName: PropTypes.string,
            bookingNo: PropTypes.string,
            selectedPackage: PropTypes.string,
            sales: PropTypes.number,
            gst: PropTypes.number,
            cost: PropTypes.number,
            costKnown: PropTypes.bool,
            profit: PropTypes.number,
            earned: PropTypes.number
        })
    ).isRequired
}

/** @description a person's last months side by side: packages, sales, profit, earned */
export function SeriesTable({ series }) {
    return (
        <Box sx={{ overflowX: 'auto' }}>
            <Table size='small'>
                <TableHead>
                    <TableRow>
                        <TableCell>Month</TableCell>
                        <TableCell align='right'>Packages</TableCell>
                        <TableCell align='right'>Sales (no GST)</TableCell>
                        <TableCell align='right'>Profit</TableCell>
                        <TableCell align='right'>Earned</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {[...series].reverse().map(row => (
                        <TableRow key={row.month}>
                            <TableCell>{monthName(row.month)}</TableCell>
                            <TableCell align='right'>{row.packages}</TableCell>
                            <TableCell align='right'>{money2(row.sales)}</TableCell>
                            <TableCell align='right'>
                                <ProfitCell profit={row.profit} pending={row.costPending} />
                            </TableCell>
                            <TableCell align='right'>
                                <strong>{money2(row.earned.total)}</strong>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    )
}

SeriesTable.propTypes = {
    series: PropTypes.arrayOf(
        PropTypes.shape({
            month: PropTypes.string,
            packages: PropTypes.number,
            sales: PropTypes.number,
            profit: PropTypes.number,
            costPending: PropTypes.number,
            earned: PropTypes.shape({ total: PropTypes.number })
        })
    ).isRequired
}

/** @description one person's month for an admin: their plan, the month's figures and bookings, and their last months */
export function PersonDialog({ userId, month, onClose }) {
    const { data, isFetching, error } = useGetIncentiveUserQuery({ userId, month }, { skip: !userId })
    if (!userId) return null
    const person = data?.data
    const summary = person?.summary
    return (
        <Dialog open onClose={onClose} fullWidth maxWidth='md'>
            <DialogTitle>
                {person?.user?.name || 'Incentives'} · {monthName(month)}
            </DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity='error'>{errorText(error, 'Couldn’t load this person’s incentives.')}</Alert>}
                {isFetching && !person && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <CircularProgress size={28} />
                    </Box>
                )}
                {person && (
                    <>
                        <Typography color='text.secondary' sx={{ mb: 2, fontSize: '0.9375rem' }}>
                            {person.plan
                                ? `Plan: ${person.plan.summary}`
                                : 'No incentive plan applies to this person this month.'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: 3 }}>
                            <Figure
                                label='Packages sold'
                                value={summary.packages}
                                note={`${summary.leads} leads received`}
                            />
                            <Figure label='Sales (no GST)' value={money2(summary.sales)} />
                            <Figure
                                label='Profit'
                                value={money2(summary.profit)}
                                note={summary.costPending ? `${summary.costPending} cost pending` : ''}
                            />
                            <Figure
                                label='Earned'
                                value={money2(summary.earned.total)}
                                note={earnedNote(summary.earned)}
                            />
                        </Box>
                        <Typography sx={{ fontWeight: 600, mb: 1 }}>This month’s bookings</Typography>
                        <BookingsTable bookings={person.bookings} />
                        <Typography sx={{ fontWeight: 600, mt: 3, mb: 1 }}>Last months</Typography>
                        <SeriesTable series={person.series} />
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    )
}

PersonDialog.propTypes = {
    userId: PropTypes.number,
    month: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired
}
