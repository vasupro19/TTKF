import { useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Grid, Box, Divider, Tooltip, IconButton, FormControlLabel, Checkbox } from '@mui/material'
import { Formik, Form, FieldArray } from 'formik'
import { z } from 'zod'
import CustomAutocomplete from '@core/components/extended/CustomAutocomplete'
import CustomButton from '@core/components/extended/CustomButton'
import { AddCircle, Delete } from '@mui/icons-material'
import { closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import {
    getFormatData,
    getFormatPropertyById,
    useCreateFormatPropertyMutation,
    useUpdateFormatPropertyMutation
} from '@/app/store/slices/api/catalogueSlice'

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

const validationSchema = z.object({
    properties: z.array(
        z.object({
            property: z
                .union([
                    z
                        .object({
                            value: z.number().min(1, { message: 'Property is required' }),
                            label: z.string()
                        })
                        .optional(),
                    z.string().min(1, 'Property is required')
                ])
                .optional(),
            isMandatory: z.boolean()
        })
    )
})

export default function MasterDefineCatalogueFormatForm({ editId }) {
    const formikRef = useRef()
    const dispatch = useDispatch()

    const { getFormatDataLKey, createFormatPropertyLKey, getFormatPropertyByIdLKey, updateFormatPropertyLKey } =
        useSelector(state => state.loading)

    const [createFormatProperty] = useCreateFormatPropertyMutation()
    const [updateFormatProperty] = useUpdateFormatPropertyMutation()

    // const propertyOptions = [
    //     'Product Code',
    //     'EAN/UPC',
    //     'Product Name',
    //     'Description',
    //     'Category',
    //     'Unit Cost',
    //     'MRP',
    //     'Expiry',
    //     'MFG',
    //     'LoT',
    //     'Pick Criteria',
    //     'UOM',
    //     'Colour',
    //     'Image Url'
    // ]
    const [propertyOptions, setPropertyOptions] = useState([])

    const initialValues = {
        properties: [
            {
                property: '',
                isMandatory: false
            }
        ]
    }

    const validate = values => {
        try {
            validationSchema.parse(values)
            return {}
        } catch (error) {
            const formikErrors = {}
            error.errors.forEach(err => {
                formikErrors[err.path.join('.')] = err.message
            })
            return formikErrors
        }
    }

    const boxRef = useRef(null)

    const getData = async () => {
        const { data } = await dispatch(getFormatData.initiate())
        if (!data.data.properties) return false
        setPropertyOptions(data.data.properties.map(prop => ({ label: prop.name, value: prop.id })))
        return data.data.properties
    }
    const getPropertyDataById = async id => {
        const { data } = await dispatch(getFormatPropertyById.initiate(id))

        setPropertyOptions([{ label: data.data.name, value: data.data.item_property_id }])
        formikRef.current.setValues({
            properties: [
                {
                    property: { label: data.data.name, value: data.data.item_property_id },
                    isMandatory: !!data.data.required
                }
            ]
        })
    }
    useEffect(() => {
        if (editId && parseInt(editId, 10)) getPropertyDataById(editId)
        if (!(editId && parseInt(editId, 10))) getData(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId])

    return (
        <Box>
            <Formik
                innerRef={formikRef}
                initialValues={initialValues}
                validate={validate}
                onSubmit={async (values, { resetForm }) => {
                    const payload = {}
                    values.properties.forEach(prop => {
                        payload[prop.property.value] = prop.isMandatory
                    })
                    let response
                    let message
                    let isError = false
                    if (editId && parseInt(editId, 10)) {
                        try {
                            response = await updateFormatProperty({
                                id: editId,
                                data: { required: values.properties[0].isMandatory || false }
                            }).unwrap()
                            message =
                                response?.data?.message || response?.message || 'catalogue format updated successfully!'
                        } catch (error) {
                            isError = true
                            message = error?.data?.message || error?.message || 'unable to update catalogue format'
                        }
                    } else {
                        try {
                            response = await createFormatProperty({ properties: { ...payload } }).unwrap()
                            message =
                                response.data.message || response?.message || 'catalogue format created successfully!'
                        } catch (error) {
                            isError = true
                            message = error?.data?.message || error?.message || 'unable to create catalogue format'
                        }
                    }
                    dispatch(
                        openSnackbar({
                            open: true,
                            message,
                            variant: 'alert',
                            alert: { color: isError ? 'error' : 'success' },
                            anchorOrigin: { vertical: 'top', horizontal: 'center' }
                        })
                    )
                    if (!isError) {
                        dispatch(closeModal())
                        resetForm()
                    }
                }}
            >
                {({ values, setFieldValue, setFieldTouched, errors, touched }) => (
                    <Form>
                        <FieldArray name='properties'>
                            {({ push, remove }) => (
                                <Box
                                    ref={boxRef}
                                    sx={{
                                        maxHeight: '220px',
                                        overflowY: 'auto',
                                        overflowX: 'hidden',
                                        paddingX: 2
                                    }}
                                >
                                    {values.properties.map((_, index) => (
                                        // eslint-disable-next-line react/no-array-index-key
                                        <Grid
                                            container
                                            // eslint-disable-next-line react/no-array-index-key
                                            key={index}
                                            spacing={2}
                                            alignItems='center'
                                            marginBottom={1}
                                            marginTop={0}
                                        >
                                            {/* Property Autocomplete  */}
                                            <Grid item xs={12} md={6}>
                                                <CustomAutocomplete
                                                    name={`properties[${index}].property`}
                                                    label='Property*'
                                                    loading={!!getFormatDataLKey || getFormatPropertyByIdLKey}
                                                    options={propertyOptions.filter(
                                                        opt =>
                                                            !values.properties.some(
                                                                (prop, i) =>
                                                                    prop.property?.value === opt.value && i !== index
                                                            )
                                                    )}
                                                    value={values.properties[index].property}
                                                    placeholder='Select a property'
                                                    // eslint-disable-next-line no-shadow
                                                    onChange={(_, value) => {
                                                        // TODO: find a solution to stop the user from selecting duplicates
                                                        // let present = false
                                                        // values.properties.forEach(prop => { if (prop.property.value === value.value) present = true })
                                                        // console.log('present ', present)
                                                        // if (!present) setFieldValue(`properties[${index}].property`, value || '')
                                                        setFieldValue(`properties[${index}].property`, value || '')
                                                    }}
                                                    onBlur={() =>
                                                        setFieldTouched(`properties[${index}].property`, true)
                                                    }
                                                    error={errors?.[`properties.${index}.property`]}
                                                    touched={touched.properties?.[index]?.property}
                                                    setFieldValue={setFieldValue}
                                                    setFieldTouched={setFieldTouched}
                                                    customInputSx={customInputSx}
                                                    customTextSx={customTextSx}
                                                    isOptionEqualToValue={(option, selectedValue) =>
                                                        (option?.value || option) ===
                                                        (selectedValue?.value || selectedValue)
                                                    }
                                                    customSx={{
                                                        minHeight: { sm: '60px' }
                                                    }}
                                                    helperText={
                                                        errors?.[`properties.${index}.property`] &&
                                                        'Please Select a property'
                                                    }
                                                />
                                            </Grid>
                                            {/* Mandatory Checkbox */}
                                            <Grid
                                                item
                                                xs={7}
                                                md={3.5}
                                                alignSelf='baseline'
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    minHeight: { sm: '60px' }
                                                }}
                                            >
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            color='primary'
                                                            size='medium'
                                                            sx={{
                                                                paddingY: '7.5px'
                                                            }}
                                                            checked={values.properties[index].isMandatory}
                                                            onChange={e =>
                                                                setFieldValue(
                                                                    `properties[${index}].isMandatory`,
                                                                    e.target.checked
                                                                )
                                                            }
                                                        />
                                                    }
                                                    label='Is Mandatory?'
                                                />
                                            </Grid>

                                            <Grid
                                                item
                                                xs={5}
                                                md={2}
                                                sx={{
                                                    alignSelf: 'self-start',
                                                    minHeight: { sm: '60px' }
                                                }}
                                            >
                                                {/* Remove Button */}
                                                {values.properties.length > 1 && (
                                                    <Tooltip title='Remove Row'>
                                                        {editId && !parseInt(editId, 10) && (
                                                            <IconButton
                                                                color='primary'
                                                                type='button'
                                                                onClick={() => remove(index)}
                                                            >
                                                                <Delete />
                                                            </IconButton>
                                                        )}
                                                    </Tooltip>
                                                )}
                                                {/* Add More Button */}
                                                {index === values.properties.length - 1 && (
                                                    <Tooltip title='Add More'>
                                                        {editId && !parseInt(editId, 10) && (
                                                            <IconButton
                                                                color='primary'
                                                                type='button'
                                                                onClick={async () => {
                                                                    await formikRef.current?.validateForm() // Trigger validation
                                                                    // Mark all fields as touched to show validation errors
                                                                    formikRef.current?.setTouched(
                                                                        Object.keys(formikRef.current?.values).reduce(
                                                                            (acc, key) => {
                                                                                acc[key] = true
                                                                                return acc
                                                                            },
                                                                            {}
                                                                        )
                                                                    )

                                                                    if (Object.keys(errors).length > 0) {
                                                                        // If errors exist, display a snackbar and do not open the modal
                                                                        dispatch(
                                                                            openSnackbar({
                                                                                open: true,
                                                                                message:
                                                                                    'Please select the property first.',
                                                                                variant: 'alert',
                                                                                alert: { color: 'error' },
                                                                                anchorOrigin: {
                                                                                    vertical: 'top',
                                                                                    horizontal: 'center'
                                                                                }
                                                                            })
                                                                        )
                                                                        return
                                                                    }
                                                                    push({ property: '', isMandatory: false })
                                                                    // Scroll to bottom
                                                                    setTimeout(() => {
                                                                        if (boxRef.current) {
                                                                            boxRef.current.scrollTo({
                                                                                top: boxRef.current.scrollHeight,
                                                                                behavior: 'smooth'
                                                                            })
                                                                        }
                                                                    }, 0)
                                                                }}
                                                            >
                                                                <AddCircle />
                                                            </IconButton>
                                                        )}
                                                    </Tooltip>
                                                )}
                                            </Grid>
                                        </Grid>
                                    ))}
                                </Box>
                            )}
                        </FieldArray>
                        <Divider sx={{ borderColor: 'primary.main', marginTop: 2 }} />
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                justifyContent: 'end',
                                width: '100%',
                                mt: 0.5
                            }}
                        >
                            <CustomButton
                                variant='clickable'
                                type='submit'
                                loading={createFormatPropertyLKey || updateFormatPropertyLKey}
                            >
                                Submit
                            </CustomButton>
                        </Box>
                    </Form>
                )}
            </Formik>
        </Box>
    )
}

MasterDefineCatalogueFormatForm.propTypes = {
    editId: PropTypes.number
}
