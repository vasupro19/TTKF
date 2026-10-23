import { customResponseHandler } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

const handle = async result => customResponseHandler({ result })

/**
 * The rate card — what the agency pays for hotels and cabs, and its margin — and a quote priced from it. See the API's
 * Controllers/rates.controller.js. Only the agency's admins read and change the card; anyone can price a quote.
 */
export const ratesSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // ---- `{ hotels, vehicles, settings: { defaultMarginPct, roundTo }, places }`
        getRateCard: build.query({
            query: () => ({ url: '/rates', responseHandler: handle }),
            providesTags: ['RateCard']
        }),
        // `{ rows: [{ id?, place, category, season, validFrom, validTo, epRate, cpRate, mapRate, extraBedRate, childRate }], removeIds }`
        saveHotelRates: build.mutation({
            query: body => ({ url: '/rates/hotels', method: 'PUT', body, responseHandler: handle }),
            invalidatesTags: ['RateCard']
        }),
        // `{ rows: [{ id?, vehicle, perDayRate }], removeIds }`
        saveCabRates: build.mutation({
            query: body => ({ url: '/rates/vehicles', method: 'PUT', body, responseHandler: handle }),
            invalidatesTags: ['RateCard']
        }),
        // `{ defaultMarginPct, roundTo }`
        saveRateSettings: build.mutation({
            query: body => ({ url: '/rates/settings', method: 'PUT', body, responseHandler: handle }),
            invalidatesTags: ['RateCard']
        }),
        // `{ hotels: [...], vehicles: [...] }` → how many were added, changed and skipped
        importRates: build.mutation({
            query: body => ({ url: '/rates/import', method: 'POST', body, responseHandler: handle }),
            invalidatesTags: ['RateCard']
        }),
        // `{ leadId, quoteNo, marginPct? }` → the four categories priced (nothing is saved)
        priceFromRates: build.mutation({
            query: body => ({ url: '/rates/quote-price', method: 'POST', body, responseHandler: handle })
        })
    })
})

export const {
    useGetRateCardQuery,
    useSaveHotelRatesMutation,
    useSaveCabRatesMutation,
    useSaveRateSettingsMutation,
    useImportRatesMutation,
    usePriceFromRatesMutation
} = ratesSlice
