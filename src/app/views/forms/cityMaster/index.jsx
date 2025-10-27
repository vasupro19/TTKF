import React from 'react'
import { PropTypes } from 'prop-types'
import { Box } from '@mui/material'
import { useFormik } from 'formik'
import { z } from 'zod'
import { useDispatch, useSelector } from 'react-redux'

import { openSnackbar } from '@app/store/slices/snackbar'
import FormComponent from '@core/components/forms/FormComponent'
import {
    useGetCountryQuery,
    getStatesByCountry,
    useCreateCityMutation,
    getCityById,
    useUpdateCityMutation
} from '@app/store/slices/api/geoSlice'
import { closeModal } from '@app/store/slices/modalSlice'
import { dispatchLoaderEvent } from '@/app/store/helpers'
import { getCustomSx } from '@/utilities'

const customSx = getCustomSx()

export default function CityMaster({ formId = null }) {
    const dispatch = useDispatch()
    const [createCity] = useCreateCityMutation()
    const [updateCity] = useUpdateCityMutation()
    const { data: countriesData } = useGetCountryQuery('?start=0&length=300')

    const { fetchCity, getCityByIdLoader, getCountryDTB, createCityLKey, updateCityLKey } = useSelector(
        state => state.loading
    )
    const [countries, setCountries] = React.useState([])
    const [states, setStates] = React.useState([])
    const fields = [
        {
            name: 'country',
            label: 'Country',
            type: 'CustomAutocomplete',
            placeholder: 'select an option',
            options: countries,
            required: true,
            grid: { xs: 12, sm: 6, md: 4 }, // Adjust these grid sizes based on your layout needs
            size: 'small',
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
            placeholder: 'select an option',
            options: states,
            loading: !!fetchCity,
            required: true,
            grid: { xs: 12, sm: 6, md: 4 },
            size: 'small',
            getOptionLabel: option => option.name || '',
            innerLabel: false,
            customSx,
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue)
        },
        {
            name: 'city',
            label: 'City*',
            placeholder: 'eg: Delhi',
            type: 'text', // Assuming a text input for city
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 4 },
            size: 'small'
        }
    ]

    // Define Zod schema
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
        city: z.string().min(3, 'City is required')
    })

    const fetchStatesByCountry = async id => {
        const { data } = await dispatch(
            getStatesByCountry.initiate(id, { meta: { disableLoader: false, key: 'fetchCity' } })
        )

        setStates(data?.data || [])
        return data?.data
    }

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

    const handleCustomChange = (e, formik) => {
        const { name, value } = e.target
        if (name === 'country') fetchStatesByCountry(value?.id, value.country_name)
        formik.handleChange(e) // For other fields, use normal formik.handleChange
    }
    const formik = useFormik({
        initialValues: {
            country: '',
            state: '',
            city: ''
        },
        validate,
        onSubmit: async values => {
            try {
                let response
                if (typeof formId === 'number')
                    response = await updateCity(
                        {
                            id: formId.toString(),
                            name: values.city,
                            country_id: values.country.id.toString(),
                            state_id: values.state.id.toString()
                        },
                        { meta: { disableLoader: true } }
                    ).unwrap()
                else
                    response = await createCity({
                        name: values.city,
                        country_id: values.country.id.toString(),
                        state_id: values.state.id.toString()
                    }).unwrap()

                dispatch(
                    openSnackbar({
                        open: true,
                        message: response?.data?.data?.message || response?.data?.message || 'City successfully added',
                        variant: 'alert',
                        alert: { color: 'success' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
                dispatch(closeModal())
            } catch (error) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: error?.data?.data?.message || error?.message || 'Something went wrong.',
                        variant: 'alert',
                        alert: { color: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
            }
        },
        validateOnBlur: false,
        validateOnChange: true
    })

    const fetchCityById = async id => {
        if (!id || typeof id !== 'number') return
        const { data } = await dispatch(getCityById.initiate(id, { meta: { key: 'getCityByIdLoader' } }))

        if (data?.data) {
            let allStates = []
            let selectedCountry = {}
            let selectedState = {}
            if (data.data.country_id) {
                allStates = await fetchStatesByCountry(data.data.country_id)
                selectedCountry = countriesData.data.filter(country => country.id === data.data.country_id)[0] || {}
                selectedState = allStates.filter(state => state.id === data.data.state_id)[0] || {}
            }

            formik.setValues({
                city: data.data.name,
                country: selectedCountry,
                state: selectedState
            })
        }
    }

    React.useEffect(() => {
        if (countriesData && countriesData.data.length) {
            setCountries(countriesData.data)
            dispatchLoaderEvent('getCountryDTB', false)
        }
        if (countriesData && countriesData.data.length && formId && typeof formId === 'number') fetchCityById(formId)
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
                submitting={createCityLKey || updateCityLKey}
                isLoading={getCityByIdLoader}
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

CityMaster.propTypes = {
    formId: PropTypes.oneOfType([PropTypes.number, PropTypes.object])
}
