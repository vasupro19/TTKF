import { useState } from 'react'
import { Alert, Box, Skeleton, Stack, Tab, Tabs, Typography } from '@mui/material'
import MainCard from '@core/components/extended/MainCard'
import { useGetRateCardQuery } from '@/app/store/slices/api/ratesSlice'
import CabRatesTab from './CabRatesTab'
import HotelRatesTab from './HotelRatesTab'
import MarginTab from './MarginTab'
import RatesImport from './RatesImport'
import TicketRatesTab from './TicketRatesTab'

const EMPTY = {
    hotels: [],
    vehicles: [],
    cabRoutes: [],
    cabLocal: [],
    tickets: [],
    ticketModes: [],
    marginRules: [],
    campaigns: [],
    vehicleNames: [],
    settings: { defaultMarginPct: 15, roundTo: 100 },
    places: []
}

/**
 * The rate card: what the agency pays for hotels (per place and category, by meal plan, with seasons) and cabs, and its
 * margin. A quote uses these to price itself ("Calculate from rates" on the quote's prices). Only the agency's admins see it.
 */
export default function RatesPage() {
    const { data, isFetching, error } = useGetRateCardQuery(undefined, { refetchOnMountOrArgChange: true })
    const [tab, setTab] = useState('hotels')
    const card = data?.data || EMPTY

    let content
    if (error) {
        const forbidden = error.status === 403
        content = (
            <Alert severity={forbidden ? 'info' : 'error'}>
                {forbidden
                    ? 'Only the agency’s admin can see and change the rates, because they are what you pay.'
                    : error.data?.message || 'Couldn’t load the rates. Please try again.'}
            </Alert>
        )
    } else if (isFetching && !data) {
        content = <Skeleton variant='rounded' height={240} />
    } else {
        content = (
            <>
                <Tabs
                    value={tab}
                    onChange={(event, next) => setTab(next)}
                    sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab value='hotels' label={`Hotels (${card.hotels.length})`} sx={{ textTransform: 'none' }} />
                    <Tab
                        value='cabs'
                        label={`Cabs (${card.cabRoutes.length + card.cabLocal.length + card.vehicles.length})`}
                        sx={{ textTransform: 'none' }}
                    />
                    <Tab value='tickets' label={`Tickets (${card.tickets.length})`} sx={{ textTransform: 'none' }} />
                    <Tab value='margin' label='Margin and rounding' sx={{ textTransform: 'none' }} />
                </Tabs>
                {tab === 'hotels' ? <HotelRatesTab hotels={card.hotels} places={card.places} /> : null}
                {tab === 'cabs' ? (
                    <CabRatesTab
                        vehicles={card.vehicles}
                        routes={card.cabRoutes}
                        local={card.cabLocal}
                        cabNames={card.vehicleNames}
                        places={card.places}
                    />
                ) : null}
                {tab === 'tickets' ? (
                    <TicketRatesTab tickets={card.tickets} modes={card.ticketModes} places={card.places} />
                ) : null}
                {tab === 'margin' ? (
                    <MarginTab settings={card.settings} rules={card.marginRules} campaigns={card.campaigns} />
                ) : null}
            </>
        )
    }

    return (
        <MainCard
            sx={{ py: 2 }}
            contentSX={{ px: { xs: 2, sm: 3 }, py: 2, '& .MuiButton-root': { textTransform: 'none' } }}
        >
            <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='flex-start'
                spacing={2}
                sx={{ mb: 3, flexWrap: 'wrap', rowGap: 1.5 }}
            >
                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        color='text.secondary'
                        sx={{ fontSize: '0.8125rem', letterSpacing: '0.08em', fontWeight: 600 }}
                    >
                        SETUP
                    </Typography>
                    <Typography
                        component='h1'
                        sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 600, mt: 0.5 }}
                    >
                        Rates
                    </Typography>
                    <Typography color='text.secondary' sx={{ fontSize: '0.9375rem', mt: 0.5, maxWidth: 640 }}>
                        What you pay for hotels, cabs and tickets. A quote works out its own prices from these, so your
                        team doesn’t have to.
                    </Typography>
                </Box>
                {error ? null : <RatesImport />}
            </Stack>
            {content}
        </MainCard>
    )
}
