import React from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    TextField,
    Checkbox,
    FormControlLabel,
    Button,
    Typography,
    IconButton,
    InputAdornment,
    useMediaQuery,
    CircularProgress
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import CaptchaTextField from '@core/components/extended/Captcha'

export default function LoginForm({ formik, showPassword, handleClickShowPassword, captchaRef }) {
    const isMedium = useMediaQuery('(max-width: 1024px) and (max-height: 600px)')

    return (
        <Box component='form' onSubmit={formik.handleSubmit}>
            <TextField
                variant='standard'
                fullWidth
                label='Email'
                required
                id='email'
                name='email'
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position='start'>
                            <MailOutlineIcon sx={{ fontSize: '1.5rem' }} />
                        </InputAdornment>
                    ),
                    sx: {
                        fontSize: isMedium ? '1rem' : '1.25rem',
                        height: isMedium ? '3rem' : '3.5rem'
                    }
                }}
                InputLabelProps={{
                    shrink: !!formik.values.email,
                    sx: {
                        fontSize: isMedium ? '0.875rem' : '1rem',
                        marginLeft: '2rem',
                        marginTop: isMedium ? '0.4rem' : '0.6rem'
                    }
                }}
                sx={{
                    mb: 2,
                    '.MuiInputBase-root': {
                        fontSize: isMedium ? '0.875rem' : '1rem'
                    },
                    '.MuiInputAdornment-root': {
                        fontSize: isMedium ? '0.875rem' : '1rem'
                    }
                }}
            />

            <TextField
                variant='standard'
                fullWidth
                label='Password'
                required
                id='password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position='start'>
                            <LockOutlinedIcon sx={{ fontSize: '1.5rem' }} />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position='end'>
                            <IconButton onClick={handleClickShowPassword}>
                                {showPassword ? (
                                    <Visibility sx={{ fontSize: '1.5rem' }} />
                                ) : (
                                    <VisibilityOff sx={{ fontSize: '1.5rem' }} />
                                )}
                            </IconButton>
                        </InputAdornment>
                    ),
                    sx: {
                        fontSize: isMedium ? '1rem' : '1.25rem',
                        height: isMedium ? '3rem' : '3.5rem'
                    }
                }}
                InputLabelProps={{
                    shrink: !!formik.values.password,
                    sx: {
                        fontSize: isMedium ? '0.875rem' : '1rem',
                        marginLeft: '2rem',
                        marginTop: isMedium ? '0.4rem' : '0.5rem'
                    }
                }}
                sx={{
                    mb: 2,
                    '.MuiInputBase-root': {
                        fontSize: isMedium ? '0.875rem' : '1rem'
                    },
                    '.MuiInputAdornment-root': {
                        fontSize: isMedium ? '0.875rem' : '1rem'
                    }
                }}
            />

            {/* Pass the captchaRef to CaptchaTextField */}
            {/* <CaptchaTextField ref={captchaRef} /> */}

            <Box display='flex' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            name='rememberMe'
                            color='primary'
                            checked={formik.values.rememberMe}
                            onChange={formik.handleChange}
                        />
                    }
                    label='Remember me'
                    sx={{
                        marginRight: '1rem',
                        fontSize: isMedium ? '1rem' : '1.25rem'
                    }}
                />
                <Typography variant='body1'>
                    <a href='/forgot-password' style={{ textDecoration: 'none', color: '#1976D2' }}>
                        Forgot Password?
                    </a>
                </Typography>
            </Box>

            <Button
                fullWidth
                variant='contained'
                color='primary'
                type='submit'
                onClick={e => {
                    if (formik.isSubmitting) e.preventDefault()
                }}
                // disabled={formik.isSubmitting}
                sx={{
                    mb: 2,
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    background: 'linear-gradient(to right, #39B54A,#39B54A)',
                    fontWeight: 'bold',
                    fontSize: isMedium ? '1rem' : '1.25rem',
                    color: '#2c2c2c',
                    '&:hover': {
                        background: 'linear-gradient(to right, #39B54A, #39B54A)'
                    }
                }}
            >
                {formik.isSubmitting ? (
                    <>
                        {' '}
                        <svg width={0} height={0}>
                            <defs>
                                <linearGradient id='my_gradient' x1='0%' y1='0%' x2='0%' y2='100%'>
                                    <stop offset='0%' stopColor='#2c2c2c' />
                                    <stop offset='100%' stopColor='#234065' />
                                </linearGradient>
                            </defs>
                        </svg>
                        <CircularProgress sx={{ 'svg circle': { stroke: 'url(#my_gradient)' } }} size={30} />
                    </>
                ) : (
                    'Login'
                )}
            </Button>
        </Box>
    )
}

LoginForm.propTypes = {
    formik: PropTypes.shape({
        values: PropTypes.shape({
            email: PropTypes.string.isRequired,
            password: PropTypes.string.isRequired,
            rememberMe: PropTypes.bool
        }).isRequired,
        errors: PropTypes.shape({
            email: PropTypes.string,
            password: PropTypes.string
        }),
        touched: PropTypes.shape({
            email: PropTypes.bool,
            password: PropTypes.bool
        }),
        handleChange: PropTypes.func.isRequired,
        handleBlur: PropTypes.func.isRequired,
        handleSubmit: PropTypes.func.isRequired,
        isSubmitting: PropTypes.bool.isRequired
    }).isRequired,
    showPassword: PropTypes.bool.isRequired,
    handleClickShowPassword: PropTypes.func.isRequired,
    captchaRef: PropTypes.shape({}).isRequired
}
