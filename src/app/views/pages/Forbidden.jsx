import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'
import { LeftArrowAnimIcon } from '@/assets/icons/LeftArrowAnimIcon'
import { Home } from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import CustomButton from '@/core/components/extended/CustomButton'

export default function Forbidden({ message = 'You do not have permission to access this module!' }) {
    const navigate = useNavigate()
    const location = useLocation()
    const [hide, setHide] = useState(false)
    useEffect(() => {
        if (location.pathname && location.pathname === '/dashboard') setHide(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <Box
            sx={{
                padding: '1rem',
                borderRadius: '5px',
                width: '100%',
                height: '100vh',
                color: '#721c24',
                marginBottom: '1rem',
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <Typography variant='h1' sx={{ fontSize: '6rem', mb: 4 }}>
                    403
                </Typography>
                <Typography variant='h2'>Access Denied!</Typography>
                <Typography variant='body2' color='textSecondary' sx={{ mt: 1, mb: 2 }}>
                    {message}
                </Typography>
                {!hide && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '1rem'
                        }}
                    >
                        <CustomButton
                            variant='clickable'
                            customStyles={{ mt: 2, borderRadius: 3 }}
                            shouldAnimate
                            startIcon={<LeftArrowAnimIcon size={20} />}
                            onClick={() => navigate(-1)}
                        >
                            Go Back
                        </CustomButton>
                        <CustomButton
                            variant='clickable'
                            customStyles={{ mt: 2, borderRadius: 3 }}
                            shouldAnimate
                            startIcon={<Home size={20} />}
                            onClick={() => navigate('/dashboard')}
                        >
                            Home
                        </CustomButton>
                    </Box>
                )}
            </Box>
        </Box>
    )
}

Forbidden.propTypes = {
    message: PropTypes.string
}
