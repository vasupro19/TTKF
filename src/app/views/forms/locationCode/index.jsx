import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { useFormik } from 'formik'
import { z } from 'zod'
import FormComponent from '@core/components/forms/FormComponent'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal } from '@app/store/slices/modalSlice'
import {
    getLocationCodeById,
    getDataLocationCode,
    useCreateLocationCodeMutation,
    useUpdateLocationCodeMutation
} from '@/app/store/slices/api/storageLocationSlice'

export default function MasterLocationCodeForm({ editId = null }) {
    const dispatch = useDispatch()
    const { getDataLocationCodeLKey, updateLocationCodeLKey, createLocationCodeLKey } = useSelector(
        state => state.loading
    )
    const [createLocationCode] = useCreateLocationCodeMutation()
    const [updateLocationCode] = useUpdateLocationCodeMutation()

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

    const [zoneOptions, setZoneOptions] = useState([])
    const [storageTypes, setStorageTypes] = useState([])
    const [inventoryTypes, setInventoryTypes] = useState([])
    const [bucketOptions, setBucketOptions] = useState([])

    const fields = [
        {
            name: 'zone',
            label: 'Zone',
            type: 'CustomAutocomplete',
            options: zoneOptions,
            required: true,
            grid: { xs: 12, sm: 4 },
            size: 'small',
            customSx: { ...customSx },
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            innerLabel: true,
            loading: !!getDataLocationCodeLKey
        },
        {
            name: 'storage_type',
            label: 'Storage Type',
            type: 'CustomAutocomplete',
            options: storageTypes,
            required: true,
            grid: { xs: 12, sm: 4 },
            size: 'small',
            customSx: { ...customSx },
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            innerLabel: true,
            loading: !!getDataLocationCodeLKey
        },
        {
            name: 'inventory_type',
            label: 'Inventory Type',
            type: 'CustomAutocomplete',
            options: inventoryTypes,
            required: true,
            grid: { xs: 12, sm: 4 },
            size: 'small',
            customSx: { ...customSx },
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            innerLabel: true,
            onChange: (e, value, reason, formik) => {
                formik.setFieldValue('inventory_type', value)
                formik.setFieldValue('bucket', '')
            },
            loading: !!getDataLocationCodeLKey
        },
        {
            name: 'bucket',
            label: 'Bucket',
            type: 'CustomAutocomplete',
            options: bucketOptions,
            required: false,
            grid: { xs: 12, sm: 4 },
            size: 'small',
            customSx: { ...customSx },
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            innerLabel: true,
            loading: !!getDataLocationCodeLKey
        },
        {
            name: 'code',
            label: 'Location Code',
            type: 'text',
            required: true,
            CustomFormInput: false,
            grid: { xs: 12, sm: 4 },
            size: 'small',
            isDisabled: !!parseInt(editId, 10),
            innerLabel: true,
            customSx: { ...customSx }
        }
    ]

    // Define Zod schema
    const validationSchema = z.object({
        code: z.string().min(1, 'Location Code is required'),
        zone: z.preprocess(
            val => (typeof val === 'object' && val !== null ? val : null),
            z
                .object({
                    value: z.number().min(1, { message: 'Zone is required' }),
                    label: z.string()
                })
                .nullable()
                .refine(val => val !== null, {
                    message: 'Zone is required'
                })
        ),
        storage_type: z.string().min(1, 'Storage Type is required'),
        inventory_type: z.string().min(1, 'Inventory Type is required'),
        bucket: z.string().optional()
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
            code: '',
            zone: '',
            storage_type: '',
            inventory_type: '',
            bucket: ''
        },
        validate,
        onSubmit: async values => {
            let response
            let message
            let isError
            try {
                const payload = { ...values, zone_id: values.zone.value, zone_code: values.zone.label }
                delete payload.zone
                if (editId && parseInt(editId, 10)) {
                    response = await updateLocationCode({ id: editId, data: payload }).unwrap()
                } else response = await createLocationCode(payload).unwrap()
                message =
                    response?.data?.data?.message ||
                    response?.data?.message ||
                    response?.message ||
                    'operation successful'
            } catch (error) {
                if (error.data?.data?.errors || error.data?.errors?.errors) {
                    const backendErrors = error.data.data.errors || error.data.errors.errors
                    const formikErrors = {}
                    Object.entries(backendErrors).forEach(([field, messages]) => {
                        formikErrors[field] = messages.join(', ')
                    })

                    formik.setErrors(formikErrors)
                }
                isError = true
                message =
                    error?.data?.message || error?.message || 'something went wrong, please try again after some time!'
            } finally {
                dispatch(
                    openSnackbar({
                        open: true,
                        message,
                        variant: 'alert',
                        alert: { color: isError ? 'error' : 'success' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )

                if (!isError) dispatch(closeModal())
            }
        },
        validateOnBlur: false,
        validateOnChange: true
    })

    /* eslint-disable */
    const handleCustomChange = (e, formik) => formik.handleChange(e)
    /* eslint-enable */

    const getDropDownData = async () => {
        try {
            const { data: response } = await dispatch(getDataLocationCode.initiate())
            if (!response.data) throw new Error('no data found!')
            setZoneOptions(response.data?.zone || [])
            setStorageTypes(response.data?.storage_type || [])
            setInventoryTypes(response.data?.inventory_type || [])
            setBucketOptions(response.data?.bucket || [])
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'unable to get inventory type data.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }
    const getEditData = async id => {
        try {
            const { data: response } = await dispatch(getLocationCodeById.initiate(id))

            if (!response?.data) throw new Error('unable to get data from server!')
            const payload = {
                ...response.data,
                zone: { value: response.data.storage_zone_id, label: response.data.storage_zone_code }
            }
            delete payload.zone_id
            delete payload.zone_code

            formik.setValues({
                ...payload
            })
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.message || 'something went wrong, please try again!',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    useEffect(() => {
        getDropDownData()
        if (editId && parseInt(editId, 10)) getEditData(editId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId])

    return (
        <Box>
            <FormComponent
                fields={fields}
                formik={formik}
                handleCustomChange={handleCustomChange}
                submitting={createLocationCodeLKey || updateLocationCodeLKey}
                customStyle={{
                    backgroundColor: 'none'
                }}
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

MasterLocationCodeForm.propTypes = {
    editId: PropTypes.number
}
