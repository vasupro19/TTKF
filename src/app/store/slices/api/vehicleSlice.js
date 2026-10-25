import { customResponseHandler } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

/**
 * The agency's own vehicles (backend Controllers/vehicle.controller.js): the list the trip form, the supplier form and the rate
 * card offer, kept by the operations team, managers and admins.
 */
export const vehicleSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // ? → { data: [{ id, name, seats, active }], summary: { ready, canEdit } }; `ready` false until the server's upgrade is run
        getVehicles: build.query({
            query: () => ({
                url: '/vehicles',
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['Vehicle']
        }),
        // ? `{ rows, removeIds }`: a row with an id is changed (its seats, whether it shows), one without is added
        saveVehicles: build.mutation({
            query: payload => ({ url: '/vehicles', method: 'PUT', body: payload }),
            // ? the rate card's cab names come from this list too
            invalidatesTags: ['Vehicle', 'RateCard']
        })
    })
})

export const { useGetVehiclesQuery, useSaveVehiclesMutation } = vehicleSlice
