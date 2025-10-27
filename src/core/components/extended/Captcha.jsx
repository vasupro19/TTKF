import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { TextField, Box, Typography, useTheme, useMediaQuery } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'

const CaptchaTextField = forwardRef((props, ref) => {
    const [captcha, setCaptcha] = useState('')
    const [captchaInput, setCaptchaInput] = useState('')
    const [captchaError, setCaptchaError] = useState('')

    const theme = useTheme()
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
    const generateCaptcha = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let captchaText = ''
        for (let i = 0; i < 6; i += 1) {
            captchaText += characters.charAt(Math.floor(Math.random() * characters.length))
        }
        setCaptcha(captchaText)
        setCaptchaInput('')
        setCaptchaError('')
    }

    useEffect(() => {
        generateCaptcha()
    }, [])

    const handleCaptchaInputChange = e => {
        setCaptchaInput(e.target.value)
    }

    useImperativeHandle(ref, () => ({
        validateCaptchaInput: () => {
            if (captchaInput !== captcha) {
                setCaptchaError('Incorrect captcha. Please try again.')
                return false
            }
            setCaptchaError('')
            return true
        },
        resetCaptcha: generateCaptcha
    }))

    return (
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mb: 2 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mr: isSmallScreen ? 0 : 2,
                    mb: isSmallScreen ? 2 : 0,
                    height: '48px'
                }}
            >
                <Typography
                    variant='h5'
                    sx={{
                        backgroundColor: '#2c2c2c',
                        color: 'white',
                        padding: '10px 16px',
                        borderRadius: '5px',
                        fontFamily: 'monospace',
                        letterSpacing: '3px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        width: isSmallScreen ? '100%' : '120px',
                        height: '48px',
                        lineHeight: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none'
                    }}
                >
                    {captcha}
                </Typography>
                <RefreshIcon
                    onClick={generateCaptcha}
                    sx={{
                        cursor: 'pointer',
                        marginLeft: '10px',
                        color: '#39B54A',
                        '&:hover': { color: '#14467B' }
                    }}
                />
            </Box>

            <TextField
                variant='standard'
                fullWidth
                label='Enter Captcha'
                value={captchaInput}
                onChange={handleCaptchaInputChange}
                error={!!captchaError}
                helperText={captchaError}
                InputLabelProps={{
                    shrink: !!captchaInput
                }}
                sx={{ flexGrow: 1, height: '48px' }}
                autoComplete='off'
            />
        </Box>
    )
})

export default CaptchaTextField
