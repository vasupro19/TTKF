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
    useGetDataBucketConfigMutation,
    useCreateBucketConfigMutation,
    useUpdateBucketConfigMutation,
    getBucketConfigById
} from '@/app/store/slices/api/storageLocationSlice'

import { getCustomSx } from '@/utilities'

const customSx = getCustomSx()
export default function MasterBucketConfigForm({ editId }) {
    const dispatch = useDispatch()
    const { getDataBucketConfigLKey, updateBucketConfigLKey, createBucketConfigLKey } = useSelector(
        state => state.loading
    )
    const [getDataBucketConfig] = useGetDataBucketConfigMutation()
    const [createBucketConfig] = useCreateBucketConfigMutation()
    const [updateBucketConfig] = useUpdateBucketConfigMutation()

    const [inventoryTypeOptions, setInventoryTypeOptions] = useState([])

    const fields = [
        {
            name: 'inventoryType',
            label: 'Inventory Type',
            type: 'CustomAutocomplete',
            placeholder: 'select an option',
            options: inventoryTypeOptions,
            required: true,
            grid: { xs: 12, sm: 6, md: 6 },
            size: 'small',
            customSx: { ...customSx },
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            innerLabel: false,
            loading: !!getDataBucketConfigLKey
        },
        {
            name: 'name',
            label: 'Bucket Name*',
            type: 'text',
            placeholder: 'eg: Bucket-A1',

            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 6 },
            size: 'small'
        }
    ]

    // Define Zod schema for validation
    const validationSchema = z.object({
        inventoryType: z.preprocess(
            val => (typeof val === 'object' && val !== null ? val : null),
            z
                .object({
                    value: z.number().min(1, { message: 'Inventory Type is required' }),
                    label: z.string()
                })
                .nullable()
                .refine(val => val !== null, {
                    message: 'Inventory Type is required'
                })
        ),
        name: z.string().min(1, 'Bucket Name is required').max(50, 'Bucket Name cannot exceed 50 characters')
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

    const handleCustomChange = (e, formik) => formik.handleChange(e)

    const formik = useFormik({
        initialValues: {
            inventoryType: '',
            name: ''
        },
        validate,
        onSubmit: async values => {
            let response
            let message
            let isError = false
            try {
                const payload = {
                    name: values.name,
                    inventory_type: values.inventoryType.label,
                    inventory_type_id: values.inventoryType.value
                }
                if (editId && parseInt(editId, 10)) {
                    response = await updateBucketConfig({ id: editId, data: payload }).unwrap()
                } else response = await createBucketConfig(payload).unwrap()
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

    const getData = async () => {
        try {
            const { data: response } = await getDataBucketConfig().unwrap()
            if (!response.inventory_type) throw Error('unable to get inventory type data')
            setInventoryTypeOptions(response.inventory_type)
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
            const { data: response } = await dispatch(
                getBucketConfigById.initiate(id, { meta: { disableLoader: false } })
            )
            if (!response.data) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'unable to get data for current bucket',
                        variant: 'alert',
                        alert: { color: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
                dispatch(closeModal())
                return
            }
            setInventoryTypeOptions([
                { label: response.data?.inventory_type || '', value: response.data?.inventory_type_id || '' }
            ])
            formik.setValues({
                name: response.data?.name,
                inventoryType: {
                    label: response.data?.inventory_type || '',
                    value: response.data?.inventory_type_id || ''
                }
            })
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'something went wrong, please try again!',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    useEffect(() => {
        getData()
        if (editId && parseInt(editId, 10) > 0) getEditData(editId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId])

    useEffect(() => {}, [])
    return (
        <Box>
            <FormComponent
                fields={fields}
                formik={formik}
                handleCustomChange={handleCustomChange}
                submitting={createBucketConfigLKey || updateBucketConfigLKey}
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

MasterBucketConfigForm.propTypes = {
    editId: PropTypes.number
}
