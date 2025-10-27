import React from 'react'
import { Formik } from 'formik'
import Button from '@mui/material/Button'
import { styled, TableCell, TextField } from '@mui/material'
import { z } from 'zod'
import { useDispatch } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'
import CustomAutocomplete from '../CustomAutocomplete'

function DynamicFormikTable({ tabsFields, onSubmit, globalCellStyles }) {
    const dispatch = useDispatch()

    // Custom styles
    const CustomTextField = styled(TextField)({
        '& input': {
            backgroundColor: '#fff',
            padding: '4px 8px',
            height: '10px', // Decrease input height
            boxShadow: 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px'
        },
        width: 'auto',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'gray' // Optional: change border color if needed
        }
    })
    const customSx = {
        '& input': {
            backgroundColor: '#fff',
            padding: '4px 8px',
            height: '8px' // Decrease input height
        },
        '& .MuiInputBase-root.MuiOutlinedInput-root': {
            backgroundColor: 'white' // Apply the white background to the root element
        },
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'gray' // Optional: change border color if needed
        }
    }
    const customInputSx = {
        '&.MuiAutocomplete-hasPopupIcon .MuiOutlinedInput-root, &.MuiAutocomplete-hasClearIcon .MuiOutlinedInput-root':
            {
                paddingRight: '6px !important', // Set your desired padding here
                boxShadow: 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px'
            }
    }
    const bdStr = '2px solid !important'

    const validationSchema = z.object({
        productCode: z.string().refine(value => value === null || /^[a-zA-Z0-9]+$/.test(value), {
            message: 'Product code must contain only alphanumeric characters'
        })
    })
    const initialValues = tabsFields?.reduce((acc, field) => {
        if (field.name === 'productCode') {
            acc[field.name] = null
        } else {
            acc[field.name] = ''
        }
        return acc
    }, {})

    const handleCustomChange = (e, { setFieldValue, handleChange }) => {
        const { name, value } = e.target

        console.log('name', name)
        console.log('value', value)
        if (['quantity'].includes(name)) {
            // Prevent negative values or allow empty input
            if (value === '') {
                setFieldValue(name, '') // Allow empty value
            } else {
                let numericValue = parseFloat(value)
                if (Number.isNaN(numericValue) || numericValue < 0) {
                    numericValue = 0 // Reset to 0 if invalid
                }
                setFieldValue(name, numericValue)
            }
        } else if (['taxPercentage', 'discount'].includes(name)) {
            // Allow positive decimal values between 0 and 100
            if (value === '') {
                setFieldValue(name, '') // Allow empty value
            } else {
                let numericValue = parseFloat(value)
                if (Number.isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
                    numericValue = Math.max(0, Math.min(100, numericValue || 0)) // Clamp between 0 and 100
                }
                setFieldValue(name, numericValue)
            }
        } else {
            // Default handler for other fields
            handleChange(e)
        }
    }

    const validate = values => {
        try {
            validationSchema.parse(values) // Validate using Zod
            return {} // Return no errors if validation passes
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Please select a Product code',
                    variant: 'alert',
                    alert: { color: 'warning', icon: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return error.formErrors.fieldErrors // Map Zod errors to Formik errors
        }
    }

    return (
        <Formik
            initialValues={initialValues}
            onSubmit={(values, { resetForm }) => {
                // Your submission logic here (e.g., API call)
                console.log('Form submitted with values:', values)
                onSubmit(values)
                // Reset the form after successful submission
                resetForm()
            }}
            validate={validate}
            validateOnBlur={false} // Disable validation on blur
            validateOnChange // Disable validation on change
        >
            {({ values, handleChange, setFieldValue, setFieldTouched, handleSubmit, errors, touched }) => (
                <>
                    {tabsFields?.map((field, index) => (
                        <TableCell
                            // eslint-disable-next-line react/no-array-index-key
                            key={index}
                            sx={{
                                borderTop: bdStr,
                                borderBottom: bdStr,
                                ...globalCellStyles
                            }}
                        >
                            {field.type === 'CustomAutocomplete' ? (
                                <CustomAutocomplete
                                    name={field.name}
                                    options={field.options}
                                    placeholder={field.placeholder}
                                    value={values[field.name]}
                                    onChange={(event, value) => {
                                        setFieldValue(field.name, value)
                                    }}
                                    customSx={field.customSx || customSx}
                                    customInputSx={field.customInputSx || customInputSx}
                                    tempUi
                                    showAdornment={false}
                                    customInputProp={{
                                        height: '30px'
                                    }}
                                    setFieldValue={setFieldValue}
                                    setFieldTouched={setFieldTouched}
                                    touched={touched[field.name]}
                                    error={errors[field.name]}
                                    showErrors={false}
                                    isOptionEqualToValue={(option, selectedValue) => option.value === selectedValue}
                                />
                            ) : (
                                <CustomTextField
                                    variant='outlined'
                                    name={field.name}
                                    type={field.type}
                                    size='small'
                                    fullWidth
                                    placeholder={field.placeholder}
                                    disabled={field.isDisabled}
                                    value={values[field.name]}
                                    onChange={e => handleCustomChange(e, { setFieldValue, handleChange })}
                                />
                            )}
                        </TableCell>
                    ))}
                    <TableCell
                        sx={{
                            borderRight: bdStr,
                            borderTop: bdStr,
                            borderBottom: bdStr,
                            borderBottomRightRadius: '8px',
                            borderTopRightRadius: '8px',
                            ...globalCellStyles
                        }}
                    >
                        <Button
                            variant='contained'
                            size='small'
                            sx={{
                                padding: '4px'
                            }}
                            onClick={handleSubmit}
                        >
                            + Add
                        </Button>
                    </TableCell>
                </>
            )}
        </Formik>
    )
}

export default DynamicFormikTable
