import { customResponseHandler } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

const handle = async result => customResponseHandler({ result })

/**
 * The signed-in agency's own details: name, phone, address, website, Instagram and logo.
 * See the API's Controllers/company.controller.js.
 */
export const companySlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // ---- `{ company: { id, name, email, phoneNumber, address, website, insta, logo }, canEdit }`
        getCompany: build.query({
            query: () => ({ url: '/company', responseHandler: handle }),
            providesTags: ['Company']
        }),
        // FormData: the fields, a `logo` file, or `removeLogo=true`
        updateCompany: build.mutation({
            query: body => ({ url: '/company', method: 'PUT', body, responseHandler: handle }),
            invalidatesTags: ['Company']
        })
    })
})

export const { useGetCompanyQuery, useUpdateCompanyMutation } = companySlice
