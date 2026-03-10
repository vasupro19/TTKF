/* eslint-disable no-underscore-dangle */
import React, { useState, useRef } from 'react'
import { useFormik } from 'formik'
import { z } from 'zod'
import { useDispatch } from 'react-redux'
import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    Grid,
    IconButton,
    TextField,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material'
import { BarChart2, Eye, EyeOff, Lock, Mail, ArrowRight, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLoginMutation, useLazyGetMenuQuery } from '@app/store/slices/api/authApiSlice'
import { openSnackbar } from '@app/store/slices/snackbar'
import { setUserDetails, setMenuItems } from '@app/store/slices/auth'
import { useNavigate } from 'react-router-dom'
import { useLocalStorage, LOCAL_STORAGE_KEYS } from '@/hooks/useLocalStorage'

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
    const captchaRef = useRef(null)
    const [showPassword, setShowPassword] = useState(false)
    const theme = useTheme()
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
    const [triggerMenu] = useLazyGetMenuQuery()

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
                const res = await login(values).unwrap()
                const userData = res.data.user
                dispatch(setUserDetails(userData))
                await setToken(res.data.accessToken)
                const menus = await triggerMenu(userData.id).unwrap()
                dispatch(setMenuItems(menus.data))
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

    return (
        <Grid
            container
            alignItems='center'
            justifyContent='center'
            sx={{
                minHeight: '100vh',
                background: 'radial-gradient(ellipse at 30% 20%, #1e3a8a 0%, #1a2f6e 25%, #12204d 55%, #0c1535 100%)',
                position: 'relative',
                overflow: 'hidden',
                px: { xs: 2, sm: 3 }
            }}
        >
            {/* Google Fonts */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
            `}</style>

            {/* Background orbs */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -120,
                    left: -120,
                    width: 420,
                    height: 420,
                    borderRadius: '50%',
                    background: 'rgba(37,99,235,0.2)',
                    filter: 'blur(80px)',
                    pointerEvents: 'none'
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: -100,
                    right: -80,
                    width: 360,
                    height: 360,
                    borderRadius: '50%',
                    background: 'rgba(124,58,237,0.18)',
                    filter: 'blur(70px)',
                    pointerEvents: 'none'
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    top: '45%',
                    right: '8%',
                    width: 220,
                    height: 220,
                    borderRadius: '50%',
                    background: 'rgba(5,150,105,0.12)',
                    filter: 'blur(60px)',
                    pointerEvents: 'none'
                }}
            />

            {/* Dot grid overlay */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                    pointerEvents: 'none'
                }}
            />

            {/* Card */}
            <Grid item xs={12} sm={8} md={6} lg={4} xl={3} sx={{ position: 'relative', zIndex: 1 }}>
                <motion.div
                    initial={{ opacity: 0, y: 28, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                >
                    <Card
                        sx={{
                            width: '100%',
                            borderRadius: '24px',
                            boxShadow: '0 32px 72px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07)',
                            background: '#ffffff',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Card top accent bar */}
                        <Box
                            sx={{
                                height: 4,
                                background: 'linear-gradient(90deg, #2563eb, #7c3aed, #2563eb)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 3s linear infinite',
                                '@keyframes shimmer': {
                                    '0%': { backgroundPosition: '0% 0%' },
                                    '100%': { backgroundPosition: '200% 0%' }
                                }
                            }}
                        />

                        <CardContent
                            sx={{
                                p: { xs: 3.5, sm: 5 },
                                '&:last-child': { pb: { xs: 3.5, sm: 5 } }
                            }}
                        >
                            {/* Logo */}
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box
                                        sx={{
                                            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                            p: 1.1,
                                            borderRadius: '10px',
                                            display: 'flex',
                                            boxShadow: '0 4px 14px rgba(37,99,235,0.4)'
                                        }}
                                    >
                                        <BarChart2 color='white' size={22} />
                                    </Box>
                                    <Typography
                                        sx={{
                                            fontWeight: 900,
                                            color: '#0f172a',
                                            fontFamily: '"Syne", sans-serif',
                                            fontSize: '1.5rem',
                                            letterSpacing: '-0.5px'
                                        }}
                                    >
                                        Travelytics
                                        <Box component='span' sx={{ color: '#2563eb' }}>
                                            .cloud
                                        </Box>
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Heading */}
                            <Box sx={{ textAlign: 'center', mb: 4 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 900,
                                        color: '#0f172a',
                                        fontFamily: '"Syne", sans-serif',
                                        fontSize: isSmallScreen ? '1.5rem' : '1.75rem',
                                        letterSpacing: '-0.5px',
                                        mb: 0.75
                                    }}
                                >
                                    Welcome back
                                </Typography>
                                <Typography
                                    sx={{
                                        color: '#64748b',
                                        fontFamily: '"DM Sans", sans-serif',
                                        fontSize: '0.9rem',
                                        lineHeight: 1.6
                                    }}
                                >
                                    Sign in to your agency dashboard
                                </Typography>
                            </Box>

                            {/* Form */}
                            <Box component='form' onSubmit={formik.handleSubmit}>
                                {/* Email */}
                                <Box sx={{ mb: 2.5 }}>
                                    <Typography
                                        sx={{
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            color: '#374151',
                                            mb: 1,
                                            fontFamily: '"DM Sans", sans-serif',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.07em'
                                        }}
                                    >
                                        Email Address
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.2,
                                            bgcolor: '#f8faff',
                                            border: '1.5px solid',
                                            borderColor:
                                                formik.touched.email && formik.errors.email ? '#ef4444' : '#e2e8f0',
                                            borderRadius: '12px',
                                            px: 2,
                                            py: 0.3,
                                            transition: 'all 0.2s ease',
                                            '&:focus-within': {
                                                borderColor: '#2563eb',
                                                bgcolor: '#fff',
                                                boxShadow: '0 0 0 3px rgba(37,99,235,0.1)'
                                            }
                                        }}
                                    >
                                        <Mail size={17} color='#94a3b8' style={{ flexShrink: 0 }} />
                                        <TextField
                                            fullWidth
                                            variant='standard'
                                            placeholder='you@agency.com'
                                            id='email'
                                            name='email'
                                            value={formik.values.email}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            error={formik.touched.email && Boolean(formik.errors.email)}
                                            InputProps={{ disableUnderline: true }}
                                            sx={{
                                                '& input': {
                                                    py: 1.4,
                                                    fontFamily: '"DM Sans", sans-serif',
                                                    fontSize: '0.93rem',
                                                    color: '#0f172a',
                                                    '&::placeholder': { color: '#94a3b8' }
                                                }
                                            }}
                                        />
                                    </Box>
                                    {formik.touched.email && formik.errors.email && (
                                        <Typography
                                            sx={{
                                                color: '#ef4444',
                                                fontSize: '0.73rem',
                                                mt: 0.6,
                                                ml: 0.5,
                                                fontFamily: '"DM Sans", sans-serif'
                                            }}
                                        >
                                            {formik.errors.email}
                                        </Typography>
                                    )}
                                </Box>

                                {/* Password */}
                                <Box sx={{ mb: 2 }}>
                                    <Typography
                                        sx={{
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            color: '#374151',
                                            mb: 1,
                                            fontFamily: '"DM Sans", sans-serif',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.07em'
                                        }}
                                    >
                                        Password
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.2,
                                            bgcolor: '#f8faff',
                                            border: '1.5px solid',
                                            borderColor:
                                                formik.touched.password && formik.errors.password
                                                    ? '#ef4444'
                                                    : '#e2e8f0',
                                            borderRadius: '12px',
                                            px: 2,
                                            py: 0.3,
                                            transition: 'all 0.2s ease',
                                            '&:focus-within': {
                                                borderColor: '#2563eb',
                                                bgcolor: '#fff',
                                                boxShadow: '0 0 0 3px rgba(37,99,235,0.1)'
                                            }
                                        }}
                                    >
                                        <Lock size={17} color='#94a3b8' style={{ flexShrink: 0 }} />
                                        <TextField
                                            fullWidth
                                            variant='standard'
                                            placeholder='••••••••'
                                            id='password'
                                            name='password'
                                            type={showPassword ? 'text' : 'password'}
                                            value={formik.values.password}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            error={formik.touched.password && Boolean(formik.errors.password)}
                                            InputProps={{ disableUnderline: true }}
                                            sx={{
                                                '& input': {
                                                    py: 1.4,
                                                    fontFamily: '"DM Sans", sans-serif',
                                                    fontSize: '0.93rem',
                                                    color: '#0f172a',
                                                    '&::placeholder': { color: '#94a3b8' }
                                                }
                                            }}
                                        />
                                        <IconButton
                                            onClick={() => setShowPassword(p => !p)}
                                            size='small'
                                            sx={{ color: '#94a3b8', '&:hover': { color: '#475569' }, flexShrink: 0 }}
                                        >
                                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                        </IconButton>
                                    </Box>
                                    {formik.touched.password && formik.errors.password && (
                                        <Typography
                                            sx={{
                                                color: '#ef4444',
                                                fontSize: '0.73rem',
                                                mt: 0.6,
                                                ml: 0.5,
                                                fontFamily: '"DM Sans", sans-serif'
                                            }}
                                        >
                                            {formik.errors.password}
                                        </Typography>
                                    )}
                                </Box>

                                {/* Remember me + Forgot password */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 3.5
                                    }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name='rememberMe'
                                                size='small'
                                                checked={formik.values.rememberMe}
                                                onChange={formik.handleChange}
                                                sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#2563eb' } }}
                                            />
                                        }
                                        label={
                                            <Typography
                                                sx={{
                                                    fontSize: '0.87rem',
                                                    color: '#64748b',
                                                    fontFamily: '"DM Sans", sans-serif'
                                                }}
                                            >
                                                Remember me
                                            </Typography>
                                        }
                                    />
                                    <Typography
                                        component='a'
                                        href='/forgot-password'
                                        sx={{
                                            fontSize: '0.87rem',
                                            color: '#2563eb',
                                            fontWeight: 600,
                                            fontFamily: '"DM Sans", sans-serif',
                                            textDecoration: 'none',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                    >
                                        Forgot password?
                                    </Typography>
                                </Box>

                                {/* Submit */}
                                <Button
                                    fullWidth
                                    type='submit'
                                    variant='contained'
                                    disabled={formik.isSubmitting}
                                    onClick={e => {
                                        if (formik.isSubmitting) e.preventDefault()
                                    }}
                                    sx={{
                                        borderRadius: '12px',
                                        py: 1.75,
                                        fontSize: '0.97rem',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        fontFamily: '"DM Sans", sans-serif',
                                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                        boxShadow: '0 6px 20px rgba(37,99,235,0.38)',
                                        mb: 3,
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 10px 28px rgba(37,99,235,0.48)'
                                        },
                                        '&:active': { transform: 'translateY(0)' },
                                        '&.Mui-disabled': {
                                            background: 'linear-gradient(135deg, #93c5fd, #c4b5fd)',
                                            color: 'white'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {formik.isSubmitting ? (
                                        <CircularProgress size={22} sx={{ color: 'white' }} />
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            Sign in to Travelytics
                                            <ArrowRight size={17} />
                                        </Box>
                                    )}
                                </Button>

                                {/* Trust badges */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: { xs: 2, sm: 3 },
                                        flexWrap: 'wrap'
                                    }}
                                >
                                    {['256-bit SSL', 'SOC 2 Ready', 'GDPR Safe'].map(badge => (
                                        <Box key={badge} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <CheckCircle size={12} color='#10b981' />
                                            <Typography
                                                sx={{
                                                    fontSize: '0.72rem',
                                                    color: '#94a3b8',
                                                    fontFamily: '"DM Sans", sans-serif',
                                                    fontWeight: 500
                                                }}
                                            >
                                                {badge}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </motion.div>
            </Grid>
        </Grid>
    )
}
