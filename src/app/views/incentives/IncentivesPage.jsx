import { useMemo, useState } from 'react'
import {
    Alert,
    Box,
    LinearProgress,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography
} from '@mui/material'
import { useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import ListEmptyState from '@/core/listing/ListEmptyState'
import { csvOf, downloadCsv, searchWithValues } from '@/core/listing/listingFacts'
import { cleanMonth, oneOf } from '@/core/listing/screenFacts'
import { ClearFiltersButton, CountText, SearchBox, SelectBox, ToolbarRow } from '@/core/listing/ScreenToolbar'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import MainCard from '@core/components/extended/MainCard'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useGetIncentiveReportQuery, useGetMyIncentivesQuery } from '@/app/store/slices/api/gstSlice'
import PropTypes from 'prop-types'
import { errorText, money2, thisMonth } from '../gst/gstFacts'
import { BookingsTable, Figure, PersonDialog, ProfitCell, SeriesTable } from './incentiveParts'
import { PLAN_FILTERS, TEAM_COLUMNS, earnedNote, filterTeamRows } from './incentiveFacts'
import PlansPanel from './PlansPanel'

/** @description the signed-in person's own month: what they sold and earned, booking by booking, and their last months */
function OwnMonth({ me }) {
    const { summary } = me
    return (
        <Stack spacing={3}>
            <Stack direction='row' spacing={4} flexWrap='wrap' useFlexGap>
                <Figure label='Packages sold' value={summary.packages} />
                <Figure label='Sales (no GST)' value={money2(summary.sales)} />
                <Figure label='You earned' value={money2(summary.earned.total)} note={earnedNote(summary.earned)} />
            </Stack>
            <Box>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Your bookings this month</Typography>
                <BookingsTable bookings={me.bookings} />
            </Box>
            <Box>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Last months</Typography>
                <SeriesTable series={me.series} />
            </Box>
        </Stack>
    )
}

OwnMonth.propTypes = {
    me: PropTypes.shape({
        summary: PropTypes.shape({
            packages: PropTypes.number,
            sales: PropTypes.number,
            earned: PropTypes.shape({ total: PropTypes.number })
        }).isRequired,
        bookings: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number })).isRequired,
        series: PropTypes.arrayOf(PropTypes.shape({ month: PropTypes.string })).isRequired
    }).isRequired
}

