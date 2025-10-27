import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Formik, Form } from 'formik'
import { Grid, Box, InputAdornment, useMediaQuery, CircularProgress } from '@mui/material'
import CustomFormInput from '@/core/components/extended/CustomFormInput'
import { QrCodeScanner } from '@mui/icons-material'
import z from 'zod'
import CustomButton from '@/core/components/extended/CustomButton'
import { openSnackbar } from '@/app/store/slices/snackbar'
import { useDispatch, useSelector } from 'react-redux'
import { RefreshAnimIcon } from '@/assets/icons/RefreshAnimIcon'
import {
    pendingPutAwayItems,
    validateAddress,
    useScanItemMutation,
    useSubmitPutAwayMutation
} from '@/app/store/slices/api/putAwaySlice'

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

function FullBinPutAwayForm({
    // eslint-disable-next-line react/prop-types, no-unused-vars
    onSubmit,
    // eslint-disable-next-line react/prop-types
    GRNBinId,
    // eslint-disable-next-line react/prop-types
    setFormValues,
    // eslint-disable-next-line react/prop-types
    techniques,
    // eslint-disable-next-line react/prop-types
    mode,
    // eslint-disable-next-line react/prop-types
    scanMultiple,
    // eslint-disable-next-line react/prop-types
    handleChoosePutAwayModal
}) {
    const dispatch = useDispatch()
    const { validateAddressLKey, pendingPutAwayItemsLKey, scanItemLKey } = useSelector(state => state.loading)

    const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))

    // Determine overall modes for clarity
    const [locationType, setLocationType] = useState('bin') // 'bin' or 'pallet'
    const isPalletMode = locationType === 'pallet'

    // Focus control state
    const [focusTarget, setFocusTarget] = useState('storageLocation')
    const locationInputRef = useRef(null)
    const grnBinInputRef = useRef(null)
    const binInputRef = useRef(null)
    const palletInputRef = useRef(null)
    const location2InputRef = useRef(null)

    const [scanItem] = useScanItemMutation()
    // eslint-disable-next-line no-unused-vars
    const [submitPutAway] = useSubmitPutAwayMutation()

    // Verification state
    const [isVerified, setIsVerified] = useState({
        storageLocation: false,
        grnBin: false,
        palletCode: false,
        binId: false,
        locationCode2: false
    })
    // eslint-disable-next-line no-unused-vars
    const [scanItemResponse, setScanItemResponse] = useState(null)
    const [scanGrnBinResponse, setScanGrnBinResponse] = useState(null)

    const initialValues = {
        storageLocation: '',
        grnBin: '',
        palletCode: '',
        binId: '',
        storageLocation2: ''
    }

    // --- Define Condition Flags for Validation ---
    // Always require storageLocation
    const requireStorageLocation = true

    // In non-pallet mode, require GRN Bin when:
    // - scanning multiple AND techniques are Suggested or Directed AND mode is not Job
    const requireGrnBin =
        !isPalletMode &&
        (techniques === 'Manual' ||
            mode === 'Job' ||
            (mode === 'Freehand' && techniques !== 'Suggested' && techniques !== 'Directed'))

    /* Show Location code scan input again Freehand-manual Bin put away */
    const requiredStorageLoc2 = !isPalletMode && techniques === 'Manual' && mode === 'Freehand'

    // In pallet mode and for Freehand with non-Suggested/Directed, require GRN ID
    const requireGrnBinIdForPallet =
        isPalletMode &&
        (mode === 'Job' || (mode === 'Freehand' && (techniques === 'Suggested' || techniques === 'Directed')))

    // In pallet mode, require Pallet Code always
    const requirePalletCode = isPalletMode

    // In pallet mode and for Freehand with non-Suggested/Directed, require Bin ID
    const requireBinIdForPallet =
        isPalletMode && mode === 'Freehand' && techniques !== 'Suggested' && techniques !== 'Directed'

    // In Freehand mode with Suggested/Directed (if not already handled in pallet mode), require Bin ID
    const requireBinIdForFreehand =
        !isPalletMode &&
        mode === 'Freehand' &&
        techniques !== 'Manual' &&
        ((techniques !== 'Suggested' && techniques !== 'Directed') || scanMultiple)

    // --- Build Validation Schema Step-by-Step ---
    const validationSchema = useMemo(() => {
        const fields = {}
        if (requireStorageLocation) {
            fields.storageLocation = z.string().trim().min(1, 'Storage Location is required')
        }
        if (requireGrnBin || requireGrnBinIdForPallet) {
            fields.grnBin = z.string().trim().min(1, 'GRN Bin is required')
        }
        if (requiredStorageLoc2) {
            fields.storageLocation2 = z.string().trim().min(1, 'Location code is required')
        }
        if (requirePalletCode) {
            fields.palletCode = z.string().trim().min(1, 'Pallet Code is required')
        }
        if (requireBinIdForPallet || requireBinIdForFreehand) {
            fields.binId = z.string().trim().min(1, 'Bin ID is required')
        }
        let schema = z.object(fields)
        if (requiredStorageLoc2) {
            schema = schema.superRefine((values, ctx) => {
                if (values.storageLocation2 !== values.storageLocation) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Location codes must be the same',
                        path: ['storageLocation2']
                    })
                }
            })
        }
        return schema
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        requireStorageLocation,
        requireGrnBin,
        requirePalletCode,
        requireBinIdForPallet,
        requireBinIdForFreehand,
        requiredStorageLoc2
    ])

    // Generic validation using Zod
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

    // --- Focus and Scrolling Helpers ---
    const focusInput = target => {
        const refMap = {
            storageLocation: locationInputRef,
            grnBin: grnBinInputRef,
            palletCode: palletInputRef,
            binId: binInputRef,
            storageLocation2: location2InputRef
        }
        refMap[target]?.current?.focus()
    }

    useEffect(() => {
        if (focusTarget) {
            focusInput(focusTarget)
            setFocusTarget(null)
        }
    }, [focusTarget])

    useEffect(() => {
        locationInputRef.current?.focus()
    }, [GRNBinId, locationType])

    const handleFocusScroll = useCallback(
        inputRef => {
            if (isMobile && inputRef.current) {
                const rect = inputRef.current.getBoundingClientRect()
                const offset = 98
                window.scrollTo({
                    top: window.scrollY + rect.top - offset,
                    behavior: 'smooth'
                })
            }
        },
        [isMobile]
    )

    // --- Reset Handler ---
    const handleReset = formik => {
        formik.resetForm({ values: initialValues })
        setFormValues(prev => ({ ...prev, scanBin: '', storageLocation: '' }))
        setIsVerified({
            storageLocation: false,
            grnBin: false,
            palletCode: false,
            binId: false,
            locationCode2: false
        })

        formik.setValues(initialValues)
        formik.setTouched({})
        formik.setErrors({})

        setLocationType('bin')

        if (!scanMultiple && mode === 'Freehand' && (techniques === 'Suggested' || techniques === 'Directed')) {
            handleChoosePutAwayModal(true, 1)
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Scan GRN bin!',
                    variant: 'alert',
                    alert: { color: 'info', icon: 'info' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' },
                    autoHideDuration: 3000
                })
            )
        } else {
            setFocusTarget('storageLocation')
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
        }
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // --- Determine Which Field to Clear After Submit ---
    // eslint-disable-next-line no-unused-vars
    const getClearInputField = () => {
        if (mode === 'Job' || (isPalletMode && (techniques === 'Suggested' || techniques === 'Directed'))) {
            return 'grnBin'
        }
        if (isPalletMode) {
            return 'binId'
        }
        return ''
    }

    // --- onSubmit Handler ---
    // const handleSubmit = async (values, actions) => {
    //     const clearInput = getClearInputField()

    //     try {
    //         if (!scanItemResponse?.data?.putawayDetail?.id) {
    //             throw new Error('Please confirm the storage location first.')
    //         }
    //         const response = await submitPutAway({ id: scanItemResponse.data.putawayDetail.id }).unwrap()

    //         if (response && response.success) {
    //             dispatch(
    //                 openSnackbar({
    //                     open: true,
    //                     message: 'Put away submitted successfully!',
    //                     variant: 'alert',
    //                     alert: { color: 'success', icon: 'success' },
    //                     anchorOrigin: { vertical: 'top', horizontal: 'right' },
    //                     autoHideDuration: 3000
    //                 })
    //             )

    //             onSubmit(values, actions, locationType, clearInput)

    //             actions.setFieldValue('grnBin', '')
    //             actions.setFieldValue('palletCode', '')
    //             actions.setFieldValue('binId', '')
    //             actions.setFieldValue('locationCode2', '')

    //             if (!isPalletMode) {
    //                 setIsVerified({
    //                     storageLocation: false,
    //                     grnBin: false,
    //                     palletCode: false,
    //                     binId: false,
    //                     locationCode2: false
    //                 })
    //             }

    //             setFocusTarget('grnBin')
    //         } else {
    //             const errorMessage = response?.message || 'Submission failed'
    //             dispatch(
    //                 openSnackbar({
    //                     open: true,
    //                     message: errorMessage,
    //                     variant: 'alert',
    //                     alert: { color: 'error', icon: 'error' },
    //                     anchorOrigin: { vertical: 'top', horizontal: 'right' },
    //                     autoHideDuration: 3000
    //                 })
    //             )
    //         }
    //     } catch (error) {
    //         const errorMessage = error.data?.message || error.message || 'Submission failed'
    //         dispatch(
    //             openSnackbar({
    //                 open: true,
    //                 message: errorMessage,
    //                 variant: 'alert',
    //                 alert: { color: 'error', icon: 'error' },
    //                 anchorOrigin: { vertical: 'top', horizontal: 'right' },
    //                 autoHideDuration: 3000
    //             })
    //         )
    //     } finally {
    //         actions.setSubmitting(false)
    //     }
    // }

    // --- Render JSX ---
    return (
        <Box sx={{ padding: 0.5, width: { xs: '100%', sm: mode === 'Job' ? '100%' : '40%' }, marginX: 'auto' }}>
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
                            {/* Storage Location Input */}
                            <Grid item xs={12} sm={mode === 'Freehand' ? 12 : 6}>
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

                                                    formik.setFieldError('storageLocation', '')

                                                    if (response && response.success) {
                                                        const isPalletLocation =
                                                            response.data?.isPalletLocation || false
                                                        setLocationType(isPalletLocation ? 'pallet' : 'bin')

                                                        setIsVerified(prev => ({ ...prev, storageLocation: true }))

                                                        if (isPalletLocation) {
                                                            setFocusTarget('palletCode')
                                                        } else if (
                                                            scanMultiple &&
                                                            (techniques === 'Suggested' || techniques === 'Directed')
                                                        ) {
                                                            setFocusTarget('binId')
                                                        } else {
                                                            setFocusTarget('grnBin')
                                                        }

                                                        if (
                                                            !scanMultiple &&
                                                            (techniques === 'Suggested' || techniques === 'Directed') &&
                                                            mode !== 'Job'
                                                        ) {
                                                            formik.handleSubmit()
                                                            handleChoosePutAwayModal(true, 1)
                                                        }
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
                                                } finally {
                                                    // eslint-disable-next-line no-console
                                                    console.log()
                                                }
                                            }
                                        },

                                        onChange: e => {
                                            formik.setFieldValue('storageLocation', e.target.value)
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
                                            '&.Mui-focused .MuiInputAdornment-root svg': { color: 'primary.main' }
                                        }
                                    }}
                                    customSx={getCustomSx(isVerified.storageLocation)}
                                    autoComplete='off'
                                    disabled={isVerified?.storageLocation}
                                />
                            </Grid>

                            {/* GRN Bin Input (only when NOT in pallet mode) */}
                            {!isPalletMode &&
                                (((techniques === 'Suggested' || techniques === 'Directed') && mode !== 'Freehand') ||
                                    techniques === 'Manual') && (
                                    <Grid item xs={12} sm={mode === 'Freehand' ? 12 : 6}>
                                        <CustomFormInput
                                            name='grnBin'
                                            label='Scan GRN Bin*'
                                            placeholder='Scan GRN Bin'
                                            formik={formik}
                                            inputProps={{
                                                inputRef: grnBinInputRef,
                                                onFocus: () => {
                                                    if (mode === 'Job' && techniques === 'Manual') {
                                                        return
                                                    }
                                                    handleFocusScroll(grnBinInputRef)
                                                },
                                                onKeyPress: async e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        if (!e.target.value.trim()) return

                                                        try {
                                                            const response = await dispatch(
                                                                pendingPutAwayItems.initiate(
                                                                    `?from_bin=${encodeURIComponent(e.target.value)}`
                                                                )
                                                            ).unwrap()

                                                            if (response && response.success) {
                                                                setScanGrnBinResponse(response)
                                                                // formik.setFieldValue('grnBinData', response.data[0])
                                                                formik.setFieldError('grnBin', '')
                                                                setIsVerified(prev => ({ ...prev, grnBin: true }))

                                                                if (requiredStorageLoc2) {
                                                                    setFocusTarget('storageLocation2')
                                                                    formik.setTouched({ storageLocation2: true })
                                                                } else {
                                                                    formik.setTouched({ grnBin: true })
                                                                    const errors = await formik.validateForm()
                                                                    if (Object.keys(errors).length === 0) {
                                                                        formik.handleSubmit()
                                                                        setFormValues(prev => ({
                                                                            ...prev,
                                                                            storageLocation: ''
                                                                        }))
                                                                        setIsVerified({
                                                                            storageLocation: false,
                                                                            grnBin: false,
                                                                            palletCode: false,
                                                                            binId: false,
                                                                            locationCode2: false
                                                                        })
                                                                        setFocusTarget('storageLocation')
                                                                    }
                                                                }
                                                            } else {
                                                                const errorMessage =
                                                                    response?.message || 'Invalid Bin or UID Scanned'
                                                                formik.setFieldError('grnBin', errorMessage)
                                                                formik.setFieldValue('grnBin', '')
                                                                dispatch(
                                                                    openSnackbar({
                                                                        open: true,
                                                                        message: errorMessage,
                                                                        variant: 'alert',
                                                                        alert: { color: 'error', icon: 'error' },
                                                                        anchorOrigin: {
                                                                            vertical: 'top',
                                                                            horizontal: 'right'
                                                                        },
                                                                        autoHideDuration: 3000
                                                                    })
                                                                )
                                                            }
                                                        } catch (error) {
                                                            const backendErrorMessage =
                                                                error.data?.message || error.message || 'Scan failed'
                                                            formik.setFieldValue('grnBin', '')

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
                                                onChange: e => formik.setFieldValue('grnBin', e.target.value),
                                                endAdornment: (
                                                    <InputAdornment position='end'>
                                                        {pendingPutAwayItemsLKey ? (
                                                            <CircularProgress color='inherit' size={20} />
                                                        ) : (
                                                            <QrCodeScanner />
                                                        )}
                                                    </InputAdornment>
                                                ),
                                                sx: {
                                                    '&.Mui-focused .MuiInputAdornment-root svg': {
                                                        color: 'primary.main'
                                                    }
                                                }
                                            }}
                                            customSx={getCustomSx(isVerified.grnBin && requiredStorageLoc2)}
                                            autoComplete='off'
                                            disabled={!isVerified?.storageLocation || isVerified?.grnBin}
                                        />
                                    </Grid>
                                )}

                            {/* Show Location code scan input again Freehand-manual Bin put away */}
                            {requiredStorageLoc2 && (
                                <Grid item xs={12} sm={mode === 'Freehand' ? 12 : 6}>
                                    <CustomFormInput
                                        name='storageLocation2'
                                        label='Confirm Storage Location*'
                                        placeholder='Scan Storage Location again'
                                        formik={formik}
                                        inputProps={{
                                            inputRef: location2InputRef,
                                            onKeyPress: async e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()

                                                    if (
                                                        formik.values.storageLocation2 === formik.values.storageLocation
                                                    ) {
                                                        formik.setFieldError('storageLocation2', '')

                                                        try {
                                                            const payload = {
                                                                address: formik.values.storageLocation,
                                                                from_bin: scanGrnBinResponse?.data?.[0]?.bin_no,
                                                                bin_id: scanGrnBinResponse?.data?.[0]?.bin_id,
                                                                // uid: formik.values.grnBin,
                                                                uid: scanGrnBinResponse?.data?.[0]?.uid,
                                                                grn_id: scanGrnBinResponse?.data?.[0]?.grn_id,
                                                                grn_no: scanGrnBinResponse?.data?.[0]?.grn_no,
                                                                quantity: scanGrnBinResponse?.data?.[0]?.quantity || 1,
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
                                                                        },
                                                                        autoHideDuration: 3000
                                                                    })
                                                                )

                                                                formik.setFieldValue('grnBin', '')
                                                                formik.setFieldValue('storageLocation2', '')

                                                                setIsVerified(prev => ({
                                                                    ...prev,
                                                                    grnBin: false
                                                                }))

                                                                setFocusTarget('grnBin')
                                                            } else {
                                                                const errorMessage = response?.message || 'Scan failed'
                                                                formik.setFieldError('storageLocation2', errorMessage)
                                                                formik.setFieldValue('storageLocation2', '')

                                                                dispatch(
                                                                    openSnackbar({
                                                                        open: true,
                                                                        message: errorMessage,
                                                                        variant: 'alert',
                                                                        alert: { color: 'error', icon: 'error' },
                                                                        anchorOrigin: {
                                                                            vertical: 'top',
                                                                            horizontal: 'right'
                                                                        },
                                                                        autoHideDuration: 3000
                                                                    })
                                                                )
                                                            }
                                                        } catch (error) {
                                                            const backendErrorMessage =
                                                                error.data?.message || error.message || 'Scan failed'
                                                            formik.setFieldValue('storageLocation2', '')

                                                            dispatch(
                                                                openSnackbar({
                                                                    open: true,
                                                                    message: backendErrorMessage,
                                                                    variant: 'alert',
                                                                    alert: { color: 'error', icon: 'error' },
                                                                    anchorOrigin: {
                                                                        vertical: 'top',
                                                                        horizontal: 'right'
                                                                    },
                                                                    autoHideDuration: 3000
                                                                })
                                                            )
                                                        }
                                                    } else {
                                                        formik.setFieldError(
                                                            'storageLocation2',
                                                            'Location codes must be the same'
                                                        )
                                                        formik.setFieldValue('storageLocation2', '')
                                                    }
                                                }
                                            },
                                            onChange: e => formik.setFieldValue('storageLocation2', e.target.value),
                                            endAdornment: (
                                                <InputAdornment position='end'>
                                                    {scanItemLKey ? (
                                                        <CircularProgress color='inherit' size={20} />
                                                    ) : (
                                                        <QrCodeScanner />
                                                    )}
                                                </InputAdornment>
                                            ),
                                            sx: {
                                                '&.Mui-focused .MuiInputAdornment-root svg': {
                                                    color: 'primary.main'
                                                }
                                            }
                                        }}
                                        customSx={getCustomSx(isVerified.locationCode2)}
                                        autoComplete='off'
                                        disabled={!isVerified?.grnBin || isVerified?.locationCode2}
                                    />
                                </Grid>
                            )}

                            {/* Bin ID Input when scanning multiple in non-pallet mode */}
                            {!isPalletMode &&
                                scanMultiple &&
                                (techniques === 'Suggested' || techniques === 'Directed') && (
                                    <Grid item xs={12} sm={mode === 'Freehand' ? 12 : 6}>
                                        <CustomFormInput
                                            name='binId'
                                            label='Scan Bin ID*'
                                            placeholder='Scan Bin ID'
                                            formik={formik}
                                            inputProps={{
                                                inputRef: binInputRef,
                                                onKeyPress: async e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        formik?.setTouched({ binId: true })
                                                        const errors = await formik.validateForm()
                                                        if (Object.keys(errors).length === 0) {
                                                            formik.handleSubmit()
                                                            setFormValues(prev => ({ ...prev, storageLocation: '' }))
                                                            setIsVerified({
                                                                storageLocation: false,
                                                                grnBin: false,
                                                                palletCode: false,
                                                                binId: false,
                                                                locationCode2: false
                                                            })
                                                            setFocusTarget('storageLocation')
                                                        }
                                                    }
                                                },
                                                onChange: e => formik.setFieldValue('binId', e.target.value),
                                                endAdornment: (
                                                    <InputAdornment position='end'>
                                                        <QrCodeScanner />
                                                    </InputAdornment>
                                                ),
                                                sx: {
                                                    '&.Mui-focused .MuiInputAdornment-root svg': {
                                                        color: 'primary.main'
                                                    }
                                                }
                                            }}
                                            autoComplete='off'
                                            disabled={!formik?.values?.storageLocation.trim()}
                                        />
                                    </Grid>
                                )}

                            {/* Pallet Mode Inputs */}
                            {isPalletMode && (
                                <>
                                    <Grid item xs={12} sm={mode === 'Freehand' ? 12 : 6}>
                                        <CustomFormInput
                                            name='palletCode'
                                            label='Scan Pallet Code*'
                                            placeholder='Scan Pallet Code'
                                            formik={formik}
                                            inputProps={{
                                                inputRef: palletInputRef,
                                                onKeyPress: e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        if (
                                                            mode === 'Job' ||
                                                            (mode === 'Freehand' &&
                                                                (techniques === 'Suggested' ||
                                                                    techniques === 'Directed'))
                                                        ) {
                                                            setFocusTarget('grnBin')
                                                            formik?.setTouched({ grnBin: true })
                                                        } else {
                                                            setFocusTarget('binId')
                                                            formik?.setTouched({ binId: true })
                                                        }
                                                        if (e.target.value.trim()) {
                                                            setIsVerified(prev => ({ ...prev, palletCode: true }))
                                                        }
                                                    }
                                                },
                                                onChange: e => formik.setFieldValue('palletCode', e.target.value),
                                                endAdornment: (
                                                    <InputAdornment position='end'>
                                                        <QrCodeScanner />
                                                    </InputAdornment>
                                                ),
                                                sx: {
                                                    '&.Mui-focused .MuiInputAdornment-root svg': {
                                                        color: 'primary.main'
                                                    }
                                                }
                                            }}
                                            customSx={getCustomSx(isVerified.palletCode)}
                                            autoComplete='off'
                                            disabled={isVerified?.palletCode}
                                        />
                                    </Grid>
                                    {mode === 'Freehand' && techniques === 'Manual' ? (
                                        <Grid item xs={12} sm={mode === 'Freehand' ? 12 : 6}>
                                            <CustomFormInput
                                                name='binId'
                                                label='Scan Bin ID*'
                                                placeholder='Scan Bin ID'
                                                formik={formik}
                                                inputProps={{
                                                    inputRef: binInputRef,
                                                    onKeyPress: async e => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault()
                                                            formik?.setTouched({ binId: true })
                                                            const errors = await formik.validateForm()
                                                            if (Object.keys(errors).length === 0) {
                                                                formik.handleSubmit()
                                                            }
                                                        }
                                                    },
                                                    onChange: e => formik.setFieldValue('binId', e.target.value),
                                                    endAdornment: (
                                                        <InputAdornment position='end'>
                                                            <QrCodeScanner />
                                                        </InputAdornment>
                                                    ),
                                                    sx: {
                                                        '&.Mui-focused .MuiInputAdornment-root svg': {
                                                            color: 'primary.main'
                                                        }
                                                    }
                                                }}
                                                autoComplete='off'
                                                disabled={!formik?.values?.palletCode}
                                            />
                                        </Grid>
                                    ) : (
                                        <Grid item xs={12} sm={mode === 'Freehand' ? 12 : 6}>
                                            <CustomFormInput
                                                name='grnBin'
                                                label='Scan GRN Bin*'
                                                placeholder='Scan GRN Bin'
                                                formik={formik}
                                                inputProps={{
                                                    inputRef: grnBinInputRef,
                                                    onFocus: () => handleFocusScroll(grnBinInputRef),
                                                    onKeyPress: async e => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault()
                                                            formik?.setTouched({ grnBin: true })
                                                            const errors = await formik.validateForm()
                                                            if (Object.keys(errors).length === 0) {
                                                                formik.handleSubmit()
                                                            }
                                                        }
                                                    },
                                                    onChange: e => formik.setFieldValue('grnBin', e.target.value),
                                                    endAdornment: (
                                                        <InputAdornment position='end'>
                                                            <QrCodeScanner />
                                                        </InputAdornment>
                                                    ),
                                                    sx: {
                                                        '&.Mui-focused .MuiInputAdornment-root svg': {
                                                            color: 'primary.main'
                                                        }
                                                    }
                                                }}
                                                autoComplete='off'
                                                disabled={!formik?.values?.palletCode}
                                            />
                                        </Grid>
                                    )}
                                </>
                            )}

                            {/* Action Buttons */}
                            <Grid item xs={12} sx={{ textAlign: 'right' }}>
                                {/* {mode === 'Freehand' && (
                                    <Divider sx={{ borderColor: 'primary.main', marginTop: 2, marginBottom: '4px' }} />
                                )} */}
                                <CustomButton
                                    type='button'
                                    variant='outlined'
                                    color='primary'
                                    disabled={formik.isSubmitting}
                                    customStyles={{ marginRight: 1 }}
                                    shouldAnimate
                                    endIcon={<RefreshAnimIcon />}
                                    onClick={() => handleReset(formik)}
                                >
                                    {!scanMultiple &&
                                    mode === 'Freehand' &&
                                    (techniques === 'Suggested' || techniques === 'Directed')
                                        ? 'Scan GRN bins'
                                        : 'Switch location'}
                                </CustomButton>
                                {/* <CustomButton
                                    type='submit'
                                    variant='contained'
                                    color='primary'
                                    // disabled={!isVerified.locationCode2}
                                    disabled={requiredStorageLoc2 ? !isVerified.locationCode2 : formik.isSubmitting}
                                >
                                    Submit
                                </CustomButton> */}
                            </Grid>
                        </Grid>
                    </Form>
                )}
            </Formik>
        </Box>
    )
}

export default FullBinPutAwayForm
