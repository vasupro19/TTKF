import React, { useEffect, useState } from 'react'
import { PropTypes } from 'prop-types'
import { Box } from '@mui/material'
import { useFormik } from 'formik'
import { z } from 'zod'
import {
    useGetCountryQuery,
    useCreateStateMutation,
    useUpdateStateMutation,
    getStateById
} from '@app/store/slices/api/geoSlice'
import { useDispatch, useSelector } from 'react-redux'

import { openSnackbar } from '@app/store/slices/snackbar'
import FormComponent from '@core/components/forms/FormComponent'
import { dispatchLoaderEvent } from '@/app/store/helpers'
import { getCustomSx } from '@/utilities'
import { closeModal } from '@/app/store/slices/modalSlice'

const staticQuery = `?start=0&length=300`

const customSx = getCustomSx()
export default function StateMaster({ formId = null }) {
    const dispatch = useDispatch()
    const { data: countriesData } = useGetCountryQuery(staticQuery)
    const [createState] = useCreateStateMutation()
    const [updateState] = useUpdateStateMutation()
    const [countries, setCountries] = useState([])
    const { getStateByIdLKey, getCountryDTB, createStateLKey, updateStateLKey } = useSelector(state => state.loading)

    const fields = [
        {
            name: 'country',
            label: 'Country',
            type: 'CustomAutocomplete',
            placeholder: 'Select an option',
            options: countries || [],
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 3, lg: 3 }, // grid settings reflecting layout requirements
            size: 'small',
            customSx: { minHeight: { sm: '100px' }, ...customSx },
            innerLabel: false,
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            loading: !!getCountryDTB
        },
        {
            name: 'stateName',
            label: 'State Name*',
            type: 'text',
            placeholder: 'eg: Uttarakhand',
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 3, lg: 3 },
            size: 'small'
        },
        {
            name: 'stateID',
            label: 'State ID*',
            type: 'text',
            placeholder: 'eg: 05',
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 3, lg: 3 },
            size: 'small'
        },
        {
            name: 'stateCode',
            label: 'State Code*',
            type: 'text',
            placeholder: 'eg: UK',
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 3, lg: 3 },
            size: 'small'
        }
    ]

    // Define Zod schema
    const validationSchema = z.object({
        country: z.preprocess(
            val => (typeof val === 'object' && val !== null ? val : null),
            z
                .object({
                    value: z.string().min(1, 'Country is required'),
                    label: z.string()
                })
                .nullable()
                .refine(val => val !== null, {
                    message: 'Country is required'
                })
        ),
        stateName: z.string().min(1, 'State name is required'),
        stateID: z.string().min(1, 'State ID is required'),
        stateCode: z.string().min(1, 'State code is required')
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

    const handleCustomChange = (e, formik) => {
        // console.log('name', e.target.name, ': ', e.target.value)
        formik.handleChange(e) // For other fields, use normal formik.handleChange
    }
    const formik = useFormik({
        initialValues: {
            country: '',
            stateName: '',
            stateID: '',
            stateCode: ''
        },
        validate,
        onSubmit: async values => {
            const payload = {
                country_id: values.country.value,
                name: values.stateName,
                code: values.stateCode,
                state_tin: values.stateID
            }
            try {
                let response
                if (typeof formId === 'number')
                    response = await updateState({
                        id: formId.toString(),
                        ...payload
                    }).unwrap()
                else response = await createState(payload).unwrap()
                dispatch(
                    openSnackbar({
                        open: true,
                        message: response?.data?.data?.message || response?.message || 'State successfully added',
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
        validateOnBlur: true,
        validateOnChange: true
    })
    const fetchStateById = async id => {
        if (!id || typeof id !== 'number') return
        const { data } = await dispatch(getStateById.initiate(id))

        if (data?.data) {
            let selectedCountry = {}
            if (data.data.country_id) {
                selectedCountry = countriesData.data.filter(country => country.id === data.data.country_id)[0] || {}
            }

            formik.setValues({
                city: data.data.name,
                country: { label: selectedCountry?.country_name || '', value: selectedCountry.id.toString() || '' },
                stateName: data.data.name,
                stateCode: data.data.code,
                stateID: data.data.state_tin
            })
        }
    }

    useEffect(() => {
        if (countriesData) {
            const countryOptions = countriesData.data.map(country => ({
                value: country.id.toString(),
                label: country.country_name
            }))
            setCountries(countryOptions)
            dispatchLoaderEvent('getCountryDTB', false)
        }
        if (countriesData && countriesData.data.length && formId && typeof formId === 'number') fetchStateById(formId)
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
                isLoading={getStateByIdLKey}
                submitting={createStateLKey || updateStateLKey}
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

StateMaster.propTypes = {
    formId: PropTypes.number
}
