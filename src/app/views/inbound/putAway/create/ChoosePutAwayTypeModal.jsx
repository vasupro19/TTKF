/* eslint-disable react/prop-types */
import GlobalModal from '@/core/components/modals/GlobalModal'
import React, { useEffect, useMemo } from 'react'
import { Box, Checkbox, Chip, CircularProgress, Divider, Grid, InputAdornment, Paper, Typography } from '@mui/material'
import { Formik, Form } from 'formik'
import CustomButton from '@/core/components/extended/CustomButton'
import { RightArrowAnimIcon } from '@/assets/icons/RightArrowAnimIcon'
import { z } from 'zod'
import CustomFormInput from '@/core/components/extended/CustomFormInput'
import { QrCodeScanner } from '@mui/icons-material'
import CustomTabsGroupedBtns from '@/core/components/extended/CustomTabsGroupedBtns'
import { useDispatch, useSelector } from 'react-redux'
import { validateFormBin, pendingPutAwayItems } from '@/app/store/slices/api/putAwaySlice'
import { setPendingPutAwayData } from '@/app/store/slices/putAway'
import { openSnackbar } from '@/app/store/slices/snackbar'

export default function ChoosePutAwayTypeModal({
    isModalOpen,
    setIsModalOpen,
    setGRNBinId,
    grnInputRef,
    handleTabChange,
    mode,
    techniques,
    scanMultiple,
    setScanMultiple,
    selectedOptions,
    setSelectedOptions
}) {
    const dispatch = useDispatch()
    const [putAwayType, setPutAwayType] = React.useState(0)
    const { validateFormBinLKey, pendingPutAwayItemsLKey } = useSelector(state => state.loading)

    const initialValues = { grnBin: '' }

    // Factory function for the validation schema
    const getValidationSchema = flag =>
        z.object({ grnBin: z.string() }).superRefine((data, ctx) => {
            if (!flag && data.grnBin.trim() === '') {
                ctx.addIssue({
                    code: 'custom',
                    message: 'GRN Bin is required',
                    path: ['grnBin']
                })
            }
        })

    // Update the validation function
    const validate = values => {
        const schema = getValidationSchema(scanMultiple)
        const result = schema.safeParse(values)
        let errors = {}

        if (!result.success) {
            errors = result.error.issues.reduce((acc, issue) => {
                acc[issue.path[0]] = issue.message
                return acc
            }, {})
        }

        // Only show error if we're trying to submit with empty selectedOptions
        // eslint-disable-next-line react/prop-types
        if (scanMultiple && !values.grnBin && selectedOptions.length === 0) {
            errors.grnBin = 'At least scan one GRN Bin'
        }

        return errors
    }
    // When the modal opens, reset scan state and focus the input
    useEffect(() => {
        if (isModalOpen) {
            setScanMultiple(false)
            setSelectedOptions([])
            setTimeout(() => {
                // eslint-disable-next-line react/prop-types
                if (grnInputRef.current) {
                    // eslint-disable-next-line react/prop-types
                    grnInputRef.current.focus()
                }
            }, 100)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isModalOpen])

    // Submission handler decides based on scanMultiple flag
    const handleSubmit = async (values, { resetForm, setFieldError }) => {
        // eslint-disable-next-line react/prop-types
        if (scanMultiple && selectedOptions.length === 0) return

        if (scanMultiple) {
            setGRNBinId(selectedOptions)
        } else {
            try {
                const response = await dispatch(
                    pendingPutAwayItems.initiate(`?from_bin=${encodeURIComponent(values.grnBin)}`)
                ).unwrap()
                if (response.success) {
                    dispatch(setPendingPutAwayData(response.data))
                    setGRNBinId(response.data.code)
                    setIsModalOpen(false)
                } else {
                    setFieldError('grnBin', response.message)
                }
            } catch (error) {
                const backendErrorMessage = error.data?.message || error.message || 'Scan failed'

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
        resetForm()
        setSelectedOptions([])
    }

    // Handler for switching between put away types; resets related states
    const handleTypeChange = newType => {
        if (newType !== null) {
            handleTabChange(newType)
            setPutAwayType(newType)
            setScanMultiple(false)
            setSelectedOptions([])
            setGRNBinId('')
        }
    }

    // Derived condition: when to show the direct "Next" button flow
    const showDirectNextFlow = useMemo(
        () =>
            (mode === 'Freehand' && putAwayType === 1 && techniques !== 'Suggested' && techniques !== 'Directed') ||
            mode === 'Job',
        [mode, putAwayType, techniques]
    )

    return (
        <GlobalModal
            isOpen={isModalOpen}
            setIsOpen={setIsModalOpen}
            disableEscapeKeyDown
            BackdropProps={{ onClick: event => event.stopPropagation() }}
            closeOnBackdropClick={false}
        >
            <Box
                sx={{
                    border: '1px solid #ccc',
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
                    overflowX: 'hidden',
                    // eslint-disable-next-line react/prop-types
                    minWidth: selectedOptions.length > 0 ? { sm: '600px', xs: '340px' } : { sm: '450px', xs: '340px' }
                }}
            >
                <Typography variant='h4'>
                    Put Away Type
                    <Divider sx={{ borderColor: 'primary.main', marginTop: '4px' }} />
                </Typography>
                <Formik
                    initialValues={initialValues}
                    validate={validate}
                    onSubmit={handleSubmit}
                    validateOnBlur={false}
                    validateOnChange
                >
                    {({ resetForm, ...formik }) => (
                        <>
                            <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
                                <CustomTabsGroupedBtns
                                    labels={['Piece Put Away', 'Full Bin Put Away']}
                                    onChange={value => {
                                        handleTypeChange(value)
                                        resetForm()
                                    }}
                                    tabValue={putAwayType}
                                />
                            </Box>
                            {showDirectNextFlow ? (
                                <Box>
                                    <Typography
                                        sx={{
                                            color: 'grey.500',
                                            textAlign: 'center',
                                            padding: '10px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Click on &quot;Next&quot; button to proceed further-
                                    </Typography>
                                    <Divider sx={{ borderColor: 'primary.main', marginTop: 2, marginBottom: '4px' }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <CustomButton
                                            variant='contained'
                                            shouldAnimate
                                            endIcon={<RightArrowAnimIcon />}
                                            sx={{
                                                width: '100%',
                                                textTransform: 'none',
                                                backgroundColor: '#000',
                                                color: '#fff',
                                                '&:hover': { backgroundColor: '#333' }
                                            }}
                                            type='button'
                                            onClick={() => {
                                                setGRNBinId(null)
                                                setIsModalOpen(false)
                                            }}
                                        >
                                            Next
                                        </CustomButton>
                                    </Box>
                                </Box>
                            ) : (
                                <Form>
                                    <CustomFormInput
                                        name='grnBin'
                                        label='GRN Bin* (or scan GRN item Id)'
                                        placeholder='Scan GRN Bin'
                                        formik={formik}
                                        loading
                                        inputProps={{
                                            inputRef: grnInputRef,
                                            onKeyPress: e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    // Only add if there's a value
                                                    if (scanMultiple && e.target.value) {
                                                        if (!formik.errors.grnBin) {
                                                            // Check if valid
                                                            setSelectedOptions(prev => [...prev, formik.values.grnBin])
                                                            formik.setFieldValue('grnBin', '')
                                                        }
                                                    } else {
                                                        formik.validateForm().then(() => {
                                                            if (Object.keys(formik.errors).length === 0) {
                                                                formik.handleSubmit()
                                                            }
                                                        })
                                                    }
                                                }
                                            },
                                            onChange: e => {
                                                formik.setFieldValue('grnBin', e.target.value)
                                            },
                                            onBlur: async e => {
                                                const value = e.target.value.trim()
                                                if (!value) return
                                                try {
                                                    const response = await dispatch(
                                                        validateFormBin.initiate(
                                                            `?from_bin=${encodeURIComponent(value)}`
                                                        )
                                                    ).unwrap()
                                                    if (!response.success) {
                                                        formik.setFieldError(
                                                            'grnBin',
                                                            response.message || 'Invalid GRN Bin'
                                                        )
                                                    } else {
                                                        formik.setFieldError('grnBin', '')
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
                                            },
                                            endAdornment: (
                                                <InputAdornment position='end'>
                                                    {validateFormBinLKey ? (
                                                        <CircularProgress color='inherit' size={20} />
                                                    ) : (
                                                        <QrCodeScanner />
                                                    )}
                                                </InputAdornment>
                                            )
                                        }}
                                        autoComplete='off'
                                    />
                                    {(techniques === 'Suggested' || techniques === 'Directed') && putAwayType === 1 && (
                                        <Box
                                            sx={{
                                                mt: 0.2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                width: 'max-content'
                                            }}
                                            onClick={() => setScanMultiple(!scanMultiple)}
                                        >
                                            <Checkbox
                                                checked={scanMultiple}
                                                onChange={e => {
                                                    setScanMultiple(e.target.checked)
                                                    setSelectedOptions([])
                                                }}
                                                color='primary'
                                                size='small'
                                            />
                                            <Typography variant='body2' sx={{ color: 'grey.500', fontSize: '12px' }}>
                                                Scan multiple GRN bins
                                            </Typography>
                                        </Box>
                                    )}
                                    {scanMultiple && (
                                        <Grid item xs={12} mt={2}>
                                            <Paper
                                                variant='outlined'
                                                sx={{
                                                    padding: 1,
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    // eslint-disable-next-line react/prop-types
                                                    justifyContent: selectedOptions.length <= 0 ? 'center' : 'unset',
                                                    gap: 0.2,
                                                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                                                    borderRadius: '12px',
                                                    border: '1px solid',
                                                    borderColor: 'grey.borderLight',
                                                    maxHeight: '120px',
                                                    overflowY: 'auto',
                                                    overflowX: 'hidden'
                                                }}
                                            >
                                                {selectedOptions.length > 0 ? (
                                                    selectedOptions.map((option, index) => (
                                                        <Chip
                                                            // eslint-disable-next-line react/no-array-index-key
                                                            key={index}
                                                            color='primary'
                                                            label={option}
                                                            sx={{ m: 0.2 }}
                                                        />
                                                    ))
                                                ) : (
                                                    <Box sx={{ color: '#666', padding: '8px' }}>
                                                        Scanned GRN bin will show up here
                                                    </Box>
                                                )}
                                            </Paper>
                                        </Grid>
                                    )}
                                    <Divider sx={{ borderColor: 'primary.main', marginTop: 2, marginBottom: '4px' }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <CustomButton
                                            variant='contained'
                                            shouldAnimate
                                            endIcon={<RightArrowAnimIcon />}
                                            sx={{
                                                width: '100%',
                                                textTransform: 'none',
                                                backgroundColor: '#000',
                                                color: '#fff',
                                                '&:hover': { backgroundColor: '#333' }
                                            }}
                                            loading={pendingPutAwayItemsLKey}
                                            type='submit'
                                        >
                                            Next
                                        </CustomButton>
                                    </Box>
                                </Form>
                            )}
                        </>
                    )}
                </Formik>
            </Box>
        </GlobalModal>
    )
}
