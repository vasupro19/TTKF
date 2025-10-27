/* eslint-disable no-underscore-dangle */
import React, { useState, useRef } from 'react'
import { useFormik } from 'formik'
import { z } from 'zod'
import { useDispatch } from 'react-redux'
import { Grid, Box, Card, CardContent, useTheme, useMediaQuery } from '@mui/material'
import cerebrumLogo from '@assets/images/auth/Cerebrum_logo_final_white.png'
import { useLoginMutation } from '@app/store/slices/api/authApiSlice'
import LoginForm from '@core/components/forms/LoginForm'
import { openSnackbar } from '@app/store/slices/snackbar'
import { setUserDetails } from '@app/store/slices/auth'
import { useNavigate } from 'react-router-dom'
import { setSessionData } from '@app/store/slices/sessionSlice'
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
    const [token, setToken] = useLocalStorage(LOCAL_STORAGE_KEYS.token, null)
    const [, , removeClientLocation] = useLocalStorage(LOCAL_STORAGE_KEYS.clientLocation, true)
    const captchaRef = useRef(null)
    const [showPassword, setShowPassword] = useState(false)
    const theme = useTheme()
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

    const handleClickShowPassword = () => setShowPassword(prev => !prev)

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
                console.log(res.data.accessToken)
                dispatch(setUserDetails(res.data.user))
                // dispatch(setSessionData(res.session))
                setToken(res.data.accessToken)
                // removeClientLocation()
                navigate('/dashboard')
            } catch (err) {
                dispatch(openSnackbar({ message: err?.data?.message || 'Login failed', severity: 'error' }))
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
                background: 'radial-gradient(circle, #244065, #1F3A5C, #1A3354, #152B4A, #101F3E)',
                flexWrap: 'wrap'
            }}
        >
            <Grid item xs={12} sm={8} md={6} lg={4}>
                <Card
                    sx={{
                        width: '100%',
                        maxWidth: 450,
                        mx: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 2,
                        boxShadow: 3,
                        background: '#fff'
                    }}
                >
                    <CardContent sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
                            <img
                                src={cerebrumLogo}
                                alt='Cerebrum Logo'
                                style={{ width: '200px', objectFit: 'contain' }}
                            />
                        </Box>
                        <LoginForm
                            formik={formik}
                            showPassword={showPassword}
                            handleClickShowPassword={handleClickShowPassword}
                            isSmallScreen={isSmallScreen}
                            captchaRef={captchaRef}
                        />
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}
