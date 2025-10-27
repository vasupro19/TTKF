import { Box, Divider, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'
import { useFormik } from 'formik'
import { z } from 'zod'
import FormComponent from '@core/components/forms/FormComponent'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import ImportFileModal from '@/core/components/modals/ImportFileModal'
import { getItems } from '@/app/store/slices/api/commonSlice'
import {
    useSubmitSerialMappingMutation,
    useUploadSerialMappingMutation,
    useGetSerialMappingMutation
} from '@/app/store/slices/api/serialSlice'
import { closeModal } from '@/app/store/slices/modalSlice'
import { objectLength } from '@/utilities'
// eslint-disable-next-line import/no-duplicates

export default function MasterSerialImportMappingForm() {
    const [submitSerialMapping] = useSubmitSerialMappingMutation()
    const [uploadSerialMapping] = useUploadSerialMappingMutation()
    const [getSerialMapping] = useGetSerialMappingMutation()

    const dispatch = useDispatch()
    const [selectedMethod, setSelectedMethod] = useState('form') // Default selected

    const [eanOptions, setEanOptions] = useState([])
    const { getItemsLKey, submitSerialMappingLKey, getSerialMappingLKey, uploadSerialMappingLKey } = useSelector(
        state => state.loading
    )

    const handleChange = event => {
        setSelectedMethod(event.target.value)
    }

    const customInputSx = {
        '& .MuiAutocomplete-option': {
            backgroundColor: 'white',
            '&[aria-selected="true"]': {
                backgroundColor: 'white' // Selected option
            },
            '&:hover': {
                backgroundColor: '#f5f5f5' // Optional: hover effect
            }
        }
    }
    const customTextSx = {
        '& .MuiOutlinedInput-root': {
            backgroundColor: 'white' // Ensures white background for the input
        },
        '& .MuiOutlinedInput-input': {
            backgroundColor: 'white' // Ensures white background for the text area
        }
    }

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

    const fields = [
        {
            name: 'uid',
            label: 'UID*',
            type: 'text',
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 5 },
            size: 'small',
            customSx: { minHeight: { sm: '100px' }, ...customSx },
            customInputSx,
            customTextSx,
            innerLabel: false
        },
        {
            name: 'item_id',
            label: 'EAN/UPC or Product code',
            type: 'CustomAutocomplete',
            options: eanOptions,
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 5 },
            size: 'small',
            customSx: { minHeight: { sm: '100px' }, ...customSx },
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            customInputSx,
            customTextSx,
            innerLabel: false
        }
    ]

    // Define Zod schema
    const validationSchema = z.object({
        // ean: z.string().min(1, 'Bin Type is required'),
        item_id: z.preprocess(
            val => (typeof val === 'object' && val !== null ? val : null),
            z
                .object({
                    value: z.number().min(1, { message: 'Bin Type is required' }),
                    label: z.string()
                })
                .nullable()
                .refine(val => val !== null, {
                    message: 'Bin Type is required'
                })
        ),
        uid: z.string().min(1, 'UID Type is required')
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
        let { value } = e.target
        if (e.target.name === 'uid') {
            value = value.replace(/[^a-zA-Z0-9]/g, '')
        }

        formik.setFieldValue(e.target.name, value)
    }

    /* eslint-disable */
    const formik = useFormik({
        initialValues: {
            uid: '',
            item_id: ''
        },
        validate,
        onSubmit: async values => {
            try {
                const response = await submitSerialMapping({
                    ...values,
                    item_id: values.item_id.value
                }).unwrap()

                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'Submitted successfully',
                        variant: 'alert',
                        alert: { color: 'success' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
            } catch (error) {
                if (error.data?.data?.errors || error.data?.errors?.errors) {
                    const backendErrors = error.data.data.errors || error.data.errors.errors
                    const formikErrors = {}
                    Object.entries(backendErrors).forEach(([field, messages]) => {
                        formikErrors[field] = messages.join(', ')
                    })

                    formik.setErrors(formikErrors)
                }
                dispatch(
                    openSnackbar({
                        open: true,
                        message:
                            error?.data?.message ||
                            error?.message ||
                            'something went wrong, please try again after some time!',
                        variant: 'alert',
                        alert: { color: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
            }
        },
        validateOnBlur: true,
        validateOnChange: true
    })
    /* eslint-enable */

    const getData = async () => {
        try {
            const { data: response } = await dispatch(getItems.initiate())
            setEanOptions(response?.data || [])
            return response?.data || []
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'unable to get EAN/SKU!',
                    variant: 'alert',
                    alert: { color: 'error', icon: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return []
        }
    }

    useEffect(() => {
        getData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleFileUpload = async file => {
        let isError = false
        let message = ''
        try {
            const formData = new FormData()
            formData.append('excel', file)
            const response = await uploadSerialMapping(formData).unwrap()
            message = response.message
            if (response && objectLength(response) === 1) isError = true
            else if (objectLength(response) > 1) dispatch(closeModal())
        } catch (error) {
            isError = true
            message = error?.data?.message || error?.message || 'unable to upload file.'
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'success', icon: isError ? 'error' : 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    const getTemplate = async () => getSerialMapping().unwrap()

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 2,
                padding: 4,
                // backgroundColor: 'grey.bgLight',
                // border: '1px dashed',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'grey.borderLight',
                minHeight: '84vh'
            }}
        >
            <Box
                sx={{
                    width: { lg: '600px', sm: '500px', xs: '360px' },
                    padding: 2,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'grey.borderLight',
                    boxShadow: 'rgba(50, 50, 93, 0.25) 0px 30px 60px -12px, rgba(0, 0, 0, 0.3) 0px 18px 36px -18px',
                    backgroundColor: '#fff'
                }}
            >
                <Typography variant='h3'>
                    Import Mapping
                    <Divider sx={{ borderColor: 'primary.main', marginTop: '4px' }} />
                </Typography>
                <RadioGroup
                    row
                    value={selectedMethod}
                    onChange={handleChange}
                    sx={{
                        marginBottom: '8px'
                    }}
                >
                    <FormControlLabel value='form' control={<Radio />} label='Form' />
                    <FormControlLabel value='upload' control={<Radio />} label='Upload' />
                </RadioGroup>
                {selectedMethod === 'form' ? (
                    <FormComponent
                        fields={fields}
                        formik={formik}
                        handleCustomChange={handleCustomChange}
                        customStyle={{
                            backgroundColor: 'none'
                        }}
                        isStraightAlignedButton
                        submitButtonSx={{ marginBottom: '-4px' }}
                        isLoading={getItemsLKey}
                        submitting={submitSerialMappingLKey}
                    />
                ) : (
                    <Box
                        sx={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center'
                        }}
                    >
                        <ImportFileModal
                            handleFileSubmission={file => {
                                handleFileUpload(file)
                                // eslint-disable-next-line no-console
                            }}
                            fileType={{
                                'text/csv': ['.csv'],
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                            }}
                            // sampleFilePath='/csv/masters/importMappingSerial.csv'
                            isLoadingDownload={getSerialMappingLKey}
                            isLoadingUpload={uploadSerialMappingLKey}
                            isDownloadSample
                            handleGetTemplate={getTemplate}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    )
}
