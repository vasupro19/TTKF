import { useRef, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { Grid, TextField, Typography, Box, styled, Paper, Chip, Divider, Tooltip } from '@mui/material'
import { Formik, Form, Field } from 'formik'
import { z } from 'zod'
import CustomAutocomplete from '@core/components/extended/CustomAutocomplete'
import CustomButton from '@core/components/extended/CustomButton'

// redux imports
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import ImportFileModal from '@/core/components/modals/ImportFileModal'
import { closeModal } from '@app/store/slices/modalSlice'
import GlobalModal from '@/core/components/modals/GlobalModal'
import { ArrowCircleLeft } from '@mui/icons-material'
import Papa from 'papaparse'

import { useCreatePropertyMutation, getPropertyData, getProperty } from '@/app/store/slices/api/catalogueSlice'
import { toCapitalizedWords } from '@/utilities'

// Styled components
const CustomTextField = styled(TextField)({
    '& input': {
        backgroundColor: '#fff',
        padding: '4px 8px',
        height: '18x' // Decrease input height
    },
    '& .MuiInputBase-root.MuiOutlinedInput-root': {
        backgroundColor: 'white' // Apply the white background to the root element
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'gray' // Optional: change border color if needed
    },
    flexGrow: 1,
    width: 'auto'
})

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

// eslint-disable-next-line react/prop-types
function CustomTextFieldWrapper({ name, ...props }) {
    return (
        <Field name={name}>
            {({ field, form: { touched, errors } }) => (
                /* eslint-disable */
                <CustomTextField
                    {...field}
                    {...props}
                    error={touched[name] && !!errors[name]}
                    helperText={touched[name] && errors[name]}
                />
                /* eslint-enable */
            )}
        </Field>
    )
}

const Label = styled(Typography)({
    width: '180px',
    marginRight: '8px',
    whiteSpace: 'nowrap',
    fontWeight: '500',
    marginBottom: '6px'
})

export default function MasterDefinePropertiesForm({ editId = null }) {
    // usePrompt()
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const [createProperty] = useCreatePropertyMutation()
    const { getPropertyDataLKey, createPropertyLKey } = useSelector(state => state.loading)

    const formikRef = useRef()
    const [section, setSection] = useState([])
    const [propertyType, setPropertyType] = useState([])
    // const [propertyName, setPropertyName] = useState('')
    const [showTextInput, setShowTextInput] = useState(false) // For showing additional input field
    const [selectedOptions, setSelectedOptions] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const initialValues = {
        propertyName: '',
        propertyType: '',
        selectedSection: '',
        newDropdownValue: '' // For the new value to be added, if 'Dropdown' is selected
    }

    const validationSchema = z.object({
        propertyName: z.string().min(1, 'Property Name is required'),
        propertyType: z.string().min(1, 'Select a Property Type'),
        selectedSection: z.string().min(1, 'Select a Section'),
        newDropdownValue: z.string().optional()
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

    const handleDeleteTag = optionToRemove => {
        setSelectedOptions(prev => prev.filter(option => option !== optionToRemove))
    }
    // open bulk import modal
    const handleBulkImport = async () => {
        const errors = await formikRef.current?.validateForm() // Trigger validation
        // Mark all fields as touched to show validation errors
        formikRef.current?.setTouched(
            Object.keys(formikRef.current?.values).reduce((acc, key) => {
                acc[key] = true
                return acc
            }, {})
        )

        if (Object.keys(errors).length > 0) {
            // If errors exist, display a snackbar and do not open the modal
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Please fix validation errors before proceeding.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return
        }

        // Open the modal if validation passes
        setIsModalOpen(true)
    }
    async function getData() {
        const { data } = await dispatch(getPropertyData.initiate())
        if (!data.data) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'unable to fetch sections and types data! please try again.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return
        }
        setSection(data.data.sections.map(item => ({ label: toCapitalizedWords(item), value: item })))
        setPropertyType(data.data.types.map(item => ({ label: toCapitalizedWords(item), value: item })))
    }
    useEffect(() => {
        getData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        async function getPropertyById() {
            const { data } = await dispatch(getProperty.initiate(editId))
            if (!data.data) navigate(-1)
            formikRef.current.setFieldValue('propertyName', data.data.name)
            formikRef.current.setFieldValue('propertyType', data.data.type)
            setShowTextInput(data.data.type === 'dropDown')
            formikRef.current.setFieldValue('selectedSection', data.data.section)
            setSelectedOptions(data.data?.value || [])
        }

        if (editId && parseInt(editId, 10)) getPropertyById()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId])

    return (
        <Box sx={{ width: { lg: showTextInput ? '840px' : '640px', sm: '500px', xs: '260px' }, paddingX: 1 }}>
            <Formik
                innerRef={formikRef}
                initialValues={initialValues}
                validate={validate}
                onSubmit={async (values, { resetForm, setErrors }) => {
                    let message
                    let isError = false
                    try {
                        const payload = {
                            name: values.propertyName,
                            type: values.propertyType,
                            section: values.selectedSection,
                            value: selectedOptions
                        }
                        if (editId && parseInt(editId, 10)) payload.id = editId
                        const response = await createProperty({ ...payload }).unwrap()
                        message =
                            response?.data?.message ||
                            response?.message ||
                            `property ${editId && parseInt(editId, 10) ? 'updated' : 'created'} successfully !`
                        dispatch(closeModal())
                        setSelectedOptions([])
                        resetForm()
                    } catch (error) {
                        if (error.data?.data?.errors) {
                            const backendErrors = error.data.data.errors
                            const formikErrors = {}
                            const currentInputNames = {
                                name: 'propertyName',
                                value: 'newDropdownValue',
                                type: 'propertyType',
                                section: 'selectedSection'
                            }
                            Object.entries(backendErrors).forEach(([field, messages]) => {
                                formikErrors[currentInputNames[field]] = messages.join(', ')
                            })
                            setErrors({ ...formikErrors })
                        }
                        isError = true
                        message =
                            error?.message ||
                            error?.data?.data?.message ||
                            error?.data?.message ||
                            'unable to create customer'
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
                    }
                }}
            >
                {/* {({ errors, touched, values, setFieldTouched, setFieldValue, setFieldError, handleChange }) => ( */}
                {({ errors, touched, values, setFieldTouched, setFieldValue }) => (
                    <Form>
                        <Grid container gap={2}>
                            <Grid md={12} container spacing={1}>
                                {/* Personal Details Section */}
                                <Grid item xs={12} md={showTextInput ? 3 : 4} container alignItems='center'>
                                    <Label sx={{ textAlign: 'left' }}>
                                        Property Name
                                        <Typography component='span'>*</Typography>
                                    </Label>

                                    <CustomTextFieldWrapper
                                        as={CustomTextField}
                                        name='propertyName'
                                        variant='outlined'
                                        size='small'
                                        placeholder='e.g. Colour'
                                        fullWidth
                                        sx={{
                                            minHeight: { sm: '60px' }
                                        }}
                                        // value={propertyName}
                                        // onChange={e => {
                                        //     setPropertyName(e.target.value)
                                        //     handleChange(e)
                                        // }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={showTextInput ? 3 : 4}>
                                    <CustomAutocomplete
                                        name='selectedSection'
                                        label='Select Section*'
                                        options={section}
                                        value={values.selectedSection}
                                        placeholder='Select a section'
                                        onChange={(_, value) => {
                                            setFieldValue('selectedSection', value || '')
                                        }}
                                        onBlur={() => setFieldTouched('selectedSection', true)}
                                        touched={touched.selectedSection}
                                        error={errors.selectedSection}
                                        setFieldValue={setFieldValue}
                                        setFieldTouched={setFieldTouched}
                                        customSx={{
                                            minHeight: { sm: '60px' }
                                        }}
                                        customInputSx={customInputSx}
                                        customTextSx={customTextSx}
                                        isOptionEqualToValue={(option, selectedValue) =>
                                            (option?.value || option) === (selectedValue?.value || selectedValue)
                                        }
                                        tempUi
                                        innerLabel={false}
                                        labelSx={{ marginBottom: '6px' }}
                                        loading={!!getPropertyDataLKey}
                                    />
                                </Grid>
                                <Grid item xs={12} md={showTextInput ? 3 : 4}>
                                    <CustomAutocomplete
                                        name='propertyType'
                                        label='Property Type*'
                                        options={propertyType}
                                        value={values.propertyType}
                                        placeholder='Select a type'
                                        onChange={(_, value) => {
                                            setFieldValue('propertyType', value || '')
                                            setShowTextInput(value === 'dropDown') // Show input field if 'Dropdown' is selected
                                        }}
                                        onBlur={() => setFieldTouched('propertyType', true)}
                                        touched={touched.propertyType}
                                        error={errors.propertyType}
                                        setFieldValue={setFieldValue}
                                        setFieldTouched={setFieldTouched}
                                        customSx={{
                                            minHeight: { sm: '60px' }
                                        }}
                                        customInputSx={customInputSx}
                                        customTextSx={customTextSx}
                                        isOptionEqualToValue={(option, selectedValue) =>
                                            (option?.value || option) === (selectedValue?.value || selectedValue)
                                        }
                                        tempUi
                                        innerLabel={false}
                                        clearValFunc={() => {
                                            setShowTextInput(false)
                                            setSelectedOptions([])
                                            /* eslint-disable */

                                            setFieldTouched('newDropdownValue', false),
                                                setFieldValue('newDropdownValue', '')
                                            /* eslint-enable */
                                        }}
                                        labelSx={{ marginBottom: '6px' }}
                                        loading={!!getPropertyDataLKey}
                                    />
                                </Grid>

                                {/* Dynamic Input Field to Add New Dropdown Value */}
                                {showTextInput && (
                                    <Grid item xs={12} md={3}>
                                        <Box
                                            sx={{
                                                marginBottom: '2px',
                                                display: 'flex',
                                                width: '100%',
                                                justifyContent: 'end'
                                            }}
                                        >
                                            <CustomButton
                                                variant='text'
                                                customStyles={{ padding: '4px !important', height: '22px' }}
                                                onClick={handleBulkImport}
                                            >
                                                Upload
                                            </CustomButton>
                                            <Typography component='span'>|</Typography>
                                            <CustomButton
                                                variant='text'
                                                customStyles={{
                                                    padding: '4px !important',
                                                    height: '22px',
                                                    textDecoration: 'underline'
                                                }}
                                                type='button'
                                                onClick={() => {
                                                    setSelectedOptions(prev => {
                                                        const capitalizeWords = str =>
                                                            str.replace(/\b\w/g, char => char.toUpperCase()) // Capitalize the first letter of each word

                                                        const newValue = values?.newDropdownValue
                                                            ? capitalizeWords(values.newDropdownValue)
                                                            : ''

                                                        if (!newValue) {
                                                            dispatch(
                                                                openSnackbar({
                                                                    open: true,
                                                                    message: 'Please enter a valid value',
                                                                    variant: 'alert',
                                                                    alert: { color: 'error' },
                                                                    anchorOrigin: {
                                                                        vertical: 'top',
                                                                        horizontal: 'right'
                                                                    }
                                                                })
                                                            )
                                                            return prev // No update needed
                                                        }

                                                        if (
                                                            prev?.some(
                                                                option =>
                                                                    option.toLowerCase() === newValue.toLowerCase()
                                                            )
                                                        ) {
                                                            dispatch(
                                                                openSnackbar({
                                                                    open: true,
                                                                    message: 'Value already exists!',
                                                                    variant: 'alert',
                                                                    alert: { color: 'error' },
                                                                    anchorOrigin: {
                                                                        vertical: 'top',
                                                                        horizontal: 'right'
                                                                    }
                                                                })
                                                            )
                                                            return prev // No update needed
                                                        }
                                                        if (selectedOptions.length >= 100) {
                                                            dispatch(
                                                                openSnackbar({
                                                                    open: true,
                                                                    message: 'Maximum 100 options allowed.',
                                                                    variant: 'alert',
                                                                    alert: { color: 'error' },
                                                                    anchorOrigin: {
                                                                        vertical: 'top',
                                                                        horizontal: 'right'
                                                                    }
                                                                })
                                                            )
                                                            /* eslint-disable */
                                                            return
                                                            /* eslint-enable */
                                                        }

                                                        return [newValue, ...prev] // Add the new value
                                                    })
                                                    setFieldTouched('newDropdownValue', false)
                                                    setFieldValue('newDropdownValue', '')
                                                }}
                                            >
                                                Save Value
                                            </CustomButton>
                                        </Box>
                                        <CustomTextFieldWrapper
                                            as={CustomTextField}
                                            name='newDropdownValue'
                                            variant='outlined'
                                            size='small'
                                            placeholder='Enter options'
                                            fullWidth
                                            onKeyDown={event => {
                                                if (event.key === 'Enter') {
                                                    event.preventDefault() // Prevents default Enter actions
                                                    setSelectedOptions(prev => {
                                                        const capitalizeWords = str =>
                                                            str.replace(/\b\w/g, char => char.toUpperCase()) // Capitalize the first letter of each word

                                                        const newValue = values?.newDropdownValue
                                                            ? capitalizeWords(values.newDropdownValue)
                                                            : ''

                                                        if (!newValue) {
                                                            dispatch(
                                                                openSnackbar({
                                                                    open: true,
                                                                    message: 'Please enter a valid value',
                                                                    variant: 'alert',
                                                                    alert: { color: 'error' },
                                                                    anchorOrigin: {
                                                                        vertical: 'top',
                                                                        horizontal: 'right'
                                                                    }
                                                                })
                                                            )
                                                            return prev // No update needed
                                                        }

                                                        if (
                                                            prev?.some(
                                                                option =>
                                                                    option.toLowerCase() === newValue.toLowerCase()
                                                            )
                                                        ) {
                                                            dispatch(
                                                                openSnackbar({
                                                                    open: true,
                                                                    message: 'Value already exists!',
                                                                    variant: 'alert',
                                                                    alert: { color: 'error' },
                                                                    anchorOrigin: {
                                                                        vertical: 'top',
                                                                        horizontal: 'right'
                                                                    }
                                                                })
                                                            )
                                                            return prev // No update needed
                                                        }
                                                        if (selectedOptions.length >= 100) {
                                                            dispatch(
                                                                openSnackbar({
                                                                    open: true,
                                                                    message: 'Maximum 100 options allowed.',
                                                                    variant: 'alert',
                                                                    alert: { color: 'error' },
                                                                    anchorOrigin: {
                                                                        vertical: 'top',
                                                                        horizontal: 'right'
                                                                    }
                                                                })
                                                            )
                                                            /* eslint-disable */
                                                            return
                                                            /* eslint-enable */
                                                        }

                                                        return [newValue, ...prev] // Add the new value
                                                    })
                                                    /* eslint-disable */
                                                    setFieldTouched('newDropdownValue', false),
                                                        setFieldValue('newDropdownValue', '')
                                                    /* eslint-enable */
                                                }
                                            }}
                                            sx={{
                                                width: '100%'
                                            }}
                                        />
                                    </Grid>
                                )}

                                {showTextInput && (
                                    <Grid item xs={12} mt={2}>
                                        <Paper
                                            variant='outlined'
                                            sx={{
                                                padding: 1,
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                justifyContent: selectedOptions?.length <= 0 ? 'center' : 'unset',
                                                gap: 1,
                                                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                                                borderRadius: '12px',
                                                border: '1px solid',
                                                borderColor: 'grey.borderLight',
                                                maxHeight: '120px',
                                                overflowY: 'auto',
                                                overflowX: 'hidden'
                                            }}
                                        >
                                            {selectedOptions?.length > 0 ? (
                                                selectedOptions?.map((option, index) => (
                                                    <Chip
                                                        color='primary'
                                                        /* eslint-disable */
                                                        key={index}
                                                        /* eslint-enable */
                                                        label={option}
                                                        onDelete={() => handleDeleteTag(option)}
                                                    />
                                                ))
                                            ) : (
                                                <Box
                                                    sx={{
                                                        color: '#666',
                                                        padding: '8px'
                                                    }}
                                                >
                                                    Selected values will show up over here
                                                </Box>
                                            )}
                                        </Paper>
                                    </Grid>
                                )}
                            </Grid>
                        </Grid>
                        <Divider sx={{ borderColor: 'primary.main', marginTop: 2 }} />
                        <GlobalModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} closeOnBackdropClick={false}>
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    maxWidth: '90wh',
                                    maxHeight: '70vh',
                                    backgroundColor: '#fff',
                                    boxShadow: 24,
                                    p: 1,
                                    borderRadius: '8px',
                                    outline: 'none',
                                    overflowY: { sm: 'hidden', xs: 'auto' },
                                    overflowX: 'hidden'
                                }}
                            >
                                <CustomButton
                                    onClick={() => {
                                        setIsModalOpen(false)
                                    }}
                                    customStyles={{
                                        mt: 2,
                                        position: 'absolute',
                                        top: '-15px',
                                        left: '-14px',
                                        '&:hover': {
                                            backgroundColor: 'transparent', // Keep the background color the same on hover
                                            boxShadow: 'none' // Remove any shadow effect
                                        },
                                        '&:focus': {
                                            backgroundColor: 'transparent', // Keep the background color the same on hover
                                            boxShadow: 'none' // Remove any shadow effect
                                        }
                                        // textDecoration: 'underline'
                                    }}
                                    variant='text'
                                    disableRipple
                                >
                                    {/* eslint-disable  */}
                                    <Tooltip title='Go back'>
                                        <ArrowCircleLeft />
                                    </Tooltip>
                                </CustomButton>
                                <ImportFileModal
                                    handleFileSubmission={file => {
                                        if (!file) {
                                            dispatch(
                                                openSnackbar({
                                                    open: true,
                                                    message: 'No file selected.',
                                                    variant: 'alert',
                                                    alert: { color: 'error' },
                                                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                                                })
                                            )
                                            return
                                        }

                                        Papa.parse(file, {
                                            header: true,
                                            complete: result => {
                                                // Extract "Value" column from the CSV
                                                const extractedValues = result.data
                                                    .map(row => row.Value?.trim())
                                                    .filter(value => value) // Filter out empty or undefined values

                                                // Check if the CSV is invalid
                                                if (extractedValues.length === 0) {
                                                    dispatch(
                                                        openSnackbar({
                                                            open: true,
                                                            message:
                                                                'Invalid CSV format. Please upload a file with a "Value" column.',
                                                            variant: 'alert',
                                                            alert: { color: 'error' },
                                                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                                                        })
                                                    )
                                                    return
                                                }

                                                // Check if the total options exceed 100
                                                const totalOptions = extractedValues.length + selectedOptions.length
                                                if (totalOptions > 100) {
                                                    dispatch(
                                                        openSnackbar({
                                                            open: true,
                                                            message: 'Maximum 100 options allowed.',
                                                            variant: 'alert',
                                                            alert: { color: 'error' },
                                                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                                                        })
                                                    )
                                                    return
                                                }

                                                // Check for duplicate values (case-insensitive)
                                                const duplicateValues = extractedValues.filter(value =>
                                                    selectedOptions.some(
                                                        option => option.toLowerCase() === value.toLowerCase()
                                                    )
                                                )

                                                if (duplicateValues.length > 0) {
                                                    dispatch(
                                                        openSnackbar({
                                                            open: true,
                                                            message: `Duplicate values found in the file: ${duplicateValues.join(', ')}`,
                                                            variant: 'alert',
                                                            alert: { color: 'error' },
                                                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                                                        })
                                                    )
                                                    return
                                                }

                                                const capitalizeWords = str =>
                                                    str.replace(/\b\w/g, char => char.toUpperCase()) // Capitalize the first letter of each word

                                                // Capitalize extractedValues
                                                const capitalizedValues = extractedValues.map(value =>
                                                    capitalizeWords(value)
                                                )

                                                // If all checks pass, update selectedOptions
                                                setSelectedOptions(prev => [...prev, ...capitalizedValues])

                                                dispatch(
                                                    openSnackbar({
                                                        open: true,
                                                        message: 'File processed successfully!',
                                                        variant: 'alert',
                                                        alert: { color: 'success' },
                                                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                                                    })
                                                )
                                            },
                                            error: () => {
                                                // Handle parsing error
                                                dispatch(
                                                    openSnackbar({
                                                        open: true,
                                                        message: 'Failed to parse the file. Please try again.',
                                                        variant: 'alert',
                                                        alert: { color: 'error' },
                                                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                                                    })
                                                )
                                            }
                                        })
                                        setIsModalOpen(false)
                                    }}
                                    sampleFilePath='/csv/masters/catalogueValues.csv'
                                    sampleFileName='catalogueValues.csv'
                                />
                            </Box>
                        </GlobalModal>
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                justifyContent: 'end',
                                width: '100%',
                                mt: 0.5
                            }}
                        >
                            <CustomButton variant='clickable' type='submit' loading={createPropertyLKey}>
                                Submit
                            </CustomButton>
                        </Box>
                    </Form>
                )}
            </Formik>
        </Box>
    )
}

MasterDefinePropertiesForm.propTypes = {
    editId: PropTypes.number
}