/** @description the whole team's month for an admin: each person's packages, sales, profit and earnings */
function TeamMonth({ month }) {
    const { data, isFetching, error } = useGetIncentiveReportQuery(month)
    const [person, setPerson] = useState(null)
    const [params, setParams] = useSearchParams()
    const search = params.toString()
    const q = (params.get('q') || '').trim().slice(0, 100)
    const plan = oneOf(
        params.get('plan'),
        PLAN_FILTERS.map(item => item.value)
    )
    const setFilters = patch => setParams(new URLSearchParams(searchWithValues(search, patch)), { replace: true })
    const report = data?.data
    const rows = useMemo(() => filterTeamRows(report?.rows, { q, plan }), [report, q, plan])
    const filtered = Boolean(q || plan)
    const exportShown = () => downloadCsv(csvOf(rows, TEAM_COLUMNS), `Team incentives ${month}.csv`)
    return (
        <Stack spacing={2}>
            {isFetching && <LinearProgress />}
            {error && <Alert severity='error'>{errorText(error, 'Couldn’t load the report.')}</Alert>}
            {report && (
                <>
                    <Stack direction='row' spacing={4} flexWrap='wrap' useFlexGap>
                        <Figure
                            label='Packages sold'
                            value={report.totals.packages}
                            note={`${report.totals.leads} leads`}
                        />
                        <Figure
                            label='Sales (no GST)'
                            value={money2(report.totals.sales)}
                            note={`GST ${money2(report.totals.gst)}`}
                        />
                        <Figure
                            label='Profit'
                            value={money2(report.totals.profit)}
                            note={report.totals.costPending ? `${report.totals.costPending} bookings cost pending` : ''}
                        />
                        <Figure label='Incentives earned' value={money2(report.totals.earned)} />
                    </Stack>
                    <ToolbarRow>
                        <SearchBox
                            value={q}
                            onCommit={value => setFilters({ q: value })}
                            noun='people'
                            placeholder='Search a person'
                            width={260}
                        />
                        <SelectBox
                            label='Plan'
                            value={plan}
                            onChange={value => setFilters({ plan: value })}
                            options={PLAN_FILTERS}
                            allLabel='Any plan'
                        />
                        {filtered && <ClearFiltersButton onClick={() => setFilters({ q: '', plan: '' })} />}
                        <CountText count={rows.length} noun={rows.length === 1 ? 'person' : 'people'} />
                        <UiAccessGuard>
                            <CSVExport handleExcelClick={exportShown} exportAllFunc={exportShown} />
                        </UiAccessGuard>
                    </ToolbarRow>
                    {!rows.length && (
                        <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: '12px' }}>
                            <ListEmptyState
                                kind={filtered ? 'filtered' : 'first'}
                                noun='people'
                                title='No one on the team yet'
                                text='People appear here once they are added as users.'
                                canAdd={false}
                                onClear={() => setFilters({ q: '', plan: '' })}
                            />
                        </Box>
                    )}
                    <Box sx={{ overflowX: 'auto', display: rows.length ? 'block' : 'none' }}>
                        <Table size='small'>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Person</TableCell>
                                    <TableCell align='right'>Leads</TableCell>
                                    <TableCell align='right'>Packages</TableCell>
                                    <TableCell align='right'>Sales (no GST)</TableCell>
                                    <TableCell align='right'>Profit</TableCell>
                                    <TableCell>Plan</TableCell>
                                    <TableCell align='right'>Earned</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map(row => (
                                    <TableRow
                                        key={row.user.id}
                                        hover
                                        onClick={() => setPerson(row.user.id)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <TableCell>
                                            <strong>{row.user.name}</strong>
                                            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                                                {row.user.active ? row.user.role : 'No longer active'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align='right'>{row.leads}</TableCell>
                                        <TableCell align='right'>{row.packages}</TableCell>
                                        <TableCell align='right'>{money2(row.sales)}</TableCell>
                                        <TableCell align='right'>
                                            <ProfitCell profit={row.profit} pending={row.costPending} />
                                        </TableCell>
                                        <TableCell>
                                            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                                                {row.plan?.summary || 'No plan'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align='right'>
                                            <strong>{money2(row.earned.total)}</strong>
                                            {earnedNote(row.earned) && (
                                                <Typography color='text.secondary' sx={{ fontSize: '0.75rem' }}>
                                                    {earnedNote(row.earned)}
                                                </Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                    <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                        A package counts in the month it was confirmed, for the person who converted it. Sales and
                        profit leave out GST. Click a person for their bookings and earlier months.
                    </Typography>
                </>
            )}
            <PersonDialog userId={person} month={month} onClose={() => setPerson(null)} />
        </Stack>
    )
}

TeamMonth.propTypes = { month: PropTypes.string.isRequired }

/**
 * Sales, profit and incentives. The agency's owner and admins see the whole team for a month and set how each person earns;
 * everyone else sees only their own month.
 */
function IncentivesPage() {
    const dispatch = useDispatch()
    const [params, setParams] = useSearchParams()
    const month = cleanMonth(params.get('month')) || thisMonth()
    const setMonth = value =>
        setParams(new URLSearchParams(searchWithValues(params.toString(), { month: value })), { replace: true })
    const [tab, setTab] = useState('team')
    const { data, isFetching, error } = useGetMyIncentivesQuery({ month })
    const me = data?.data
    const canManage = Boolean(me?.canManage)

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

    return (
        <MainCard title='Incentives'>
            <Stack spacing={2.5}>
                <Stack direction='row' spacing={2} alignItems='center' flexWrap='wrap' useFlexGap>
                    <TextField
                        size='small'
                        type='month'
                        label='Month'
                        value={month}
                        onChange={event => event.target.value && setMonth(event.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    {canManage && (
                        <Tabs value={tab} onChange={(event, next) => setTab(next)}>
                            <Tab value='team' label='Team' />
                            <Tab value='plans' label='Plans' />
                        </Tabs>
                    )}
                </Stack>
                {isFetching && !me && <LinearProgress />}
                {error && <Alert severity='error'>{errorText(error, 'Couldn’t load your incentives.')}</Alert>}
                {canManage && tab === 'team' && <TeamMonth month={month} />}
                {canManage && tab === 'plans' && <PlansPanel notify={notify} />}
                {me && !canManage && !me.noSales && <OwnMonth me={me} />}
                {me?.noSales && !canManage && (
                    <Alert severity='info'>This login has no sales of its own to show.</Alert>
                )}
            </Stack>
        </MainCard>
    )
}

export default IncentivesPage
