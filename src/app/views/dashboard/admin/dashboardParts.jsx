import PropTypes from 'prop-types'
import { Link as RouterLink } from 'react-router-dom'
import {
    Alert,
    Box,
    Button,
    ButtonBase,
    Chip,
    MenuItem,
    Paper,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { ArrowForward, CallOutlined, FlightTakeoffOutlined } from '@mui/icons-material'
import AssigneeFilter from '@/core/components/AssigneeFilter'
import { STAGES, clockTime, relativeTime, shortDate, stageDetail, stageMeta } from '@/app/views/tables/leads/leadStages'
import { PERIODS, kpiCards, paymentMeta, percentText, plural, rupees } from './dashboardHelpers'

const idType = PropTypes.oneOfType([PropTypes.number, PropTypes.string])

/** @description a white panel with a title, an optional line under it and an optional link on the right */
export function Panel({ title, subtitle, action, children, testId }) {
    return (
        <Paper
            elevation={0}
            data-testid={testId}
            sx={{
                p: { xs: 2, md: 2.5 },
                borderRadius: '14px',
                border: '1px solid',
                borderColor: 'divider',
                height: '100%'
            }}
        >
            <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={1} sx={{ mb: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography component='h2' sx={{ fontWeight: 700, fontSize: '1rem' }}>
                        {title}
                    </Typography>
                    {subtitle ? (
                        <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mt: 0.25 }}>
                            {subtitle}
                        </Typography>
                    ) : null}
                </Box>
                {action}
            </Stack>
            {children}
        </Paper>
    )
}

Panel.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.node,
    action: PropTypes.node,
    children: PropTypes.node,
    testId: PropTypes.string
}

/** @description a small "See all →" link for a panel's corner */
export function PanelLink({ to, children }) {
    return (
        <Button
            component={RouterLink}
            to={to}
            size='small'
            endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
            sx={{ textTransform: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
            {children}
        </Button>
    )
}

PanelLink.propTypes = { to: PropTypes.string.isRequired, children: PropTypes.node.isRequired }

export function EmptyNote({ children }) {
    return (
        <Typography color='text.secondary' sx={{ fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
            {children}
        </Typography>
    )
}

EmptyNote.propTypes = { children: PropTypes.node.isRequired }

// ---------------------------------------------------------------- header

export function DashboardHeader({
    greeting,
    agency,
    periodText,
    period,
    custom,
    onPeriod,
    onCustom,
    showAssignee,
    assignedTo,
    onAssignedTo
}) {
    return (
        <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            justifyContent='space-between'
            alignItems={{ lg: 'flex-end' }}
            sx={{ mb: 3 }}
        >
            <Box>
                <Typography component='h1' sx={{ fontWeight: 800, fontSize: { xs: '1.4rem', md: '1.75rem' } }}>
                    {greeting}
                </Typography>
                <Typography color='text.secondary' sx={{ fontSize: '0.9rem', mt: 0.5 }}>
                    {[agency, periodText].filter(Boolean).join(' · ')}
                </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} useFlexGap>
                <TextField
                    select
                    size='small'
                    label='Period'
                    value={period}
                    onChange={event => onPeriod(event.target.value)}
                    sx={{ width: { xs: '100%', sm: 170 }, '& .MuiInputBase-root': { height: 34 } }}
                    inputProps={{ 'aria-label': 'Period' }}
                >
                    {PERIODS.map(item => (
                        <MenuItem key={item.key} value={item.key}>
                            {item.label}
                        </MenuItem>
                    ))}
                </TextField>
                {period === 'custom' ? (
                    <Stack direction='row' spacing={1}>
                        {['from', 'to'].map(side => (
                            <TextField
                                key={side}
                                type='date'
                                size='small'
                                label={side === 'from' ? 'From' : 'To'}
                                value={custom[side] || ''}
                                onChange={event => onCustom({ ...custom, [side]: event.target.value })}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 160, '& .MuiInputBase-root': { height: 34 } }}
                            />
                        ))}
                    </Stack>
                ) : null}
                <AssigneeFilter value={assignedTo} onChange={onAssignedTo} show={showAssignee} />
            </Stack>
        </Stack>
    )
}

DashboardHeader.propTypes = {
    greeting: PropTypes.string.isRequired,
    agency: PropTypes.string,
    periodText: PropTypes.string,
    period: PropTypes.string.isRequired,
    custom: PropTypes.shape({ from: PropTypes.string, to: PropTypes.string }).isRequired,
    onPeriod: PropTypes.func.isRequired,
    onCustom: PropTypes.func.isRequired,
    showAssignee: PropTypes.bool.isRequired,
    assignedTo: PropTypes.string.isRequired,
    onAssignedTo: PropTypes.func.isRequired
}

// ---------------------------------------------------------------- KPIs

function KpiCard({ card }) {
    const body = (
        <Box sx={{ p: 2, width: '100%', textAlign: 'left' }}>
            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                {card.label}
            </Typography>
            <Typography sx={{ fontSize: { xs: '1.35rem', md: '1.6rem' }, fontWeight: 800, mt: 0.5, lineHeight: 1.2 }}>
                {card.value}
            </Typography>
            <Typography color='text.secondary' sx={{ fontSize: '0.75rem', mt: 0.5, lineHeight: 1.35 }}>
                {card.caption}
            </Typography>
        </Box>
    )
    const frame = {
        borderRadius: '14px',
        border: '1px solid',
        borderColor: card.key === 'awaitingVerification' ? 'warning.light' : 'divider',
        bgcolor: 'background.paper',
        height: '100%',
        display: 'flex',
        alignItems: 'flex-start'
    }
    if (!card.to) {
        return (
            <Box data-testid={`kpi-${card.key}`} sx={frame}>
                {body}
            </Box>
        )
    }
    return (
        <ButtonBase
            component={RouterLink}
            to={card.to}
            data-testid={`kpi-${card.key}`}
            aria-label={`${card.label}: ${card.value}. ${card.caption}`}
            sx={theme => ({
                ...frame,
                transition: 'border-color 120ms, box-shadow 120ms',
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: `0 2px 10px ${alpha(theme.palette.primary.main, 0.12)}`
                }
            })}
        >
            {body}
        </ButtonBase>
    )
}

