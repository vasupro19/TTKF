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
import { BarChart2, Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react'
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
                // Exact same dark navy as your app header/sidebar
                background: 'radial-gradient(ellipse at 40% 0%, #2a3f5f 0%, #1c2d45 30%, #141f2e 70%, #0e1620 100%)',
                px: { xs: 2, sm: 3 },
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Subtle dot grid — same visual language as app */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                    pointerEvents: 'none',
                    zIndex: 0
                }}
            />

            {/* Soft glow — top left */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -150,
                    left: -150,
                    width: 450,
                    height: 450,
                    borderRadius: '50%',
                    background: 'rgba(30, 80, 140, 0.25)',
                    filter: 'blur(90px)',
                    pointerEvents: 'none',
                    zIndex: 0
                }}
            />

            {/* Soft glow — bottom right, green tint matching app's green */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: -120,
                    right: -100,
                    width: 380,
                    height: 380,
                    borderRadius: '50%',
                    background: 'rgba(57, 181, 74, 0.1)',
                    filter: 'blur(80px)',
                    pointerEvents: 'none',
                    zIndex: 0
                }}
            />

            <Grid item xs={12} sm={8} md={5} lg={4} xl={3} sx={{ position: 'relative', zIndex: 1 }}>
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <Card
                        sx={{
                            width: '100%',
                            borderRadius: '16px',
                            // Crisp white card — exactly like your table/content area
                            background: '#ffffff',
                            boxShadow: '0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.05)',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Top bar — same dark navy as app header */}
                        <Box
                            sx={{
                                bgcolor: '#1c2d45',
                                px: 3,
                                py: 2.5,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5
                            }}
                        >
                            <Box
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.12)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    p: 0.8,
                                    borderRadius: '8px',
                                    display: 'flex'
                                }}
                            >
                                <BarChart2 color='white' size={18} />
                            </Box>
                            <Typography
                                sx={{
                                    fontWeight: 800,
                                    color: 'white',
                                    fontSize: '1.1rem',
                                    letterSpacing: '-0.3px',
                                    fontFamily: 'inherit'
                                }}
                            >
                                Travelytics
                                <Box component='span' sx={{ color: '#39B54A', ml: 0.2 }}>
                                    .cloud
                                </Box>
                            </Typography>
                        </Box>

                        <CardContent sx={{ p: { xs: 3, sm: 4 }, '&:last-child': { pb: { xs: 3, sm: 4 } } }}>
                            {/* Heading */}
                            <Box sx={{ mb: 3.5 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 800,
                                        color: '#1a2535',
                                        fontSize: isSmallScreen ? '1.4rem' : '1.6rem',
                                        letterSpacing: '-0.3px',
                                        mb: 0.5
                                    }}
                                >
                                    Sign in
                                </Typography>
                                <Typography sx={{ color: '#64748b', fontSize: '0.88rem' }}>
                                    Enter your credentials to continue
                                </Typography>
                            </Box>

                            <Box component='form' onSubmit={formik.handleSubmit}>
                                {/* Email */}
                                <Box sx={{ mb: 2.5 }}>
                                    <Typography
                                        sx={{
                                            fontSize: '0.78rem',
                                            fontWeight: 700,
                                            color: '#374151',
                                            mb: 0.8,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em'
                                        }}
                                    >
                                        Email
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            border: '1.5px solid',
                                            borderColor:
                                                formik.touched.email && formik.errors.email ? '#ef4444' : '#d1d5db',
                                            borderRadius: '8px',
                                            px: 1.8,
                                            py: 0.2,
                                            bgcolor: '#f9fafb',
                                            transition: 'all 0.18s ease',
                                            '&:focus-within': {
                                                borderColor: '#1c2d45',
                                                bgcolor: '#fff',
                                                boxShadow: '0 0 0 3px rgba(28,45,69,0.1)'
                                            }
                                        }}
                                    >
                                        <Mail size={16} color='#9ca3af' style={{ flexShrink: 0 }} />
                                        <TextField
                                            fullWidth
                                            variant='standard'
                                            placeholder='your@email.com'
                                            id='email'
                                            name='email'
                                            value={formik.values.email}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            error={formik.touched.email && Boolean(formik.errors.email)}
                                            InputProps={{ disableUnderline: true }}
                                            sx={{
                                                '& input': {
                                                    py: 1.3,
                                                    fontSize: '0.92rem',
                                                    color: '#111827',
                                                    '&::placeholder': { color: '#9ca3af' }
                                                }
                                            }}
                                        />
                                    </Box>
                                    {formik.touched.email && formik.errors.email && (
                                        <Typography sx={{ color: '#ef4444', fontSize: '0.73rem', mt: 0.5, ml: 0.3 }}>
                                            {formik.errors.email}
                                        </Typography>
                                    )}
                                </Box>

                                {/* Password */}
                                <Box sx={{ mb: 2 }}>
                                    <Typography
                                        sx={{
                                            fontSize: '0.78rem',
                                            fontWeight: 700,
                                            color: '#374151',
                                            mb: 0.8,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em'
                                        }}
                                    >
                                        Password
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            border: '1.5px solid',
                                            borderColor:
                                                formik.touched.password && formik.errors.password
                                                    ? '#ef4444'
                                                    : '#d1d5db',
                                            borderRadius: '8px',
                                            px: 1.8,
                                            py: 0.2,
                                            bgcolor: '#f9fafb',
                                            transition: 'all 0.18s ease',
                                            '&:focus-within': {
                                                borderColor: '#1c2d45',
                                                bgcolor: '#fff',
                                                boxShadow: '0 0 0 3px rgba(28,45,69,0.1)'
                                            }
                                        }}
                                    >
                                        <Lock size={16} color='#9ca3af' style={{ flexShrink: 0 }} />
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
                                                    py: 1.3,
                                                    fontSize: '0.92rem',
                                                    color: '#111827',
                                                    '&::placeholder': { color: '#9ca3af' }
                                                }
                                            }}
                                        />
                                        <IconButton
                                            onClick={() => setShowPassword(p => !p)}
                                            size='small'
                                            sx={{
                                                color: '#9ca3af',
                                                '&:hover': { color: '#374151' },
                                                flexShrink: 0,
                                                p: 0.5
                                            }}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </IconButton>
                                    </Box>
                                    {formik.touched.password && formik.errors.password && (
                                        <Typography sx={{ color: '#ef4444', fontSize: '0.73rem', mt: 0.5, ml: 0.3 }}>
                                            {formik.errors.password}
                                        </Typography>
                                    )}
                                </Box>

                                {/* Remember + Forgot */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
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
                                                sx={{
                                                    color: '#d1d5db',
                                                    '&.Mui-checked': { color: '#39B54A' }
                                                }}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                                Remember me
                                            </Typography>
                                        }
                                    />
                                    <Typography
                                        component='a'
                                        href='/forgot-password'
                                        sx={{
                                            fontSize: '0.85rem',
                                            color: '#1c2d45',
                                            fontWeight: 600,
                                            textDecoration: 'none',
                                            '&:hover': { color: '#39B54A', textDecoration: 'underline' },
                                            transition: 'color 0.15s ease'
                                        }}
                                    >
                                        Forgot password?
                                    </Typography>
                                </Box>

                                {/* Submit — green matching app's Add New / Upload Excel buttons */}
                                <Button
                                    fullWidth
                                    type='submit'
                                    variant='contained'
                                    disabled={formik.isSubmitting}
                                    onClick={e => {
                                        if (formik.isSubmitting) e.preventDefault()
                                    }}
                                    sx={{
                                        borderRadius: '8px',
                                        py: 1.6,
                                        fontSize: '0.95rem',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        // #39B54A — exact green from your app's buttons
                                        bgcolor: '#39B54A',
                                        color: '#fff',
                                        boxShadow: '0 4px 14px rgba(57,181,74,0.35)',
                                        mb: 2,
                                        '&:hover': {
                                            bgcolor: '#2ea040',
                                            boxShadow: '0 6px 20px rgba(57,181,74,0.45)',
                                            transform: 'translateY(-1px)'
                                        },
                                        '&:active': { transform: 'translateY(0)' },
                                        '&.Mui-disabled': { bgcolor: '#86efac', color: 'white' },
                                        transition: 'all 0.18s ease'
                                    }}
                                >
                                    {formik.isSubmitting ? (
                                        <CircularProgress size={22} sx={{ color: 'white' }} />
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            Login
                                            <ArrowRight size={17} />
                                        </Box>
                                    )}
                                </Button>

                                {/* Footer note */}
                                <Typography
                                    sx={{
                                        textAlign: 'center',
                                        fontSize: '0.75rem',
                                        color: '#9ca3af'
                                    }}
                                >
                                    Protected by 256-bit SSL encryption
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </motion.div>
            </Grid>
        </Grid>
    )
}
