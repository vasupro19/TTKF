/* eslint-disable */
import React, { useState } from 'react'
import { Grid, Button, Box, Paper, Chip } from '@mui/material'
import { Formik, Form } from 'formik'
import { z } from 'zod'
import CustomAutocomplete from '@/core/components/extended/CustomAutocomplete'
import { useDispatch } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'

const validationSchema = z.object({
  user: z.object({
    id: z.number(),
    label: z.string()
  }).nullable().refine(val => val !== null, { message: 'User is required' }),
  bin: z.preprocess(
    val => val === null ? undefined : val,
    z.union([
      z.object({
        id: z.string(),
        label: z.string()
      }),
      z.array(z.object({
        id: z.string(),
        label: z.string()
      }))
    ]).optional()
  ),
  location: z.object({
    id: z.string(),
    label: z.string(),
    type: z.string() // 'pallet' or 'standard'
  }).nullable().optional()
}).superRefine((data, ctx) => {
  // Always require bin
  if (data.bin === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Bin is required',
      path: ['bin']
    })
    return
  }
  // For pallet location, bin must be an array with at least one element
  if (data.location?.type === 'pallet') {
    if (!Array.isArray(data.bin) || data.bin.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bin is required',
        path: ['bin']
      })
    }
  }
  else {
    // For standard location, bin must be an object (not an array)
    if (Array.isArray(data.bin)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bin is required',
        path: ['bin']
      })
    }
  }
})



const validate = values => {
  try {
    validationSchema.parse(values)
    return {}
  }
  catch (error) {
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
  ];
  

const bins = [
  { id: 'BIN-001', label: 'Bin 001' },
  { id: 'BIN-002', label: 'Bin 002' },
  { id: 'BIN-003', label: 'Bin 003' },
  { id: 'BIN-004', label: 'Bin 004' },
  { id: 'BIN-005', label: 'Bin 005' },
  { id: 'BIN-006', label: 'Bin 006' }
]

const locations = [
  { id: 'LOC-001', label: 'Location 001', type: 'bin' },
  { id: 'LOC-002', label: 'Location 002', type: 'pallet' }
]

const ManageJobsCreateBinForm = ({initialValues, setUserName}) => {
  const dispatch = useDispatch()
  const [isUserDisabled, setIsUserDisabled] = useState(false)

  // const initialValues = {
  //   user: null,
  //   bin: null,
  //   location: null
  // }

  const handleSubmit = (values, { setFieldValue, setFieldTouched, setErrors }) => {
    console.log('Form values:', values)

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

    // Reset bin and location
    setErrors(prevErrors => ({ ...prevErrors, bin: undefined, location: undefined }))
    setFieldValue('bin', null)
    setFieldValue('location', null)
    setFieldTouched('bin', false)
    setFieldTouched('location', false)
  }

  const handleDeleteBin = (binToDelete, values, setFieldValue) => {
    if (Array.isArray(values.bin)) {
      setFieldValue('bin', values.bin.filter(bin => bin.id !== binToDelete.id))
    }
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
              {/* User Selection */}
              <Grid item xs={12} md={4}>
                <CustomAutocomplete
                  name='user'
                  label='Select User*'
                  options={users}
                  value={values.user}
                  placeholder={'Select a user'}
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

              {/* Storage Location */}
              <Grid item xs={12} md={4}>
                <CustomAutocomplete
                  name='location'
                  label='Storage Location'
                  options={locations}
                  value={values.location}
                  placeholder={'Select a location code'}
                  onChange={(e, value) => {
                    setFieldValue('location', value)
                    // Reset bin when location changes
                    setFieldValue('bin', null)
                  }}
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

              {/* Bin Selection */}
              <Grid item xs={12} md={4}>
                <CustomAutocomplete
                  name='bin'
                  label='Select Bin*'
                  options={bins}
                  value={Array.isArray(values.bin)?null:values.bin}
                  placeholder={'Select a bin ID'}
                  onChange={(e, value) => {
                    if (values.location?.type === 'pallet') {
                      const currentBins = Array.isArray(values.bin) ? values.bin : []
                      setFieldValue('bin', [...currentBins, value])
                    }
                    else {
                      setFieldValue('bin', value)
                    }
                  }}
                  onBlur={() => setFieldTouched('bin', true)}
                  touched={touched.bin}
                  error={errors.bin}
                  setFieldValue={setFieldValue}
                  setFieldTouched={setFieldTouched}
                  isOptionEqualToValue={(option, value) => {
                    if (values.location?.type === 'pallet') {
                      return Array.isArray(values.bin) && values.bin.some(b => b.id === option.id)
                    }
                    return option.id === value?.id
                  }}
                  getOptionLabel={option => option.label}
                  customSx={customSx}
                  clearValFunc={() => {
                    if (values.location?.type === 'pallet') {
                      setFieldValue('bin', [])
                    }
                    else {
                      setFieldValue('bin', null)
                    }
                  }}
                />
              </Grid>

              {/* Display Selected Bins as Chips if location is 'pallet' */}
              {values.location?.type === 'pallet' && (
                <Grid item xs={12}>
                  <Paper
                    variant='outlined'
                    sx={{
                      padding: 1,
                      display: 'flex',
                      flexWrap: 'wrap',
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
                    {Array.isArray(values.bin) && values.bin.length > 0 ? (
                      values.bin.map((bin, index) => (
                        <Chip
                          key={index}
                          label={bin.label}
                          onDelete={() => handleDeleteBin(bin, values, setFieldValue)}
                          color='primary'
                        />
                      ))
                    ) : (
                      <Box sx={{ color: '#666', padding: '8px' }}>
                        Selected values will show up here
                      </Box>
                    )}
                  </Paper>
                </Grid>
              )}

              {/* Buttons */}
              <Grid item xs={12} textAlign='end'>
                <Button
                  type='reset'
                  variant='outlined'
                  onClick={() => {
                    resetForm()
                    setUserName(null)
                    setIsUserDisabled(false)
                  }}
                >
                  Reset
                </Button>
                <Button
                  type='submit'
                  variant='contained'
                  sx={{ ml: 1 }}
                >
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

export default ManageJobsCreateBinForm
