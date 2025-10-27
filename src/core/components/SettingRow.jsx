import React from 'react'
import { Box, Typography, useTheme, alpha, CircularProgress } from '@mui/material'

// eslint-disable-next-line react/prop-types
export default function SettingRow({ icon, title, description, control, loading }) {
    const theme = useTheme()
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: { xs: 1, sm: 2 },
                py: 1.5,
                px: { xs: 0.2, sm: 2 },
                transition: 'background-color 0.2s ease-in-out',
                borderRadius: theme.shape.borderRadius,
                '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.light, 0.05)
                }
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexGrow: 1,
                    pr: 2,
                    minWidth: '250px'
                }}
            >
                {icon &&
                    React.cloneElement(icon, {
                        color: 'primary',
                        sx: { mr: 2, fontSize: '1.5rem', flexShrink: 0 }
                    })}
                <Box>
                    <Typography variant='body1' fontWeight={500} sx={{ lineHeight: 1.4 }}>
                        {title}
                    </Typography>
                    {description && (
                        <Typography
                            variant='caption'
                            color='text.secondary'
                            sx={{ display: 'block', lineHeight: 1.3, mt: 0.25 }}
                        >
                            {description}
                        </Typography>
                    )}
                </Box>
            </Box>
            <Box sx={{ flexShrink: 0, pl: 1 }}>
                {loading ? <CircularProgress size='18px' color='success' /> : control}
            </Box>
        </Box>
    )
}
