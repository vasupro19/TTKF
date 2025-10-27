/* eslint-disable no-nested-ternary */
import React from 'react'
import { Box, FormControl, InputLabel, Typography } from '@mui/material'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

function CustomPhoneInput({ field, formik, handlePhoneChange, outsideLabel = false }) {
    const hasError = formik.touched[field.name] && formik.errors[field.name]

    const phoneInputStyles = {
        '& .react-tel-input': {
            '& .form-control': {
                width: '100%',
                height: '40px',
                fontSize: '14px',
                borderRadius: '8px',
                paddingLeft: '48px',
                border: field?.isDisabled
                    ? '1px solid rgba(0, 0, 0, 0.26)'
                    : hasError
                      ? '1px solid #f44336'
                      : '1px solid #697586',
                transition: 'border 0.05s ease-in-out',
                '&:hover': {
                    border: field?.isDisabled
                        ? '1px solid rgba(0, 0, 0, 0.26)'
                        : hasError
                          ? '1px solid #f44336'
                          : '1px solid #45484c !important'
                },
                '&:focus': {
                    border: field?.isDisabled
                        ? '1px solid rgba(0, 0, 0, 0.26)'
                        : hasError
                          ? '2px solid #f44336 !important'
                          : '2px solid #040404 !important',
                    outline: 'none'
                }
            },
            '& .flag-dropdown': {
                backgroundColor: '#f8fafc',
                borderTopLeftRadius: '8px',
                borderBottomLeftRadius: '8px',
                borderRight: 'none',
                border: field?.isDisabled
                    ? '1px solid rgba(0, 0, 0, 0.26)'
                    : hasError
                      ? '1px solid #f44336'
                      : '1px solid #697586',
                transition: 'border 0.05s ease-in-out',
                '&:hover': {
                    border: field?.isDisabled
                        ? '1px solid rgba(0, 0, 0, 0.26)'
                        : hasError
                          ? '1px solid #f44336'
                          : '1px solid #45484c !important'
                }
            },
            '.flag-dropdown.open': {
                zIndex: 1,
                background: '#fff',
                borderRadius: '8px 0 0 8px'
            },

            '&:hover .flag-dropdown': {
                border: field?.isDisabled
                    ? '1px solid rgba(0, 0, 0, 0.26)'
                    : hasError
                      ? '1px solid #f44336'
                      : '1px solid #45484c !important'
            },
            '&:focus-within .flag-dropdown': {
                border: field?.isDisabled
                    ? '1px solid rgba(0, 0, 0, 0.26)'
                    : hasError
                      ? '2px solid #f44336 !important'
                      : '2px solid #040404 !important'
            }
        },
        // Label color change on focus
        '&:focus-within .phone-input-label': {
            color: hasError ? '#f44336 !important' : '#040404 !important'
        }
    }

    return (
        <Box sx={phoneInputStyles}>
            <FormControl sx={{ width: '100%', position: 'relative' }}>
                {outsideLabel ? (
                    field?.label && (
                        <Typography variant='body1' sx={{ mb: 1 }}>
                            {field?.label}
                        </Typography>
                    )
                ) : (
                    <InputLabel
                        sx={{
                            position: 'absolute',
                            left: 12,
                            top: '-60%',
                            transition: 'all 0.05s ease-in-out',
                            fontSize: '0.675rem !important',
                            padding: '0 4px',
                            background: field?.isDisabled ? 'transparent' : '#fff',
                            color:
                                // eslint-disable-next-line no-nested-ternary
                                field?.isDisabled
                                    ? '#888 !important'
                                    : formik.touched[field.name] && Boolean(formik.errors[field.name])
                                      ? 'error.main'
                                      : '#697586 !important',
                            zIndex: field?.isDisabled ? 2 : 2,
                            ...(field?.isDisabled && {
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    left: -4,
                                    right: -4,
                                    top: '56%',
                                    transform: 'translateY(-50%)',
                                    height: '1px',
                                    backgroundColor: '#f5f5f5',
                                    zIndex: -1
                                }
                            })
                        }}
                        className='phone-input-label'
                    >
                        {field?.label}
                    </InputLabel>
                )}
                <PhoneInput
                    country='in'
                    value={formik.values[field.name]}
                    onChange={handlePhoneChange}
                    placeholder={field.placeholder || '+91 83374-92382'}
                    containerStyle={{
                        width: '100%',
                        borderRadius: '8px'
                    }}
                    disabled={field?.isDisabled}
                />
            </FormControl>
            {formik.touched[field.name] && formik.errors[field.name] && (
                <Typography
                    sx={{ marginLeft: 1.5, marginTop: '4px' }}
                    className='error-label'
                    color='error'
                    variant='caption'
                >
                    {formik.errors[field.name]}
                </Typography>
            )}
        </Box>
    )
}

export default CustomPhoneInput
