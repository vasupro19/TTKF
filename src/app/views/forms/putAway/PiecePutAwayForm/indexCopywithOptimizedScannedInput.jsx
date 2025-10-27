/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react'
import { Formik, Form } from 'formik'
import { Grid, Button, Box, InputAdornment, useMediaQuery, Tooltip } from '@mui/material'
import MainCard from '@core/components/extended/MainCard'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import CustomFormInput from '@/core/components/extended/CustomFormInput'
import { QrCodeScanner } from '@mui/icons-material'
import z from 'zod'
import CustomButton from '@/core/components/extended/CustomButton'
import { RefreshAnimIcon } from '@/assets/icons/RefreshAnimIcon'
import { openSnackbar } from '@/app/store/slices/snackbar'
import { useDispatch } from 'react-redux'

function PiecePutAwayForm({ onSubmit, GRNBinId, setFormValues, techniques, mode, setSelectedView }) {
    const dispatch = useDispatch()
    const [focusTarget, setFocusTarget] = useState('storageLocation')
    const [modalOpen, setModalOpen] = useState(false)
    const [isVerified, setIsVerified] = useState({
        storageLocation: false,
        scanBin: false,
        itemId: false
    })

    const initialValues = {
        scanBin: '',
        storageLocation: '',
        itemId: ''
    }

    const validationSchema = z.object({
        storageLocation: z.string().trim().min(1, 'Storage Location is required'),
        scanBin: z.string().trim().min(1, 'Scan Bin is required'),
        itemId: z.string().trim().min(1, 'Item ID is required')
    })

    const binInputRef = useRef(null)
    const locationInputRef = useRef(null)
    const itemInputRef = useRef(null)
    const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm')) // Mobile check

    // useEffect(() => {
    //     if ((focusTarget && GRNBinId) || mode === 'Job') {
    //         const targetRef = {
    //             storageLocation: locationInputRef,
    //             scanBin: binInputRef,
    //             itemId: itemInputRef
    //         }[focusTarget]
    //         targetRef?.current?.focus()
    //         setFocusTarget(null)
    //     }
    // }, [focusTarget])

    useEffect(() => {
        if (GRNBinId || mode === 'Job') {
            locationInputRef.current?.focus()
        }
    }, [GRNBinId])

    const handleFocusScroll = inputRef => {
        if (isMobile && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect()
            const offset = 98 // Add padding to the top
            window.scrollTo({
                top: window.scrollY + rect.top - offset,
                behavior: 'smooth'
            })
        }
    }

    const validate = values => {
        try {
            validationSchema.parse(values)
            return {}
        } catch (error) {
            const errors = {}
            error.errors.forEach(err => {
                errors[err.path[0]] = err.message
            })
            return errors
        }
    }

    // console.log('🤔🤔pieceputAwayForm')

    useEffect(() => {
        console.log('focusTarget==-=-=>',focusTarget)
        console.log('binInputRef.current',binInputRef.current)
        if (focusTarget === 'scanBin' && binInputRef.current) {
          binInputRef.current.focus()
        }
        if(focusTarget === 'itemId' && itemInputRef.current){
            itemInputRef.current.focus()
        }
      }, [focusTarget])
      

    return (
        <Box sx={{ padding: 0.5 }}>
            <Formik
                initialValues={initialValues}
                validate={validate}
                onSubmit={(values, actions) => {
                    onSubmit(values, actions)
                }}
                validateOnBlur={false}
                validateOnChange={false}
            >
                {formik => (
                    <Form>
                        {console.log('formik.errors', formik?.errors)}
                        {console.log('formik.touched', formik?.touched)}
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} sm={mode === 'Freehand' ? 4 : 6}>
                                <CustomFormInput
                                    name='storageLocation'
                                    label='Scan Storage Location*'
                                    placeholder='Scan Storage Location'
                                    formik={formik}
                                    inputProps={{
                                        inputRef: locationInputRef,
                                        onKeyPress: e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                console.log('e.target.value:', e.target.value)
                                                if (e.target.value.trim()) {
                                                    setFocusTarget('scanBin')
                                                    setIsVerified(prev => ({ ...prev, storageLocation: true }))
                                                    setSelectedView(0)
                                                }
                                            }
                                        },
                                        onChange: e => {
                                            formik.setFieldValue('storageLocation', e.target.value)
                                            setFormValues(prev => ({ ...prev, storageLocation: e.target.value }))
                                        },
                                        endAdornment: (
                                            <InputAdornment position='end'>
                                                <QrCodeScanner />
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            '&.Mui-focused .MuiInputAdornment-root svg': {
                                                color: 'primary.main' // Change color when focused
                                            }
                                        }
                                    }}
                                    customSx={
                                        isVerified?.storageLocation
                                            ? {
                                                  '& .MuiInputBase-root.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                                                      {
                                                          borderColor: 'secondary.dark'
                                                      },
                                                  '& .MuiOutlinedInput-notchedOutline': {
                                                      borderColor: 'secondary.dark',
                                                      borderWidth: '2px',
                                                      '&:hover': {
                                                          borderColor: 'secondary.dark',
                                                          borderWidth: '2px'
                                                      }
                                                  },
                                                  '& .Mui-disabled .MuiOutlinedInput-notchedOutline': {
                                                      borderColor: 'secondary.dark'
                                                  }
                                              }
                                            : {}
                                    }
                                    autoComplete='off'
                                    disabled={isVerified?.storageLocation}
                                    setFocusTarget={setFocusTarget}
                                    elementToFocus={'scanBin'}
                                    focusTarget={focusTarget}
                                />
                            </Grid>

                            <Grid item xs={12} sm={mode === 'Freehand' ? 4 : 6}>
                                <CustomFormInput
                                    name='scanBin'
                                    label='Scan Bin Id*'
                                    placeholder='Scan Bin Id'
                                    formik={formik}
                                    inputProps={{
                                        inputRef: binInputRef,
                                        onKeyPress: e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                if (e.target.value.trim()) {
                                                    setFocusTarget('itemId')
                                                    setIsVerified(prev => ({ ...prev, scanBin: true }))
                                                }
                                            }
                                        },
                                        onChange: e => {
                                            formik.setFieldValue('scanBin', e.target.value)
                                        },
                                        endAdornment: (
                                            <InputAdornment position='end'>
                                                <QrCodeScanner />
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            '&.Mui-focused .MuiInputAdornment-root svg': {
                                                color: 'primary.main' // Change color when focused
                                            }
                                        }
                                    }}
                                    customSx={
                                        isVerified?.scanBin
                                            ? {
                                                  '& .MuiInputBase-root.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                                                      {
                                                          borderColor: 'secondary.dark'
                                                      },
                                                  '& .MuiOutlinedInput-notchedOutline': {
                                                      borderColor: 'secondary.dark',
                                                      borderWidth: '2px',
                                                      '&:hover': {
                                                          borderColor: 'secondary.dark',
                                                          borderWidth: '2px'
                                                      }
                                                  },
                                                  '& .Mui-disabled .MuiOutlinedInput-notchedOutline': {
                                                      borderColor: 'secondary.dark'
                                                  }
                                              }
                                            : {}
                                    }
                                    autoComplete='off'
                                    disabled={!formik?.values?.storageLocation.trim() || isVerified?.scanBin}
                                    setFocusTarget={setFocusTarget}
                                    elementToFocus={'itemId'}
                                />
                            </Grid>

                            <Grid item xs={12} sm={mode === 'Freehand' ? 4 : 6}>
                                <CustomFormInput
                                    name='itemId'
                                    label='Scan Item ID*'
                                    placeholder='Scan Item'
                                    formik={formik}
                                    inputProps={{
                                        inputRef: itemInputRef,
                                        onFocus: () => handleFocusScroll(itemInputRef), // Scroll when focused
                                        onKeyPress: e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                formik.handleSubmit()
                                            }
                                        },
                                        onChange: e => {
                                            formik.setFieldValue('itemId', e.target.value)
                                        },
                                        endAdornment: (
                                            <InputAdornment position='end'>
                                                <QrCodeScanner
                                                    sx={{ color: focusTarget === 'itemId' ? 'primary.main' : 'unset' }}
                                                />
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            '&.Mui-focused .MuiInputAdornment-root svg': {
                                                color: 'primary.main' // Change color when focused
                                            }
                                        }
                                    }}
                                    autoComplete='off'
                                    disabled={!formik?.values?.scanBin?.trim()}
                                    handleSubmitForm={()=>{
                                        formik.handleSubmit()
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sx={{ textAlign: 'right' }}>
                                <CustomButton
                                    type='button'
                                    variant='outlined'
                                    color='primary'
                                    customStyles={{
                                        marginRight: 1
                                    }}
                                    shouldAnimate
                                    endIcon={<RefreshAnimIcon />}
                                    onClick={() => {
                                        formik?.resetForm()
                                        setFormValues({
                                            scanBin: '',
                                            storageLocation: '',
                                            itemId: ''
                                        })
                                        setFocusTarget('storageLocation')
                                        setIsVerified({
                                            storageLocation: false,
                                            scanBin: false,
                                            itemId: false
                                        })
                                        if (techniques == 'Suggested' || techniques == 'Directed') {
                                            setSelectedView(1)
                                        }
                                        dispatch(
                                            openSnackbar({
                                                open: true,
                                                message: 'Scan storage location!',
                                                variant: 'alert',
                                                alert: { color: 'info', icon: 'info' },
                                                anchorOrigin: { vertical: 'top', horizontal: 'right' },
                                                autoHideDuration: 3000
                                            })
                                        )
                                        window.scrollTo({ top: 0, behavior: 'smooth' })
                                    }}
                                >
                                    {'Switch Location'}
                                </CustomButton>
                                <CustomButton
                                    type='submit'
                                    variant='contained'
                                    color='primary'
                                    disabled={!formik.isValid || formik.isSubmitting}
                                >
                                    {'Submit'}
                                </CustomButton>
                            </Grid>
                        </Grid>

                        {modalOpen && (
                            <ConfirmModal
                                title='Mapping Already Exists'
                                message='Are you sure you want to proceed?'
                                onConfirm={() => {
                                    setModalOpen(false)
                                    setFocusTarget('storageLocation')
                                }}
                                onCancel={() => setModalOpen(false)}
                            />
                        )}
                    </Form>
                )}
            </Formik>
        </Box>
    )
}

export default PiecePutAwayForm