const cardShape = PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    caption: PropTypes.string.isRequired,
    to: PropTypes.string
})

KpiCard.propTypes = { card: cardShape.isRequired }

export function KpiRow({ kpis, linkFor }) {
    const cards = kpiCards(kpis).map(card => (card.to ? { ...card, to: linkFor(card) } : card))
    return (
        <Box
            role='list'
            aria-label='Key figures'
            sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: {
                    xs: 'repeat(2, minmax(0, 1fr))',
                    md: 'repeat(3, minmax(0, 1fr))',
                    xl: 'repeat(6, minmax(0, 1fr))'
                },
                mb: 3
            }}
        >
            {cards.map(card => (
                <Box role='listitem' key={card.key} sx={{ minWidth: 0 }}>
                    <KpiCard card={card} />
                </Box>
            ))}
        </Box>
    )
}

KpiRow.propTypes = {
    kpis: PropTypes.shape({ profit: PropTypes.number }).isRequired,
    linkFor: PropTypes.func.isRequired
}

// ---------------------------------------------------------------- today

const callShape = PropTypes.shape({
    id: idType,
    at: PropTypes.string,
    overdue: PropTypes.bool,
    leadId: idType,
    name: PropTypes.string,
    phone: PropTypes.string
})

const tripShape = PropTypes.shape({
    bookingId: idType,
    leadId: idType,
    name: PropTypes.string,
    date: PropTypes.string,
    guests: PropTypes.number,
    paid: PropTypes.string
})

function ListRow({ to, icon, title, meta, chip }) {
    return (
        <Box component='li' sx={{ listStyle: 'none', borderTop: '1px solid', borderColor: 'divider' }}>
            <ButtonBase
                component={RouterLink}
                to={to}
                sx={{ width: '100%', justifyContent: 'flex-start', py: 1.25, px: 0.5, gap: 1.5, textAlign: 'left' }}
            >
                {icon}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }} noWrap>
                        {title}
                    </Typography>
                    <Typography color='text.secondary' sx={{ fontSize: '0.8rem' }} noWrap>
                        {meta}
                    </Typography>
                </Box>
                {chip}
            </ButtonBase>
        </Box>
    )
}

ListRow.propTypes = {
    to: PropTypes.string.isRequired,
    icon: PropTypes.node,
    title: PropTypes.string.isRequired,
    meta: PropTypes.string,
    chip: PropTypes.node
}

