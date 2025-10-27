/* eslint-disable */
import React, { useState } from 'react'
import { Grid, Button, Box, TextField } from '@mui/material'
import { Formik, Form } from 'formik'
import { z } from 'zod'
import CustomAutocomplete from '@/core/components/extended/CustomAutocomplete'
import { useDispatch } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'

const validationSchema = z.object({
    user: z
        .object({
            id: z.number(),
            label: z.string()
        })
        .nullable()
        .refine(val => val !== null, { message: 'User is required' }),
    location: z
        .object({
            id: z.string(),
            label: z.string()
        })
        .nullable()
        .optional(),
    itemIds: z.string().nonempty('Item Ids are required')
})

const validate = values => {
    try {
        validationSchema.parse(values)
        return {}
    } catch (error) {
        const errors = {}
        if (error instanceof z.ZodError) {
            error.errors.forEach(err => {
                const fieldName = err.path[0]
                if (fieldName) {
                    errors[fieldName] = err.message
                }
            })
        }
        return errors
    }
}

// Mock options for the autocomplete inputs
const users = [
    { id: 1, label: 'Michael Scott (101)' },
    { id: 2, label: 'Jim Halpert (102)' },
    { id: 3, label: 'Pam Beesly (103)' },
    { id: 4, label: 'Dwight Schrute (104)' },
    { id: 5, label: 'Angela Martin (105)' },
    { id: 6, label: 'Kevin Malone (106)' },
    { id: 7, label: 'Ryan Howard (107)' },
    { id: 8, label: 'Toby Flenderson (108)' },
    { id: 9, label: 'Stanley Hudson (109)' },
    { id: 10, label: 'Phyllis Vance (110)' }
]

const locations = [
    { id: 'LOC-001', label: 'Location 001' },
    { id: 'LOC-002', label: 'Location 002' }
]

const ManageJobsCreatePieceForm = ({ initialValues, setUserName }) => {
    const dispatch = useDispatch()
    const [isUserDisabled, setIsUserDisabled] = useState(false)

    // const initialValues = {
    //   user: null,
    //   location: null,
    //   itemIds: ''
    // }

    const handleSubmit = (values, { resetForm }) => {
        console.log('Form values:', values)
        // Split the pasted Item Ids (by newline) into an array and filter empty lines
        const itemIdsArray = values.itemIds
            .split('\n')
            .map(id => id.trim())
            .filter(id => id !== '')

        dispatch(
            openSnackbar({
                open: true,
                message: 'Assigned successfully!',
                variant: 'alert',
                alert: { color: 'success', icon: 'success' },
                anchorOrigin: { vertical: 'top', horizontal: 'right' },
                autoHideDuration: 3000
            })
        )
        resetForm()
        setIsUserDisabled(false)
    }

    const customSx = {
        '& input': {
            backgroundColor: '#fff',
            padding: '12px 8px',
            height: '20px'
        },
        '& .MuiInputBase-root.MuiOutlinedInput-root': {
            backgroundColor: 'white'
        },
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'gray'
        },
        flexGrow: 1
    }

    return (
        <Box sx={{ p: 3, pr: 0, pl: 1, width: '100%' }}>
            <Formik initialValues={initialValues} validate={validate} onSubmit={handleSubmit}>
                {({ values, errors, touched, setFieldValue, setFieldTouched, resetForm }) => (
                    <Form>
                        <Grid container spacing={1}>
                            {/* Select User */}
                            <Grid item xs={12} md={4}>
                                <CustomAutocomplete
                                    name='user'
                                    label='Select User*'
                                    options={users}
                                    value={values?.user}
                                    onChange={(event, selectedOption) => {
                                        setFieldValue('user', selectedOption)
                                        setUserName(selectedOption)
                                    }}
                                    onBlur={() => {
                                        setFieldTouched('user', true)
                                        if (values.user) {
                                            setIsUserDisabled(true)
                                        }
                                    }}
                                    touched={touched.user}
                                    error={errors.user}
                                    setFieldValue={setFieldValue}
                                    setFieldTouched={setFieldTouched}
                                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                                    getOptionLabel={option => option.label}
                                    customSx={customSx}
                                    isDisabled={isUserDisabled}
                                    clearValFunc={() => {
                                        setFieldValue('user', null)
                                        setIsUserDisabled(false)
                                    }}
                                />
                            </Grid>

                            {/* Storage Location (Optional) */}
                            <Grid item xs={12} md={4}>
                                <CustomAutocomplete
                                    name='location'
                                    label='Storage Location'
                                    options={locations}
                                    value={values.location}
                                    onChange={(e, value) => setFieldValue('location', value)}
                                    onBlur={() => setFieldTouched('location', true)}
                                    touched={touched.location}
                                    error={errors.location}
                                    setFieldValue={setFieldValue}
                                    setFieldTouched={setFieldTouched}
                                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                                    getOptionLabel={option => option.label}
                                    customSx={customSx}
                                    clearValFunc={() => setFieldValue('location', null)}
                                />
                            </Grid>

                            {/* Item Ids Input */}
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label='Item Ids*'
                                    name='itemIds'
                                    value={values.itemIds}
                                    placeholder='paste Ids or type here'
                                    onChange={e => setFieldValue('itemIds', e.target.value)}
                                    onBlur={() => setFieldTouched('itemIds', true)}
                                    error={touched.itemIds && Boolean(errors.itemIds)}
                                    helperText={touched.itemIds && errors.itemIds}
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    maxRows={4}
                                    sx={{ paddingTop: 0.5, ...customSx }}
                                    clearValFunc={() => {
                                        setFieldValue(itemIds, '')
                                    }}
                                />
                            </Grid>

                            {/* Buttons */}
                            <Grid item xs={12} textAlign='end'>
                                <Button
                                    type='button'
                                    variant='outlined'
                                    onClick={() => {
                                        resetForm()
                                        setUserName(null)
                                        setIsUserDisabled(false)
                                    }}
                                >
                                    Reset
                                </Button>
                                <Button type='submit' variant='contained' color='primary' sx={{ ml: 1 }}>
                                    Add
                                </Button>
                            </Grid>
                        </Grid>
                    </Form>
                )}
            </Formik>
        </Box>
    )
}

export default ManageJobsCreatePieceForm
