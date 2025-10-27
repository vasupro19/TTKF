/* eslint-disable */
import { Box, Typography, Divider } from '@mui/material'
import { debounce } from '@mui/material/utils'
import FormComponent from '@/core/components/forms/FormComponent'
import { useFormik } from 'formik'
import { z } from 'zod'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useDispatch } from 'react-redux'
import { closeModal } from '@app/store/slices/modalSlice'

import { useEffect, useState, useMemo } from 'react'

const customSx = {
    '& input': {
        backgroundColor: '#fff',
        padding: '12px 8px',
        height: '18px'
    },
    '& .MuiInputBase-root.MuiOutlinedInput-root': {
        backgroundColor: 'white'
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'gray'
    },
    flexGrow: 1
}

function UpdateAssigneeModalForm() {
    const dispatch = useDispatch()
    const [users, setUsers] = useState([
        { value: 1, label: 'John Doe (1)' },
        { value: 2, label: 'Jane Smith (2)' },
        { value: 3, label: 'Alice Johnson (3)' }
    ])
    
    // Define Zod schema
    const validationSchema = z.object({
        user: z.object({
            value: z.number().min(1, { message: 'User is required' }),
            label: z.string()
        }).nullable().refine(val => val !== null, {
            message: 'User is required'
        })
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
            user: null
        },
        validate,
        onSubmit: values => {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'User Assigned successfully',
                    variant: 'alert',
                    alert: {
                        color: 'success',
                        icon: 'success'
                    },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            dispatch(closeModal())
        },
        validateOnBlur: true,
        validateOnChange: true
    })

    const fields = [
        {
            name: 'user',
            label: 'Select User*',
            type: 'CustomAutocomplete',
            options: users,
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 12, md: 12 },
            size: 'small',
            customSx: { minHeight: { sm: '100px' }, ...customSx },
            innerLabel: false,
            placeholder: 'Search and select User',
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue)
        }
    ]


    const handleCustomChange = (e, formik) => formik.handleChange(e)
    return (
        <Box
            sx={{
                width: { lg: '400px', sm: '400px', xs: '260px' }
            }}
        >
            <Box>
                <Typography variant='h3'>
                    Assign User
                    <Divider sx={{ borderColor: 'primary.main', marginTop: '4px' }} />
                </Typography>
                <Box>
                    <FormComponent
                        fields={fields}
                        formik={formik}
                        customStyle={{
                            backgroundColor: 'none'
                        }}
                        isStraightAlignedButton={false}
                        submitButtonSx={{ marginBottom: '-4px', textAlign: 'right' }}
                        gridStyles={{ px: 2 }}
                        submitButtonText='Assign'
                        handleCustomChange={handleCustomChange}
                    />
                </Box>
            </Box>
        </Box>
    )
}

export default UpdateAssigneeModalForm
