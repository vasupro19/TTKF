import { Box, Typography, Divider } from '@mui/material'
import { debounce } from '@mui/material/utils'
import FormComponent from '@/core/components/forms/FormComponent'
import { useFormik } from 'formik'
import { z } from 'zod'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal } from '@app/store/slices/modalSlice'

import { getRemainingSerials, useGeneratePOItemSerialPDFMutation } from '@/app/store/slices/api/serialSlice'
import { useEffect, useState, useMemo } from 'react'

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

function CreatePOGenerateSerialModal() {
    const dispatch = useDispatch()
    const [generatePOItemSerialPDF] = useGeneratePOItemSerialPDFMutation()
    const [poNumber, setPoNumber] = useState([])
    const { generatePOItemSerialPDFLKey, getRemainingSerialsLKey } = useSelector(state => state.loading)
    // Define Zod schema
    const validationSchema = z.object({
        po_number: z.preprocess(
            val => (typeof val === 'object' && val !== null ? val : null),
            z
                .object({
                    value: z.number().min(1, { message: 'PO number is required' }),
                    label: z.string(),
                    quantity: z.number(),
                    text: z.string()
                })
                .nullable()
                .refine(val => val !== null, {
                    message: 'PO number is required'
                })
        )
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

    const getSerials = useMemo(
        () =>
            debounce(async (callback, request = `?term=po&limit=40&page=1`) => {
                const { data: response } = await dispatch(
                    getRemainingSerials.initiate(request, { meta: { disableLoader: true } })
                )
                callback(response?.items || [])
            }, 400),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    const handleAutoCompleteSearch = search => {
        if (search?.value) getSerials(data => setPoNumber(data), `?term=${search.value}&limit=40&page=1`)
    }

    const handleCustomChange = (e, formik) => formik.handleChange(e)

    const formik = useFormik({
        initialValues: {
            po_number: null
        },
        validate,
        onSubmit: async values => {
            try {
                const { error } = await generatePOItemSerialPDF({
                    po_detail_id: values.po_number.value
                })
                if (!error?.data?.message) dispatch(closeModal())
                dispatch(
                    openSnackbar({
                        open: true,
                        message: error?.data?.message || 'Downloaded Successfully',
                        variant: 'alert',
                        alert: {
                            color: error?.data?.message ? 'error' : 'success',
                            icon: error?.data?.message ? 'error' : 'success'
                        },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
            } catch (error) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: error?.message || 'Something went wrong!',
                        variant: 'alert',
                        alert: {
                            color: 'error',
                            icon: 'error'
                        },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
            }
        },
        validateOnBlur: true,
        validateOnChange: true
    })

    const fields = [
        {
            name: 'po_number',
            label: 'Select PO Number',
            type: 'CustomAutocomplete',
            options: poNumber || [],
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 12, md: 12 },
            size: 'small',
            customSx: { minHeight: { sm: '100px' }, ...customSx },
            innerLabel: false,
            loading: !!getRemainingSerialsLKey,
            helperText: formik?.values?.po_number && (
                <Typography variant='h6' sx={{ color: 'GrayText' }}>
                    <b>{formik?.values.po_number?.quantity}</b> Items are there in this PO
                </Typography>
            ),
            placeholder: 'Search and select PO Number',
            onInputChange: handleAutoCompleteSearch,
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue)
        }
    ]

    useEffect(() => {
        getSerials(data => setPoNumber(data))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <Box
            sx={{
                width: { lg: '400px', sm: '400px', xs: '260px' }
            }}
        >
            <Box>
                <Typography variant='h3'>
                    PO Serial Generation
                    <Divider sx={{ borderColor: 'primary.main', marginTop: '4px' }} />
                </Typography>
                <Box>
                    <FormComponent
                        fields={fields}
                        formik={formik}
                        handleCustomChange={handleCustomChange}
                        submitting={generatePOItemSerialPDFLKey}
                        customStyle={{
                            backgroundColor: 'none'
                        }}
                        isStraightAlignedButton={false}
                        submitButtonSx={{ marginBottom: '-4px', textAlign: 'right' }}
                        gridStyles={{ px: 2 }}
                        submitButtonText='Generate'
                    />
                </Box>
            </Box>
        </Box>
    )
}

export default CreatePOGenerateSerialModal
