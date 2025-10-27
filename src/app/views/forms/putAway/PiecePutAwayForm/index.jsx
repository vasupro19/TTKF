import React, { useState, useEffect, useRef } from 'react'
import { Formik, Form } from 'formik'
import { Grid, Box, InputAdornment, useMediaQuery, CircularProgress } from '@mui/material'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import CustomFormInput from '@/core/components/extended/CustomFormInput'
import { QrCodeScanner } from '@mui/icons-material'
import z from 'zod'
import CustomButton from '@/core/components/extended/CustomButton'
import { RefreshAnimIcon } from '@/assets/icons/RefreshAnimIcon'
import { openSnackbar } from '@/app/store/slices/snackbar'
import { useDispatch, useSelector } from 'react-redux'
import {
    validateAddress,
    validateToBin,
    useScanItemMutation,
    useSubmitPutAwayMutation
} from '@/app/store/slices/api/putAwaySlice'
import { removeItemFromPendingPutAwayData } from '@/app/store/slices/putAway'

const getCustomSx = isVerifiedValue =>
    isVerifiedValue
        ? {
              '& .MuiInputBase-root.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
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

// eslint-disable-next-line react/prop-types
function PiecePutAwayForm({ GRNBinId, setFormValues, techniques, mode, setSelectedView }) {
    const dispatch = useDispatch()
    const { validateAddressLKey, validateToBinLKey, scanItemLKey } = useSelector(state => state.loading)
    const [focusTarget, setFocusTarget] = useState('storageLocation')
    const [modalOpen, setModalOpen] = useState(false)
    const [isVerified, setIsVerified] = useState({
        storageLocation: false,
        scanBin: false,
        itemId: false
    })
    const [scanItem] = useScanItemMutation()
    // eslint-disable-next-line no-unused-vars
    const [submitPutAway] = useSubmitPutAwayMutation()
    // const [scanItemResponse, setScanItemResponse] = useState(null)

    const initialValues = {
        scanBin: '',
        storageLocation: '',
        itemId: ''
    }

    const pendingPutAwayData = useSelector(state => state.putAway.pendingPutAwayData)

    const validationSchema = z.object({
        storageLocation: z.string().trim().min(1, 'Storage Location is required'),
        scanBin: z.string().trim().min(1, 'Scan Bin is required'),
        itemId: z.string().trim().min(1, 'Item ID is required')
    })

    const binInputRef = useRef(null)
    const locationInputRef = useRef(null)
    const itemInputRef = useRef(null)
    const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm')) // Mobile check

    useEffect(() => {
        if (focusTarget) {
            const targetRef = {
                storageLocation: locationInputRef,
                scanBin: binInputRef,
                itemId: itemInputRef
            }[focusTarget]
            targetRef?.current?.focus()
            setFocusTarget(null)
        }
    }, [focusTarget])

    useEffect(() => {
        if (GRNBinId || mode === 'Job') {
            locationInputRef.current?.focus()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // const handleSubmit = async (values, actions) => {
    // try {
    // const response = await submitPutAway({
    // id: scanItemResponse.data.putawayDetail.id
    // }).unwrap()

    // if (response && response.success) {
    // dispatch(
    // openSnackbar({
    // open: true,
    // message: 'Put away submitted successfully!',
    // variant: 'alert',
    // alert: { color: 'success', icon: 'success' },
    // anchorOrigin: { vertical: 'top', horizontal: 'right' },
    // autoHideDuration: 3000
    // })
    // )
    // actions.resetForm()
    // setIsVerified({
    // storageLocation: false,
    // scanBin: false,
    // itemId: false
    // })
    // setFocusTarget('storageLocation')
    // } else {
    // const errorMessage = response?.message || 'Putaway failed!'
    // dispatch(
    // openSnackbar({
    // open: true,
    // message: errorMessage,
    // variant: 'alert',
    // alert: { color: 'error', icon: 'error' },
    // anchorOrigin: { vertical: 'top', horizontal: 'right' },
    // autoHideDuration: 3000
    // })
    // )
    // }
    // } catch (error) {
    // const errorMessage = error?.data?.message || error?.message || 'Putaway failed!'
    // dispatch(
    // openSnackbar({
    // open: true,
    // message: errorMessage,
    // variant: 'alert',
    // alert: { color: 'error', icon: 'error' },
    // anchorOrigin: { vertical: 'top', horizontal: 'right' },
    // autoHideDuration: 3000
    // })
    // )
    // } finally {
    // actions.setSubmitting(false)
    // }
    // }

    return (
        <Box sx={{ padding: 0.5 }}>
            <Formik
                initialValues={initialValues}
                validate={validate}
                // onSubmit={handleSubmit}
                validateOnBlur={false}
                validateOnChange={false}
            >
                {formik => (
                    <Form>
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} sm={mode === 'Freehand' ? 4 : 6}>
                                <CustomFormInput
                                    name='storageLocation'
                                    label='Scan Storage Location*'
                                    placeholder='Scan Storage Location'
                                    formik={formik}
                                    inputProps={{
                                        inputRef: locationInputRef,
                                        onKeyPress: async e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()

                                                if (!e.target.value.trim()) return

                                                try {
                                                    const response = await dispatch(
                                                        validateAddress.initiate(
                                                            `?address=${encodeURIComponent(e.target.value)}&putaway_type=piece`
                                                        )
                                                    ).unwrap()

                                                    if (response && response.success) {
                                                        formik.setFieldError('storageLocation', '')
                                                        setIsVerified(prev => ({ ...prev, storageLocation: true }))

                                                        setFocusTarget('scanBin')
                                                    } else {
                                                        const errorMessage = response?.message || 'Invalid location'
                                                        formik.setFieldError('storageLocation', errorMessage)
                                                        formik.setFieldValue('storageLocation', '')
                                                        dispatch(
                                                            openSnackbar({
                                                                open: true,
                                                                message: errorMessage,
                                                                variant: 'alert',
                                                                alert: { color: 'error', icon: 'error' },
                                                                anchorOrigin: { vertical: 'top', horizontal: 'right' },
                                                                autoHideDuration: 3000
                                                            })
                                                        )
                                                    }
                                                } catch (error) {
                                                    const backendErrorMessage =
                                                        error.data?.message || error.message || 'Scan failed'
                                                    formik.setFieldError('storageLocation', backendErrorMessage)
                                                    formik.setFieldValue('storageLocation', '')

                                                    dispatch(
                                                        openSnackbar({
                                                            open: true,
                                                            message: backendErrorMessage,
                                                            variant: 'alert',
                                                            alert: { color: 'error', icon: 'error' },
                                                            anchorOrigin: {
                                                                vertical: 'top',
                                                                horizontal: 'right'
                                                            }
                                                        })
                                                    )
                                                }
                                            }
                                        },
                                        onChange: e => {
                                            formik.setFieldValue('storageLocation', e.target.value)
                                            // TODO:Add this when location code is updated
                                            setFormValues(prev => ({ ...prev, storageLocation: e.target.value }))
                                        },
                                        endAdornment: (
                                            <InputAdornment position='end'>
                                                {validateAddressLKey ? (
                                                    <CircularProgress color='inherit' size={20} />
                                                ) : (
                                                    <QrCodeScanner />
                                                )}
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            '&.Mui-focused .MuiInputAdornment-root svg': {
                                                color: 'primary.main' // Change color when focused
                                            }
                                        }
                                    }}
                                    customSx={getCustomSx(isVerified?.storageLocation)}
                                    autoComplete='off'
                                    disabled={isVerified?.storageLocation}
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
                                        onKeyPress: async e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()

                                                if (!e.target.value.trim()) return

                                                try {
                                                    const response = await dispatch(
                                                        validateToBin.initiate(
                                                            `?address=${encodeURIComponent(formik.values.storageLocation)}&to_bin=${encodeURIComponent(e.target.value)}`
                                                        )
                                                    ).unwrap()

                                                    if (response && response.success) {
                                                        formik.setFieldError('scanBin', '')
                                                        setIsVerified(prev => ({ ...prev, scanBin: true }))

                                                        setFocusTarget('itemId')
                                                    } else {
                                                        const errorMessage = response?.message || 'Invalid Bin Id'
                                                        formik.setFieldError('scanBin', errorMessage)
                                                        formik.setFieldValue('scanBin', '')

                                                        dispatch(
                                                            openSnackbar({
                                                                open: true,
                                                                message: errorMessage,
                                                                variant: 'alert',
                                                                alert: { color: 'error', icon: 'error' },
                                                                anchorOrigin: { vertical: 'top', horizontal: 'right' },
                                                                autoHideDuration: 3000
                                                            })
                                                        )
                                                    }
                                                } catch (error) {
                                                    const backendErrorMessage =
                                                        error.data?.message || error.message || 'Scan failed'
                                                    formik.setFieldError('scanBin', backendErrorMessage)
                                                    formik.setFieldValue('scanBin', '')

                                                    dispatch(
                                                        openSnackbar({
                                                            open: true,
                                                            message: backendErrorMessage,
                                                            variant: 'alert',
                                                            alert: { color: 'error', icon: 'error' },
                                                            anchorOrigin: {
                                                                vertical: 'top',
                                                                horizontal: 'right'
                                                            }
                                                        })
                                                    )
                                                }
                                            }
                                        },
                                        onChange: e => {
                                            formik.setFieldValue('scanBin', e.target.value)
                                        },
                                        endAdornment: (
                                            <InputAdornment position='end'>
                                                {validateToBinLKey ? (
                                                    <CircularProgress color='inherit' size={20} />
                                                ) : (
                                                    <QrCodeScanner />
                                                )}
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            '&.Mui-focused .MuiInputAdornment-root svg': {
                                                color: 'primary.main' // Change color when focused
                                            }
                                        }
                                    }}
                                    customSx={getCustomSx(isVerified?.scanBin)}
                                    autoComplete='off'
                                    disabled={!formik?.values?.storageLocation.trim() || isVerified?.scanBin}
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
                                        onFocus: () => handleFocusScroll(itemInputRef),
                                        onKeyPress: async e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()

                                                if (!e.target.value.trim()) return

                                                try {
                                                    const payload = {
                                                        from_bin: pendingPutAwayData?.[0]?.bin_no,
                                                        grn_id: pendingPutAwayData?.[0]?.grn_id,
                                                        grn_no: pendingPutAwayData?.[0]?.grn_no,
                                                        address: formik.values.storageLocation,
                                                        to_bin: formik.values.scanBin,
                                                        uid: e.target.value,
                                                        putaway_type: 'piece'
                                                    }

                                                    const response = await scanItem(payload).unwrap()

                                                    if (response && response.success) {
                                                        const responseMessage = response.message
                                                        dispatch(
                                                            openSnackbar({
                                                                open: true,
                                                                message: responseMessage,
                                                                variant: 'alert',
                                                                alert: { color: 'success', icon: 'success' },
                                                                anchorOrigin: {
                                                                    vertical: 'top',
                                                                    horizontal: 'right'
                                                                }
                                                            })
                                                        )

                                                        dispatch(removeItemFromPendingPutAwayData(e.target.value))

                                                        formik.setFieldValue('itemId', '')

                                                        setIsVerified(prev => ({
                                                            ...prev,
                                                            scanBin: true
                                                        }))

                                                        setFocusTarget('itemId')
                                                    } else {
                                                        const errorMessage = response?.message || 'Scan failed'
                                                        formik.setFieldError('itemId', errorMessage)
                                                        formik.setFieldValue('itemId', '')

                                                        dispatch(
                                                            openSnackbar({
                                                                open: true,
                                                                message: errorMessage,
                                                                variant: 'alert',
                                                                alert: { color: 'error', icon: 'error' },
                                                                anchorOrigin: { vertical: 'top', horizontal: 'right' },
                                                                autoHideDuration: 3000
                                                            })
                                                        )
                                                    }
                                                } catch (error) {
                                                    const backendErrorMessage =
                                                        error.data?.message || error.message || 'Scan failed'
                                                    formik.setFieldValue('itemId', '')

                                                    dispatch(
                                                        openSnackbar({
                                                            open: true,
                                                            message: backendErrorMessage,
                                                            variant: 'alert',
                                                            alert: { color: 'error', icon: 'error' },
                                                            anchorOrigin: { vertical: 'top', horizontal: 'right' },
                                                            autoHideDuration: 3000
                                                        })
                                                    )
                                                }
                                            }
                                        },
                                        onChange: e => {
                                            formik.setFieldValue('itemId', e.target.value)
                                        },
                                        endAdornment: (
                                            <InputAdornment position='end'>
                                                {scanItemLKey ? (
                                                    <CircularProgress color='inherit' size={20} />
                                                ) : (
                                                    <QrCodeScanner
                                                        sx={{
                                                            color: focusTarget === 'itemId' ? 'primary.main' : 'unset'
                                                        }}
                                                    />
                                                )}
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            '&.Mui-focused .MuiInputAdornment-root svg': {
                                                color: 'primary.main' // Change color when focused
                                            }
                                        }
                                    }}
                                    autoComplete='off'
                                    disabled={!formik?.values?.scanBin?.trim() || isVerified?.itemId}
                                    customSx={getCustomSx(isVerified.itemId)}
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
                                        if (techniques === 'Suggested' || techniques === 'Directed') {
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
                                    Switch Location
                                </CustomButton>
                                {/* <CustomButton
                                    type='submit'
                                    variant='contained'
                                    color='primary'
                                    disabled={!isVerified.itemId}
                                >
                                    Submit
                                </CustomButton> */}
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