export function TodayPanel({ today, awaiting, now }) {
    const calls = today?.calls || []
    const trips = today?.trips || []
    const callsDue = Number(today?.callsDue) || 0
    const callsOverdue = Number(today?.callsOverdue) || 0
    const tripsThisWeek = Number(today?.tripsThisWeek) || 0
    const waiting = Number(awaiting?.count) || 0
    const callsLine = [`${callsDue} due today`, callsOverdue ? `${callsOverdue} overdue` : '']
        .filter(Boolean)
        .join(' · ')
    return (
        <Panel title='Today' subtitle='Calls to make and trips about to start' testId='today-panel'>
            {waiting > 0 ? (
                <Alert
                    severity='warning'
                    sx={{ mb: 2, borderRadius: '10px' }}
                    action={
                        <Button
                            component={RouterLink}
                            to='/process/transactions'
                            color='inherit'
                            size='small'
                            sx={{ textTransform: 'none' }}
                        >
                            Review
                        </Button>
                    }
                >
                    {plural(waiting, 'payment')} ({rupees(awaiting.amount)}) waiting for accounts
                </Alert>
            ) : null}
            <Box
                sx={{
                    display: 'grid',
                    gap: { xs: 2, md: 3 },
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }
                }}
            >
                <Box data-testid='today-calls'>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 0.75 }}>
                        Calls{' '}
                        <Box component='span' sx={{ color: 'text.secondary', fontWeight: 400 }}>
                            {callsLine}
                        </Box>
                    </Typography>
                    {calls.length ? (
                        <Box component='ul' sx={{ m: 0, p: 0 }}>
                            {calls.map(call => (
                                <ListRow
                                    key={call.id}
                                    to={`/process/leads/edit/${call.leadId}`}
                                    icon={<CallOutlined fontSize='small' color={call.overdue ? 'error' : 'primary'} />}
                                    title={call.name || 'Guest'}
                                    meta={[
                                        call.overdue
                                            ? `${shortDate(call.at, now)} ${clockTime(call.at)}`
                                            : clockTime(call.at),
                                        call.phone
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                    chip={
                                        call.overdue ? (
                                            <Chip size='small' color='error' variant='outlined' label='Overdue' />
                                        ) : null
                                    }
                                />
                            ))}
                        </Box>
                    ) : (
                        <EmptyNote>No calls due today</EmptyNote>
                    )}
                </Box>
                <Box data-testid='today-trips'>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 0.75 }}>
                        Trips this week{' '}
                        <Box component='span' sx={{ color: 'text.secondary', fontWeight: 400 }}>
                            {tripsThisWeek}
                        </Box>
                    </Typography>
                    {trips.length ? (
                        <Box component='ul' sx={{ m: 0, p: 0 }}>
                            {trips.map(trip => {
                                const paid = paymentMeta(trip.paid)
                                return (
                                    <ListRow
                                        key={trip.bookingId}
                                        to={`/process/packages/${trip.leadId}`}
                                        icon={<FlightTakeoffOutlined fontSize='small' color='primary' />}
                                        title={trip.name || 'Guest'}
                                        meta={[
                                            shortDate(trip.date, now),
                                            trip.guests ? plural(trip.guests, 'guest') : ''
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                        chip={
                                            <Chip
                                                size='small'
                                                color={paid.color}
                                                variant='outlined'
                                                label={paid.label}
                                            />
                                        }
                                    />
                                )
                            })}
                        </Box>
                    ) : (
                        <EmptyNote>No trips start this week</EmptyNote>
                    )}
                </Box>
            </Box>
        </Panel>
    )
}

TodayPanel.propTypes = {
    today: PropTypes.shape({
        callsDue: PropTypes.number,
        callsOverdue: PropTypes.number,
        calls: PropTypes.arrayOf(callShape),
        tripsThisWeek: PropTypes.number,
        trips: PropTypes.arrayOf(tripShape)
    }),
    awaiting: PropTypes.shape({ count: PropTypes.number, amount: PropTypes.number }),
    now: PropTypes.instanceOf(Date).isRequired
}

// ---------------------------------------------------------------- pipeline

export function PipelinePanel({ pipeline, linkFor }) {
    const total = STAGES.reduce((sum, stage) => sum + (Number(pipeline?.[stage.key]) || 0), 0)
    return (
        <Panel
            title='Pipeline'
            subtitle={`${plural(total, 'lead')} across the steps, all time — where each one is now`}
            action={<PanelLink to={linkFor('')}>All leads</PanelLink>}
            testId='pipeline'
        >
            <Box
                sx={{
                    display: 'grid',
                    gap: 1,
                    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(5, minmax(0, 1fr))' }
                }}
            >
                {STAGES.map(stage => {
                    const count = Number(pipeline?.[stage.key]) || 0
                    return (
                        <ButtonBase
                            key={stage.key}
                            component={RouterLink}
                            to={linkFor(stage.key)}
                            aria-label={`Step ${stage.step}: ${stage.label}, ${plural(count, 'lead')}`}
                            sx={{
                                display: 'block',
                                textAlign: 'left',
                                p: 1.5,
                                borderRadius: '10px',
                                bgcolor: stage.bg,
                                borderTop: `3px solid ${stage.color}`,
                                '&:hover': { filter: 'brightness(0.97)' }
                            }}
                        >
                            <Typography sx={{ fontSize: '0.75rem', color: stage.color, fontWeight: 700 }}>
                                {stage.step}. {stage.label}
                            </Typography>
                            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.3 }}>
                                {count}
                            </Typography>
                            <Typography color='text.secondary' sx={{ fontSize: '0.75rem' }} noWrap>
                                {stage.hint}
                            </Typography>
                        </ButtonBase>
                    )
                })}
            </Box>
        </Panel>
    )
}

