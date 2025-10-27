import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { useFormik } from 'formik'
import { z } from 'zod'
import FormComponent from '@core/components/forms/FormComponent'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal } from '@app/store/slices/modalSlice'
import {
    useCreateStorageZoneMutation,
    useUpdateStorageZoneMutation,
    getStorageZoneById
} from '@/app/store/slices/api/storageLocationSlice'

export default function MasterZoneForm({ editId = null }) {
    const dispatch = useDispatch()
    const [createStorageZone] = useCreateStorageZoneMutation()
    const [updateStorageZone] = useUpdateStorageZoneMutation()
    const { createStorageZoneLKey, updateStorageZoneLKey } = useSelector(state => state.loading)

    const fields = [
        {
            name: 'name',
            label: 'Name*',
            type: 'text',
            placeholder: 'eg: Zone-1',
            required: true,
            CustomFormInput: true,
            autoComplete: 'off',
            grid: { xs: 12, sm: 6, md: 6 },
            size: 'small',
            customSx: { minHeight: { sm: '100px' } }
        },
        {
            name: 'code',
            label: 'Code*',
            type: 'text',
            placeholder: 'eg: Z-1',
            required: true,
            autoComplete: 'off',
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 6 },
            size: 'small',
            customSx: { minHeight: { sm: '100px' } },
            isDisabled: !!parseInt(editId, 10)
        }
    ]

    // Define Zod schema
    const validationSchema = z.object({
        name: z.string().min(1, 'Name is required'),
        code: z.string().min(3, 'Min 3 characters required')
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
        formik.handleChange(e)
    }

    const formik = useFormik({
        initialValues: {
            name: '',
            code: ''
        },
        validate,
        onSubmit: async values => {
            let response
            let message
            let isError
            try {
                if (editId && parseInt(editId, 10))
                    response = await updateStorageZone({ id: editId, data: { ...values } }).unwrap()
                else response = await createStorageZone({ ...values }).unwrap()

                message =
                    response?.message ||
                    response?.data?.message ||
                    `unable to ${parseInt(editId, 10) ? 'update' : 'create'} zone`
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

    const getZone = async id => {
        try {
            const { data: response } = await dispatch(getStorageZoneById.initiate(id))
            if (!response?.data) throw new Error('No data found!')
            formik.setValues({ name: response.data.name, code: response.data.code })
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || error?.message || 'something went wrong, please try again!',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    useEffect(() => {
        if (editId && parseInt(editId, 10)) getZone(editId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId])

    return (
        <Box>
            <FormComponent
                fields={fields}
                formik={formik}
                handleCustomChange={handleCustomChange}
                submitting={createStorageZoneLKey || updateStorageZoneLKey}
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

MasterZoneForm.propTypes = {
    editId: PropTypes.number
}
