/* eslint-disable */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react'
import { Grid, Dialog, Box, InputAdornment, IconButton, Divider, useMediaQuery, Typography, CircularProgress } from '@mui/material'
import { Formik, Form } from 'formik'
import QrCodeScanner from '@mui/icons-material/QrCodeScanner'
import QrBarcodeScanner from 'react-qr-barcode-scanner'
import CustomButton from './extended/CustomButton'
import CustomFormInput from './extended/CustomFormInput'
import { getScannableInputSx } from '@/utilities'

const customSx = getScannableInputSx()
const getVerifiedCustomSx = isVerifiedValue =>
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

function ScannableInputForm({
    fields,
    initialValues,
    validationSchema,
    handleSubmit,
    showSubmitButton = true,
    submitButtonText = 'Submit',
    submitButtonStyle = {},
    gridProps = { container: true, spacing: 2 },
    scannerEnabled = false,
    sx = {},
    showDivider = false,
    footerMessage = null,
    loading = false
}) {
    const [scannerVisible, setScannerVisible] = useState(false)
    const [currentScanField, setCurrentScanField] = useState('')
    const isMobile = useMediaQuery('(max-width:600px)')

    // Zod validation handler for Formik
    const validate = values => {
        const result = validationSchema.safeParse(values)
        return result.success
            ? {}
            : result.error.issues.reduce((acc, issue) => {
                  acc[issue.path[0]] = issue.message
                  return acc
              }, {})
    }

    const handleScannerUpdate = (err, result, formik) => {
        if (result && formik) {
            formik.setFieldValue(currentScanField, result.text)
            setScannerVisible(false)

            // Submit after short delay to ensure state updates
            setTimeout(() => {
                formik.submitForm()
            }, 500)
        }
        if (err) {
            console.error('Scanner error:', err)
        }
    }

    return (
        <Grid {...gridProps} sx={{ ...sx }}>
            <Formik
                initialValues={initialValues}
                validate={validate}
                onSubmit={handleSubmit}
                validateOnBlur={false}
                validateOnChange
                enableReinitialize
            >
                {formik => (
                    <Form style={{ width: '100%', padding: 1 }}>
                        {fields?.map((field, index) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <Grid
                                item
                                xs={12}
                                // eslint-disable-next-line react/no-array-index-key
                                key={index}
                                sx={{
                                    mb: !showSubmitButton ? 1.5 : 0
                                }}
                            >
                                <CustomFormInput
                                    name={field.name}
                                    label={field.label}
                                    placeholder={field.placeholder}
                                    formik={formik}
                                    inputProps={{
                                        inputRef: field?.ref,
                                        value: formik.values[field.name] || field?.value || undefined,
                                        sx: {
                                            '&.Mui-focused .MuiInputAdornment-root svg': { color: 'primary.main' } // this changes QR code adornment focused
                                        },
                                        onChange: e => formik.setFieldValue(field.name, e.target.value),
                                        onKeyPress: e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                // eslint-disable-next-line no-unsafe-optional-chaining
                                                if (index === fields?.length - 1) {
                                                    formik.setFieldTouched(field.name, true)
                                                    formik.validateForm().then(() => {
                                                        if (Object.keys(formik.errors).length === 0) {
                                                            formik.handleSubmit()
                                                        }
                                                    })
                                                } else {
                                                    const fieldName = field.name
                                                    // first mark the field as touched so Formik will include it in validation
                                                    formik.setFieldTouched(fieldName, true)
                                                    formik.setFieldValue(fieldName, formik?.values[fieldName], true)

                                                    // run validation for only this one field
                                                    formik.validateField(fieldName).then(() => {
                                                        // now check whether that single-field validation produced an error
                                                        if (!formik.errors[fieldName]) {
                                                            field?.onKeyPress?.(e, formik)
                                                        }
                                                    })
                                                }
                                            }
                                        },
                                        endAdornment: (
                                            <InputAdornment position='end'
                                         
                                            >
                                                {(field.loading) && (<CircularProgress color='success' size={20} />) }
                                                <IconButton
                                                    onClick={() => {
                                                        if (isMobile && scannerEnabled) {
                                                            setCurrentScanField(field.name)
                                                            setScannerVisible(true)
                                                        }
                                                    }}
                                                    sx={!isMobile ? { cursor: 'default' } : {}}
                                                    disableFocusRipple={!isMobile}
                                                    disableRipple={!isMobile}
                                                    disabled={
                                                        typeof field?.isDisabled === 'function'
                                                            ? field.isDisabled(formik)
                                                            : field?.isDisabled
                                                    }
                                                >
                                                    <QrCodeScanner />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                        onBlur: () => {
                                            formik?.setFieldError(field.name, undefined)
                                        }
                                    }}
                                    autoComplete='off'
                                    sx={field.sx}
                                    outerLabelSx={{ fontSize: '1rem', ...field.outerLabelSx }}
                                    animateGlow={field?.animateGlow}
                                    customSx={{
                                        ...customSx,
                                        ...getVerifiedCustomSx(field?.isVerified),
                                        ...field.customSx
                                    }}
                                    disabled={
                                        typeof field?.isDisabled === 'function'
                                            ? field.isDisabled(formik)
                                            : field?.isDisabled
                                    }
                                />
                            </Grid>
                        ))}

                        {scannerEnabled && (
                            <Dialog
                                open={scannerVisible}
                                onClose={() => setScannerVisible(false)}
                                fullWidth
                                maxWidth='sm'
                            >
                                <Box sx={{ p: 2 }}>
                                    <QrBarcodeScanner
                                        onUpdate={(err, result) => handleScannerUpdate(err, result, formik)}
                                    />
                                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                                        <CustomButton
                                            onClick={() => setScannerVisible(false)}
                                            variant='clickable'
                                            customStyles={{ mt: 1 }}
                                        >
                                            Close Scanner
                                        </CustomButton>
                                    </Box>
                                </Box>
                            </Dialog>
                        )}

                        {showSubmitButton && (
                            <Grid item xs={12}>
                                {showDivider && (
                                    <Divider sx={{ borderColor: 'primary.main', marginTop: 1, marginBottom: 0.5 }} />
                                )}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: footerMessage ? 'space-between' : 'flex-end',
                                        mt: !showDivider ? 1 : 0,
                                        alignItems: 'center'
                                    }}
                                >
                                    {footerMessage && <Typography variant='caption'>{footerMessage}</Typography>}
                                    <CustomButton
                                        variant='clickable'
                                        color='primary'
                                        type='submit'
                                        loading={loading}
                                        customStyles={submitButtonStyle}
                                        disabled={formik.isSubmitting || loading}
                                    >
                                        {submitButtonText}
                                    </CustomButton>
                                </Box>
                            </Grid>
                        )}
                    </Form>
                )}
            </Formik>
        </Grid>
    )
}

export default ScannableInputForm
