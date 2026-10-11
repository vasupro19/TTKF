import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Box, Button, LinearProgress } from '@mui/material'
import { useGetDashboardSummaryQuery } from '@/app/store/slices/api/dashboardSlice'
import { agencyNameFor } from '@/app/layouts/sidebar/navModel'
import { greetingFor, periodLabel, periodMeta, periodRange, summaryArgs } from './dashboardHelpers'
import {
    DashboardHeader,
    DashboardSkeleton,
    KpiRow,
    PipelinePanel,
    RecentLeads,
    TeamTable,
    TodayPanel
} from './dashboardParts'
import { CampaignsChart, SourcesChart, TrendChart } from './dashboardCharts'

const errorText = error =>
    error?.data?.message || error?.data?.data?.message || 'Couldn’t load the dashboard. Please try again.'

const grid = columns => ({
    display: 'grid',
    gap: 2,
    gridTemplateColumns: { xs: '1fr', lg: columns },
    mb: 2,
    '& > *': { minWidth: 0 }
})

/**
 * The dashboard: the numbers that matter for a period (this month unless another is picked) and, for admins and
 * managers, for one person — worked out by the server (GET /dashboard/summary). What to do today first, then the
 * pipeline, the trend, where leads come from, the team and the latest leads.
 */
function Home() {
    const user = useSelector(state => state.auth?.user)
    const [period, setPeriod] = useState('thisMonth')
    const [custom, setCustom] = useState({ from: '', to: '' })
    const [assignedTo, setAssignedTo] = useState('')

    const args = useMemo(() => summaryArgs({ period, custom, assignedTo }), [period, custom, assignedTo])
    const { data, error, isLoading, isFetching, isError, refetch } = useGetDashboardSummaryQuery(args, {
        refetchOnMountOrArgChange: 60
    })

    const summary = data?.data
    const scope = summary?.scope || {}
    const { noun } = periodMeta(period)
    const now = new Date()

    const choosePeriod = key => {
        // ? a custom range starts from the days already shown, so the dates are never blank
        if (key === 'custom' && !custom.from && !custom.to) setCustom(periodRange(period, now, custom))
        setPeriod(key)
    }

    // ? links carry the chosen person to the leads list, which filters by it too
    const leadsLink = stage => {
        const params = new URLSearchParams()
        if (stage) params.set('stage', stage)
        if (assignedTo) params.set('assignedTo', assignedTo)
        const text = params.toString()
        return `/process/leads${text ? `?${text}` : ''}`
    }
    const kpiLink = card => (card.key === 'newLeads' ? leadsLink('') : card.to)

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8faff', minHeight: '100%' }}>
            <DashboardHeader
                greeting={`${greetingFor(now.getHours())}${user?.name ? `, ${user.name}` : ''}`}
                agency={agencyNameFor(user)}
                periodText={periodLabel(args.from, args.to)}
                period={period}
                custom={custom}
                onPeriod={choosePeriod}
                onCustom={setCustom}
                showAssignee={Boolean(scope.seesEveryLead)}
                assignedTo={assignedTo}
                onAssignedTo={setAssignedTo}
            />

            {isFetching && !isLoading ? (
                <LinearProgress sx={{ mb: 2, borderRadius: 999, height: 3 }} aria-label='Updating' />
            ) : null}

            {isError ? (
                <Alert
                    severity='error'
                    sx={{ mb: 2, borderRadius: '12px' }}
                    action={
                        <Button color='inherit' size='small' onClick={refetch} sx={{ textTransform: 'none' }}>
                            Try again
                        </Button>
                    }
                >
                    {errorText(error)}
                </Alert>
            ) : null}

            {isLoading ? <DashboardSkeleton /> : null}

            {summary ? (
                <>
                    <KpiRow kpis={summary.kpis || {}} linkFor={kpiLink} />

                    <Box sx={grid('3fr 2fr')}>
                        <TodayPanel today={summary.today} awaiting={summary.kpis?.awaitingVerification} now={now} />
                        <RecentLeads leads={summary.recentLeads || []} now={now} />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <PipelinePanel pipeline={summary.pipeline} linkFor={leadsLink} />
                    </Box>

                    <Box sx={grid('2fr 1fr 1fr')}>
                        <TrendChart trend={summary.trend || []} />
                        <SourcesChart sources={summary.sources || []} noun={noun} />
                        <CampaignsChart campaigns={summary.topCampaigns || []} noun={noun} />
                    </Box>

                    {Array.isArray(summary.team) ? (
                        <TeamTable team={summary.team} noun={noun} onPick={setAssignedTo} />
                    ) : null}
                </>
            ) : null}
        </Box>
    )
}

export default Home
