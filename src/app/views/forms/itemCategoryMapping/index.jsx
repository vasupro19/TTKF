import React from 'react'
import { Box } from '@mui/material'
import { useFormik } from 'formik'
import { z } from 'zod'
import FormComponent from '@core/components/forms/FormComponent'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useDispatch } from 'react-redux'
import { closeModal } from '@app/store/slices/modalSlice'

export default function MasterItemCategoryMappingForm() {
    const dispatch = useDispatch()

    const customSx = {
        '& input': {
            backgroundColor: '#fff',
            padding: '12px 8px',
            height: '18px' // Decrease input height
        },
        '& .MuiInputBase-root.MuiOutlinedInput-root': {
            backgroundColor: 'white' // Apply the white background to the root element
        },
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'gray' // Optional: change border color if needed
        },
        flexGrow: 1
    }

    const zoneOptions = [
        { label: 'Zone A', value: 'zoneA' },
        { label: 'Zone B', value: 'zoneB' },
        { label: 'Zone C', value: 'zoneC' }
    ]

    const locationCodeOptions = [
        { label: 'LOC001', value: 'LOC001' },
        { label: 'LOC002', value: 'LOC002' },
        { label: 'LOC003', value: 'LOC003' }
    ]

    const categoryOptions = [
        { label: 'Electronics', value: 'electronics' },
        { label: 'Furniture', value: 'furniture' },
        { label: 'Food', value: 'food' }
    ]

    const itemOptions = [
        { label: 'TV', value: 'tv' },
        { label: 'Chair', value: 'chair' },
        { label: 'Apple', value: 'apple' }
    ]

    const fields = [
        {
            name: 'locationCode',
            label: 'Location Code',
            type: 'CustomAutocomplete',
            options: locationCodeOptions,
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 3 },
            size: 'small',
            customSx: { minHeight: { sm: '100px' }, ...customSx },
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            innerLabel: false
        },
        {
            name: 'zone',
            label: 'Zone',
            type: 'CustomAutocomplete',
            options: zoneOptions,
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 3 },
            size: 'small',
            customSx: { minHeight: { sm: '100px' }, ...customSx },
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            innerLabel: false
        },

        {
            name: 'item',
            label: 'Item',
            type: 'CustomAutocomplete',
            options: itemOptions,
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 3 },
            size: 'small',
            customSx: { minHeight: { sm: '100px' }, ...customSx },
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            innerLabel: false
        },
        {
            name: 'category',
            label: 'Category',
            type: 'CustomAutocomplete',
            options: categoryOptions,
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 3 },
            size: 'small',
            customSx: { minHeight: { sm: '100px' }, ...customSx },
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            innerLabel: false
        }
    ]

    // Define Zod schema for validation
    const validationSchema = z
        .object({
            zone: z.string().optional(), // Make it optional for now, handle the "at least one is required" logic later
            locationCode: z.string().optional(), // Same for locationCode
            category: z.string().optional(), // Same for category
            item: z.string().optional() // Same for item
        })
        .refine(
            data => data.zone || data.locationCode, // Ensure at least one of zone or locationCode is provided
            { message: "Either 'zone' or 'locationCode' is required", path: ['zone'] } // Add error message
        )
        .refine(
            data => data.category || data.item, // Ensure at least one of category or item is provided
            { message: "Either 'category' or 'item' is required", path: ['category'] } // Add error message
        )

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
        if (e.target.name === 'zone') {
            e.target.value = e.target?.value?.value
        }
        if (e.target.name === 'locationCode') {
            e.target.value = e.target?.value?.value
        }
        if (e.target.name === 'category') {
            e.target.value = e.target?.value?.value
        }
        if (e.target.name === 'item') {
            e.target.value = e.target?.value?.value
        }

        formik.handleChange(e)
    }

    const formik = useFormik({
        initialValues: {
            zone: '',
            locationCode: '',
            category: '',
            item: ''
        },
        validate,
        // eslint-disable-next-line no-unused-vars
        onSubmit: async values => {
            try {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'Submitted Successfully',
                        variant: 'alert',
                        alert: { color: 'success' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
                dispatch(closeModal())
            } catch (error) {
                dispatch(closeModal())
            }
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
                // isStraightAlignedButton
                submitButtonSx={{
                    display: 'flex',
                    justifyContent: 'end'
                }}
            />
        </Box>
    )
}
