import React from 'react'
import { Box } from '@mui/material'
import { useFormik } from 'formik'
import { z } from 'zod'
import FormComponent from '@core/components/forms/FormComponent' // Assuming this is a custom reusable form component
import { useAddPinCodesVendorMutation } from '@store/slices/api/geoSlice'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'
import { closeModal } from '@/app/store/slices/modalSlice'
import { getCustomSx } from '@/utilities'

const customSx = getCustomSx()

// Sample data for the dropdown
const apiVendors = [
    {
        id: 1,
        label: 'Postal Pincode',
        value: 'PostalPincode'
    }
]

// Define Zod validation schema
const validationSchema = z.object({
    apiVendor: z.preprocess(
        val => (typeof val === 'object' && val !== null ? val : null),
        z
            .object({
                id: z.number().min(1, { message: 'Vendor is required' }),
                label: z.string(),
                value: z.string()
            })
            .nullable()
            .refine(val => val !== null, {
                message: 'Vendor is required'
            })
    ),
    pincode: z.string().min(6, 'Pincodes are required')
})

export default function TpaImportForm() {
    const dispatch = useDispatch()
    const [addPinCodesVendor] = useAddPinCodesVendorMutation()
    const { addPinCodesVendorLKey, createPincodeLKey, updatePincodeLKey } = useSelector(state => state.loading)
    const fields = [
        {
            name: 'apiVendor',
            label: 'Api Vendor',
            type: 'CustomAutocomplete',
            options: apiVendors,
            required: true,
            grid: { xs: 12, sm: 6 },
            size: 'small',
            customSx: { minHeight: '100px', ...customSx },
            getOptionLabel: option => option.label || '',
            innerLabel: false,
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue)
        },
        {
            name: 'pincode',
            label: 'Pincode*',
            type: 'textarea',
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6 },
            customSx: { minHeight: '120px' },
            placeholder: '110001, 110002, 110003'
        }
    ]

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
            apiVendor: '',
            pincode: ''
        },
        validate,
        onSubmit: async values => {
            const payload = {
                api_vendor: values.apiVendor.value,
                pincodes: values.pincode
            }
            let isError = false
            let message
            try {
                const response = await addPinCodesVendor(payload).unwrap()
                message = response?.message || 'PinCodes submitted successfully!'
            } catch (error) {
                isError = true
                message = error?.message || error?.response?.data?.message || 'unable to submit pincodes!'
            } finally {
                dispatch(
                    openSnackbar({
                        open: true,
                        message,
                        variant: 'alert',
                        alert: { color: isError ? 'error' : 'success' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
                if (!isError) dispatch(closeModal())
            }
        },
        validateOnBlur: true,
        validateOnChange: true
    })

    // eslint-disable-next-line no-shadow
    const handleCustomChange = (e, formik) => {
        formik.handleChange(e) // For other fields, use normal formik.handleChange
    }

    return (
        <Box>
            <FormComponent
                fields={fields}
                formik={formik}
                customStyle={{
                    backgroundColor: 'none'
                }}
                submitting={createPincodeLKey || updatePincodeLKey || addPinCodesVendorLKey}
                submitButtonSx={{
                    textAlign: 'end',
                    width: '100%',
                    '& button': {
                        width: 'max-content',
                        height: '30px'
                    }
                }}
                handleCustomChange={handleCustomChange}
            />
        </Box>
    )
}
