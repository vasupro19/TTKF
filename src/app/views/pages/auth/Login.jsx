/* eslint-disable no-underscore-dangle */
import React, { useState, useEffect } from 'react'
import { useFormik } from 'formik'
import { z } from 'zod'
import { useDispatch } from 'react-redux'
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLoginMutation, useLazyGetMenuQuery } from '@app/store/slices/api/authApiSlice'
import { openSnackbar } from '@app/store/slices/snackbar'
import { setUserDetails, setMenuItems } from '@app/store/slices/auth'
import { beginSignIn, markSignedIn } from '@app/store/session'
import { useNavigate } from 'react-router-dom'
import { useLocalStorage, LOCAL_STORAGE_KEYS } from '@/hooks/useLocalStorage'
import PublicBrand from '../public/PublicBrand'
import { GREEN, GREEN_BRIGHT, INK, LINE, MUTED, NAVY_BACKDROP } from '../public/publicTheme'
import JobApplicationForm from './JobApplicationForm'
import JobApplicationStatusDialog from './JobApplicationStatusDialog'

const loginSchema = z.object({
    email: z.string().email('Enter a valid email address').min(1, 'Email is required'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional()
})

export default function Login() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [login] = useLoginMutation()
    const [, setToken] = useLocalStorage(LOCAL_STORAGE_KEYS.token, null)
    const [showPassword, setShowPassword] = useState(false)
    const [triggerMenu] = useLazyGetMenuQuery()
    const [showJobForm, setShowJobForm] = useState(false)
    const [showJobStatus, setShowJobStatus] = useState(false)

    // ? why the last session ended, when the app ended it (e.g. "Your agency's account is switched off")
    useEffect(() => {
        const reason = new URLSearchParams(window.location.search).get('reason')
        if (!reason) return
        dispatch(
            openSnackbar({
                open: true,
                message: reason,
                variant: 'alert',
                alert: { color: 'error' },
                anchorOrigin: { vertical: 'top', horizontal: 'right' }
            })
        )
        window.history.replaceState(null, '', window.location.pathname)
    }, [dispatch])

    const validate = values => {
        try {
            loginSchema.parse(values)
            return {}
        } catch (error) {
            const errors = {}
            error.errors.forEach(err => {
                errors[err.path[0]] = err.message
            })
            return errors
        }
    }

    const formik = useFormik({
        initialValues: { email: '', password: '', rememberMe: false },
        validate,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                // ? nothing from an earlier session may show in this one
                beginSignIn()
                const res = await login(values).unwrap()
                const userData = res.data.user
                dispatch(setUserDetails({ user: userData }))
                // ? only that someone is signed in: the session itself is in httpOnly cookies, out of reach of page scripts
                await setToken('signed-in')
                markSignedIn(userData)
                const menus = await triggerMenu(userData.id).unwrap()
                dispatch(setMenuItems(menus.data))
                navigate('/dashboard', { replace: true })
            } catch (err) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: err.data?.message || 'An error occurred, please try again',
                        variant: 'alert',
                        alert: { color: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
            } finally {
                setSubmitting(false)
            }
        }
    })

    const POINTS = [
        'Leads, quotations and bookings in one place',
        'GST and non-GST quotes, with invoices',
        'Every salesperson’s sales, profit and incentive'
    ]

    const fieldSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            bgcolor: '#f8fafc',
            '& fieldset': { borderColor: '#d5dbe4' },
            '&:hover fieldset': { borderColor: '#94a3b8' },
            '&.Mui-focused': { bgcolor: '#fff' },
            '&.Mui-focused fieldset': { borderColor: GREEN, borderWidth: 1.5 }
        },
        '& .MuiInputBase-input': { py: 1.5, fontSize: '1rem' }
    }

    return (
        <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' } }}>
            {/* Brand panel — the product's navy, with what it does */}
            <Box
                sx={{
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    p: { md: 6, lg: 8 },
                    color: '#fff',
                    background: NAVY_BACKDROP,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                        pointerEvents: 'none'
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: -160,
                        right: -120,
                        width: 460,
                        height: 460,
                        borderRadius: '50%',
                        background: 'rgba(70,182,83,0.16)',
                        filter: 'blur(90px)',
                        pointerEvents: 'none'
                    }}
                />
                <Box sx={{ position: 'relative' }}>
                    <PublicBrand size='lg' />
                </Box>
                <Box sx={{ position: 'relative', maxWidth: 480 }}>
                    <Typography
                        component='h2'
                        sx={{ fontSize: { md: '2rem', lg: '2.6rem' }, fontWeight: 800, lineHeight: 1.15, mb: 2 }}
                    >
                        Run your whole agency from one calm workspace.
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: '1.05rem', mb: 4 }}>
                        From the first enquiry to the confirmed booking and the invoice.
                    </Typography>
                    <Stack spacing={1.75}>
                        {POINTS.map(point => (
                            <Stack key={point} direction='row' spacing={1.5} alignItems='center'>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        p: 0.5,
                                        borderRadius: '50%',
                                        bgcolor: 'rgba(70,182,83,0.2)',
                                        color: GREEN_BRIGHT
                                    }}
                                >
                                    <Check size={14} strokeWidth={3} />
                                </Box>
                                <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.98rem' }}>
                                    {point}
                                </Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Box>
                <Typography sx={{ position: 'relative', color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>
                    © {new Date().getFullYear()} Travelytics.cloud
                </Typography>
            </Box>

            {/* Form panel */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: { xs: 2.5, sm: 4 },
                    py: 6,
                    bgcolor: '#fff'
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{ width: '100%', maxWidth: 400 }}
                >
                    <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4 }}>
                        <PublicBrand dark={false} size='lg' />
                    </Box>
                    <Typography component='h1' sx={{ fontWeight: 800, color: INK, fontSize: '1.9rem', mb: 0.5 }}>
                        Welcome back
                    </Typography>
                    <Typography sx={{ color: MUTED, fontSize: '0.95rem', mb: 4 }}>
                        Sign in to your agency’s workspace.
                    </Typography>

                    <Box component='form' onSubmit={formik.handleSubmit} noValidate>
                        <TextField
                            fullWidth
                            label='Email'
                            id='email'
                            name='email'
                            type='email'
                            autoComplete='email'
                            placeholder='you@youragency.com'
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.email && Boolean(formik.errors.email)}
                            helperText={formik.touched.email && formik.errors.email}
                            sx={{ ...fieldSx, mb: 2.5 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <Mail size={18} color='#94a3b8' />
                                    </InputAdornment>
                                )
                            }}
                        />
                        <TextField
                            fullWidth
                            label='Password'
                            id='password'
                            name='password'
                            type={showPassword ? 'text' : 'password'}
                            autoComplete='current-password'
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.password && Boolean(formik.errors.password)}
                            helperText={formik.touched.password && formik.errors.password}
                            sx={fieldSx}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <Lock size={18} color='#94a3b8' />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position='end'>
                                        <IconButton
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            onClick={() => setShowPassword(value => !value)}
                                            edge='end'
                                            size='small'
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mt: 1.5,
                                mb: 3
                            }}
                        >
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name='rememberMe'
                                        size='small'
                                        checked={formik.values.rememberMe}
                                        onChange={formik.handleChange}
                                        sx={{ '&.Mui-checked': { color: GREEN } }}
                                    />
                                }
                                label={<Typography sx={{ fontSize: '0.875rem', color: MUTED }}>Remember me</Typography>}
                            />
                            <Typography
                                component='a'
                                href='/forgot-password'
                                sx={{
                                    fontSize: '0.875rem',
                                    color: GREEN,
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' }
                                }}
                            >
                                Forgot password?
                            </Typography>
                        </Box>

                        <Button
                            fullWidth
                            type='submit'
                            variant='contained'
                            disabled={formik.isSubmitting}
                            sx={{
                                borderRadius: '10px',
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 700,
                                textTransform: 'none',
                                bgcolor: GREEN,
                                boxShadow: '0 8px 20px rgba(49,101,35,0.28)',
                                '&:hover': { bgcolor: '#285419', boxShadow: '0 10px 24px rgba(49,101,35,0.36)' },
                                '&.Mui-disabled': { bgcolor: '#9bb892', color: '#fff' }
                            }}
                        >
                            {formik.isSubmitting ? (
                                <CircularProgress size={22} sx={{ color: 'white' }} />
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    Sign in
                                    <ArrowRight size={18} />
                                </Box>
                            )}
                        </Button>
                    </Box>

                    <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${LINE}`, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.875rem', color: MUTED }}>
                            Looking for a job?{' '}
                            <Typography
                                component='button'
                                type='button'
                                onClick={() => setShowJobForm(true)}
                                sx={{
                                    p: 0,
                                    border: 0,
                                    background: 'none',
                                    font: 'inherit',
                                    color: GREEN,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    '&:hover': { textDecoration: 'underline' }
                                }}
                            >
                                Apply here
                            </Typography>
                        </Typography>
                        <Typography sx={{ fontSize: '0.875rem', color: MUTED, mt: 0.75 }}>
                            Already applied?{' '}
                            <Typography
                                component='button'
                                type='button'
                                onClick={() => setShowJobStatus(true)}
                                sx={{
                                    p: 0,
                                    border: 0,
                                    background: 'none',
                                    font: 'inherit',
                                    color: INK,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    '&:hover': { textDecoration: 'underline' }
                                }}
                            >
                                Check status
                            </Typography>
                        </Typography>
                    </Box>
                    <JobApplicationForm open={showJobForm} onClose={() => setShowJobForm(false)} />
                    <JobApplicationStatusDialog open={showJobStatus} onClose={() => setShowJobStatus(false)} />
                </motion.div>
            </Box>
        </Box>
    )
}
