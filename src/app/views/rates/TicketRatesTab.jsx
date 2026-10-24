import PropTypes from 'prop-types'
import { useSaveTicketsMutation } from '@/app/store/slices/api/ratesSlice'
import CabRateTable from './CabRateTable'
import { ticketKit } from './rateFacts'

// ? the ways the trip details offer; a fare is found by the same name
const USUAL_MODES = ['Volvo', 'Train', 'Flight']

const COLUMNS = [
    { field: 'mode', label: 'Travel by', kind: 'cab', minWidth: 112 },
    { field: 'fromPlace', label: 'From', kind: 'place', minWidth: 132 },
    { field: 'toPlace', label: 'To', kind: 'place', minWidth: 132 },
    { field: 'adultRate', label: 'Adult fare', kind: 'amount', minWidth: 96 },
    { field: 'childRate', label: 'Child fare', kind: 'amount', minWidth: 96 },
    { field: 'bothWays', label: 'Both ways', kind: 'check', minWidth: 60 },
    { field: 'season', label: 'Season', kind: 'text', minWidth: 112, placeholder: 'Standard' },
    { field: 'validFrom', label: 'From', kind: 'date', minWidth: 118 },
    { field: 'validTo', label: 'To', kind: 'date', minWidth: 118 },
    { field: 'repeatsYearly', label: 'Every year', kind: 'check', minWidth: 64 }
]

/**
 * What a ticket costs per person: a Volvo, train or flight between two places. A quote adds it when the guest arrives or
 * leaves that way (the trip details say how), and the cab then starts at the first place instead of the pickup place.
 */
export default function TicketRatesTab({ tickets, modes, places }) {
    return (
        <CabRateTable
            title='Tickets, per person'
            help={
                <>
                    One fare for each journey: Delhi to Shimla by Volvo. It is charged for every adult, and for a child
                    at the <strong>Child fare</strong> (the adult fare when that is empty). <strong>Both ways</strong>{' '}
                    makes the same fare cover the journey back. A season works as it does for hotels and cabs. You only
                    need the journeys you sell: a quote that needs a missing one asks for its fare on the spot.
                </>
            }
            kit={ticketKit}
            columns={COLUMNS}
            data={tickets}
            prefix='ticket'
            useSave={useSaveTicketsMutation}
            savedMessage='Ticket fares saved'
            cabNames={[...new Set([...modes, ...USUAL_MODES])]}
            places={places}
            addLabel='Add a fare'
            emptyText='No fares yet. Add the Volvo, train or flight journeys you sell.'
            noun='fare'
        />
    )
}

TicketRatesTab.propTypes = {
    tickets: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number })).isRequired,
    modes: PropTypes.arrayOf(PropTypes.string).isRequired,
    places: PropTypes.arrayOf(PropTypes.string).isRequired
}
