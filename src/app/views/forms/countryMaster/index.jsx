import React from 'react'
import { Box } from '@mui/material'
import { useFormik } from 'formik'
import { z } from 'zod'
import FormComponent from '@core/components/forms/FormComponent'

export default function CountryMaster() {
    const fields = [
        {
            name: 'countryCode',
            label: 'Country Code',
            type: 'text',
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 4, lg: 4 }, // Adjusted grid settings based on layout requirements
            size: 'small',
            customSx: { minHeight: { sm: '100px' } }
        },
        {
            name: 'countryName',
            label: 'Country Name',
            type: 'text',
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 4, lg: 6 },
            size: 'small',
            customSx: { minHeight: { sm: '100px' } }
        }
    ]

    // Additionally, handle the Submit button separately if needed, as it's not part of individual field objects

    // Define Zod schema
    const validationSchema = z.object({
        countryName: z.string().min(1, 'Country name is required'),
        countryCode: z.string().min(1, 'Country code is required')
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
        console.log('name', e.target.name, ': ', e.target.value)
        formik.handleChange(e) // For other fields, use normal formik.handleChange
    }
    const formik = useFormik({
        initialValues: {
            countryName: '',
            countryCode: ''
        },
        validate,
        onSubmit: values => {
            console.log('Submitting the Values:', values)
        },
        validateOnBlur: true,
        validateOnChange: true
    })

    return (
        <Box>
            <FormComponent
                fields={fields}
                formik={formik}
                handleCustomChange={handleCustomChange}
                customStyle={{
                    backgroundColor: 'none'
                }}
                isStraightAlignedButton // if submit button needs to appear like grid items along with the inputs
            />
        </Box>
    )
}
