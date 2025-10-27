import React, { useEffect } from 'react'
import { Box } from '@mui/material'
import { useFormik } from 'formik'
import { z } from 'zod'
import FormComponent from '@core/components/forms/FormComponent'

// ** import API
import {
    useGetCountryQuery,
    getStatesByCountry,
    getCityByStateId,
    getPinCodeById,
    useCreatePinCodeMutation,
    useUpdatePinCodesMutation
} from '@store/slices/api/geoSlice'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal } from '@app/store/slices/modalSlice'
import { openSnackbar } from '@/app/store/slices/snackbar'
import PropTypes from 'prop-types'
import { getCustomSx } from '@/utilities'

const customSx = getCustomSx()

export default function LocalImportForm({ formId = null }) {
    const dispatch = useDispatch()

    // rtk queries/mutations
    const [createPinCode] = useCreatePinCodeMutation()
    const [updatePinCodes] = useUpdatePinCodesMutation()
    const { data: countriesData } = useGetCountryQuery('?start=0&length=300')

    // ** ui state
    const [countries, setCountries] = React.useState([])
    const [states, setStates] = React.useState([])
    const [cities, setCities] = React.useState([])
    const [pinCodeId, setPinCodeId] = React.useState(null)
    const {
        getPincodeByIdLKey,
        getCountryDTB,
        getStatesByCountryLKey,
        createPincodeLKey,
        getCityByStateIdLKey,
        updatePincodeLKey
    } = useSelector(state => state.loading)

    const fields = [
        {
            name: 'country',
            label: 'Country',
            type: 'CustomAutocomplete',
            placeholder: 'Select an option',
            options: countries || [],
            required: true,
            grid: { xs: 12, sm: 3 },
            size: 'small', // If needed; adjust as necessary
            customSx: { minHeight: { sm: '100px' }, ...customSx },
            getOptionLabel: option => option.country_name || '',
            innerLabel: false,
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            loading: !!getCountryDTB
        },
        {
            name: 'state',
            label: 'State',
            type: 'CustomAutocomplete',
            placeholder: 'Select an option',

            options: states,
            required: true,
            grid: { xs: 12, sm: 3 },
            size: 'small',
            getOptionLabel: option => option.name || '',
            innerLabel: false,
            customSx,
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            loading: !!getStatesByCountryLKey
        },
        {
            name: 'city',
            label: 'City',
            type: 'CustomAutocomplete',
            placeholder: 'Select an option',

            options: cities,
            required: true,
            grid: { xs: 12, sm: 3 },
            size: 'small',
            getOptionLabel: option => option.name || '',
            innerLabel: false,
            customSx,
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            loading: !!getCityByStateIdLKey
        },
        {
            name: 'pincode',
            label: 'Pincode*',
            placeholder: 'eg: 110001',

            size: 'small', // Adjusted to fit the outlined height of 40px; use 'small' if needed
            type: 'text',
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 3 } // Set grid size to match responsive layout needs
        }
    ]
    const validationSchema = z.object({
        country: z.preprocess(
            val => (typeof val === 'object' && val !== null ? val : null),
            z
                .object({
                    id: z.number().min(1, { message: 'Country is required' }),
                    country_name: z.string()
                })
                .nullable()
                .refine(val => val !== null, {
                    message: 'Country is required'
                })
        ),
        state: z.preprocess(
            val => (typeof val === 'object' && val !== null ? val : null),
            z
                .object({
                    id: z.number().min(1, { message: 'State is required' }),
                    name: z.string()
                })
                .nullable()
                .refine(val => val !== null, {
                    message: 'State is required'
                })
        ),
        city: z.preprocess(
            val => (typeof val === 'object' && val !== null ? val : null),
            z
                .object({
                    id: z.number().min(1, { message: 'City is required' }),
                    name: z.string()
                })
                .nullable()
                .refine(val => val !== null, {
                    message: 'City is required'
                })
        ),
        pincode: z.string().regex(/^\d+$/, 'Pincode must contain numbers only').min(6, 'At least 6 characters')
    })

    const validate = values => {
        try {
            validationSchema.parse(values)
            return {}
        } catch (error) {
            const formikErrors = {}
            error.errors.forEach(err => {
                formikErrors[err.path[0]] = err.message
            })
            return formikErrors
        }
    }

    const formik = useFormik({
        initialValues: {
            country: '',
            state: '',
            city: '',
            pincode: ''
        },
        validate,
        onSubmit: async values => {
            let message
            let error = false
            let response
            try {
                if (typeof formId === 'number')
                    response = await updatePinCodes({
                        id: pinCodeId.toString(),
                        country_id: values.country.id.toString(),
                        state_id: values.state.id.toString(),
                        city_id: values.city.id.toString(),
                        pincode: values.pincode.toString()
                    }).unwrap()
                else
                    response = await createPinCode({
                        country_id: values.country.id,
                        state_id: values.state.id,
                        city_id: values.city.id,
                        pincode: values.pincode
                    }).unwrap()
                message = response?.data?.data?.message || response?.message || 'Pincode successfully added'
                dispatch(closeModal())
            } catch (apiError) {
                error = true
                message =
                    apiError?.response?.data?.data?.message ||
                    apiError?.response?.data?.message ||
                    error?.message ||
                    'unable to create pincode!'
            } finally {
                dispatch(
                    openSnackbar({
                        open: true,
                        message,
                        variant: 'alert',
                        alert: { color: error ? 'error' : 'success' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
            }
        },
        validateOnBlur: true,
        validateOnChange: true
    })

    const fetchStatesByCountry = async id => {
        const { data } = await dispatch(getStatesByCountry.initiate(id))

        if (data?.data) setStates(data?.data)
        return data?.data
    }
    const fetchCityByState = async id => {
        const { data } = await dispatch(getCityByStateId.initiate(id))

        if (data?.data) setCities(data?.data)
        return data?.data
    }

    const fetchPinCodeData = async id => {
        if (!id || typeof id !== 'number') return
        const { data } = await dispatch(getPinCodeById.initiate(id))
        if (data?.data) {
            let allStates = []
            let allCities = []
            let selectedCountry = {}
            let selectedState = {}
            let selectedCity = {}
            if (data.data.country_id) {
                allStates = await fetchStatesByCountry(data.data.country_id)
                selectedCountry = countriesData.data.filter(country => country.id === data.data.country_id)[0] || {}
            }

            if (data?.data?.state_id) {
                selectedState = allStates.filter(state => state.id === data.data.state_id)[0] || {}
                allCities = await fetchCityByState(data.data.state_id)
            }
            if (data?.data?.city_id) selectedCity = allCities.filter(city => city.id === data.data.city_id)[0] || {}

            setPinCodeId(data?.data?.id)
            formik.setValues({
                city: selectedCity,
                country: selectedCountry,
                state: selectedState,
                pincode: data?.data?.pincode
            })
        }
    }

    const handleCustomChange = (e, formikRef) => {
        const { name, value } = e.target
        if (name === 'country') fetchStatesByCountry(value?.id, value.country_name)
        if (name === 'state') fetchCityByState(value?.id)
        formikRef.handleChange(e) // For other fields, use normal formik.handleChange
    }

    useEffect(() => {
        if (countriesData) {
            setCountries(countriesData.data)
        }
        if (countriesData && countriesData.data.length && formId && typeof formId === 'number') fetchPinCodeData(formId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countriesData, formId])

    return (
        <Box>
            <FormComponent
                fields={fields}
                formik={formik}
                handleCustomChange={handleCustomChange}
                customStyle={{
                    backgroundColor: 'none'
                }}
                isLoading={getPincodeByIdLKey}
                submitting={createPincodeLKey || updatePincodeLKey}
                submitButtonSx={{
                    textAlign: 'end',
                    width: '100%',
                    '& button': {
                        width: 'max-content',
                        height: '30px'
                    }
                }}
            />
        </Box>
    )
}

LocalImportForm.propTypes = {
    formId: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object])
}
