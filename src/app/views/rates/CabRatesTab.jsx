import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { useSaveCabDaysMutation } from '@/app/store/slices/api/ratesSlice'
import CabDayRates from './CabDayRates'
import CabRateTable from './CabRateTable'
import CabRouteSheet from './CabRouteSheet'
import { localKit } from './rateFacts'

// ? the names a quote's cab field offers; a rate is found by the same name, so these are the usual ones to start from
const USUAL_CABS = ['Sedan', 'SUV', 'Innova', 'Innova Crysta', 'Tempo Traveller', 'Mini Bus']

const SEASON_COLUMNS = [
    { field: 'season', label: 'Season', kind: 'text', minWidth: 88, placeholder: 'Standard' },
    { field: 'validFrom', label: 'From', kind: 'date', minWidth: 118 },
    { field: 'validTo', label: 'To', kind: 'date', minWidth: 118 },
    { field: 'repeatsYearly', label: 'Every year', kind: 'check', minWidth: 64 }
]

const LOCAL_COLUMNS = [
    { field: 'vehicle', label: 'Cab', kind: 'cab', minWidth: 130 },
    { field: 'place', label: 'Place', kind: 'place', minWidth: 150 },
    { field: 'dayRate', label: 'Day rate', kind: 'amount', minWidth: 100 },
    ...SEASON_COLUMNS
]

/**
 * What a cab costs. A quote's cab is worked out from its days: each time the trip moves to another place is a drive, priced by
 * its route; each other day in a place is a local day, priced by that place. A day with no rate falls back to the cab's plain
 * day rate, and with none of those it is listed as missing.
 */
export default function CabRatesTab({ vehicles, routes, local, cabNames, places }) {
    const cabs = [...new Set([...cabNames, ...USUAL_CABS])]
    return (
        <Box>
            <CabRouteSheet routes={routes} cabSuggestions={cabs} places={places} />
            <CabRateTable
                title='A day in one place'
                help='What a cab costs for a day of local sightseeing in a place, when the trip stays there. A quote charges it for each day the cab stays in the same place.'
                kit={localKit}
                columns={LOCAL_COLUMNS}
                data={local}
                prefix='local'
                useSave={useSaveCabDaysMutation}
                savedMessage='Day rates saved'
                cabNames={cabs}
                places={places}
                addLabel='Add a day rate'
                emptyText='No day rates yet. Add what a day of local sightseeing costs in each place.'
                noun='day rate'
            />
            <CabDayRates vehicles={vehicles} />
        </Box>
    )
}

CabRatesTab.propTypes = {
    vehicles: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number })).isRequired,
    routes: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number })).isRequired,
    local: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number })).isRequired,
    cabNames: PropTypes.arrayOf(PropTypes.string).isRequired,
    places: PropTypes.arrayOf(PropTypes.string).isRequired
}