PipelinePanel.propTypes = {
    pipeline: PropTypes.objectOf(PropTypes.number),
    linkFor: PropTypes.func.isRequired
}

// ---------------------------------------------------------------- team

const teamShape = PropTypes.shape({
    id: idType,
    name: PropTypes.string,
    leads: PropTypes.number,
    bookings: PropTypes.number,
    revenue: PropTypes.number,
    conversion: PropTypes.number
})

export function TeamTable({ team, noun, onPick }) {
    return (
        <Panel title='Team' subtitle='Pick someone to see their numbers' testId='team-table'>
            {team.length ? (
                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size='small' aria-label='Team'>
                        <TableHead>
                            <TableRow>
                                <TableCell>Salesperson</TableCell>
                                <TableCell align='right'>Leads</TableCell>
                                <TableCell align='right'>Bookings</TableCell>
                                <TableCell align='right'>Booked value</TableCell>
                                <TableCell align='right'>Conversion</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {team.map(person => (
                                <TableRow
                                    key={person.id}
                                    hover
                                    role='button'
                                    tabIndex={0}
                                    aria-label={`Show ${person.name}'s numbers`}
                                    onClick={() => onPick(String(person.id))}
                                    onKeyDown={event => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault()
                                            onPick(String(person.id))
                                        }
                                    }}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <TableCell sx={{ fontWeight: 600 }}>{person.name}</TableCell>
                                    <TableCell align='right'>{person.leads}</TableCell>
                                    <TableCell align='right'>{person.bookings}</TableCell>
                                    <TableCell align='right'>{rupees(person.revenue)}</TableCell>
                                    <TableCell align='right'>{percentText(person.conversion)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <EmptyNote>No leads or bookings for anyone {noun} yet</EmptyNote>
            )}
        </Panel>
    )
}

TeamTable.propTypes = {
    team: PropTypes.arrayOf(teamShape).isRequired,
    noun: PropTypes.string.isRequired,
    onPick: PropTypes.func.isRequired
}

// ---------------------------------------------------------------- recent leads

const recentShape = PropTypes.shape({
    id: idType,
    name: PropTypes.string,
    source: PropTypes.string,
    createdAt: PropTypes.string,
    stage: PropTypes.string,
    quoteSentAt: PropTypes.string,
    nextCallAt: PropTypes.string,
    bookingId: idType
})

export function RecentLeads({ leads, now }) {
    return (
        <Panel title='Recent leads' action={<PanelLink to='/process/leads'>See all</PanelLink>} testId='recent-leads'>
            {leads.length ? (
                <Box component='ul' sx={{ m: 0, p: 0 }}>
                    {leads.map(lead => {
                        const meta = stageMeta(lead.stage)
                        return (
                            <ListRow
                                key={lead.id}
                                to={`/process/leads/edit/${lead.id}`}
                                title={lead.name || 'Unnamed guest'}
                                meta={[lead.source, relativeTime(lead.createdAt, now), stageDetail(lead, now)]
                                    .filter(Boolean)
                                    .join(' · ')}
                                chip={
                                    <Chip
                                        size='small'
                                        label={meta.label}
                                        sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 600, flexShrink: 0 }}
                                    />
                                }
                            />
                        )
                    })}
                </Box>
            ) : (
                <EmptyNote>No leads yet — they appear here as they come in</EmptyNote>
            )}
        </Panel>
    )
}

RecentLeads.propTypes = {
    leads: PropTypes.arrayOf(recentShape).isRequired,
    now: PropTypes.instanceOf(Date).isRequired
}

// ---------------------------------------------------------------- loading

export function DashboardSkeleton() {
    return (
        <Box data-testid='dashboard-skeleton' aria-busy='true' aria-label='Loading the dashboard'>
            <Box
                sx={{
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' },
                    mb: 3
                }}
            >
                {[1, 2, 3, 4, 5, 6].map(item => (
                    <Skeleton key={item} variant='rounded' height={112} sx={{ borderRadius: '14px' }} />
                ))}
            </Box>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' } }}>
                <Skeleton variant='rounded' height={260} sx={{ borderRadius: '14px' }} />
                <Skeleton variant='rounded' height={260} sx={{ borderRadius: '14px' }} />
            </Box>
        </Box>
    )
}
