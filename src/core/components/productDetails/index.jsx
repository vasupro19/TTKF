import React from 'react'
import { Paper, Box, Typography, Divider } from '@mui/material'
import styles from './ProductDetails.module.css' // Import the CSS module

export default function ProductDetails({ data = [], productName = '' }) {
    return (
        <Box className={styles.flipCard}>
            <Box className={styles.flipCardInner}>
                {/* Front Side */}
                <Paper
                    variant='outlined'
                    sx={{
                        padding: 1.5,
                        background: 'linear-gradient(145deg, #e6e8ed, #ffffff)',
                        borderRadius: '16px',
                        border: '1px solid',
                        borderColor: 'grey.borderLight',
                        boxShadow: '6px 6px 12px #d1d4db, -6px -6px 12px #ffffff'
                    }}
                    className={styles.flipCardFront}
                >
                    <Typography variant='h4' sx={{ wordBreak: 'break-word' }}>
                        {productName ?? ''}
                    </Typography>
                    <Divider sx={{ borderColor: 'primary.main', marginTop: 0.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        {/* Left Section */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 4 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {data.map(({ label, value, sx }) => (
                                    <Box
                                        key={label}
                                        sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ...(sx || {}) }}
                                    >
                                        <Typography
                                            variant='body2'
                                            sx={{
                                                fontWeight: 'bold',
                                                color: '#5A5A5A',
                                                flex: '0 0 auto'
                                            }}
                                        >
                                            {label}:
                                        </Typography>
                                        <Typography
                                            variant='body2'
                                            sx={{ color: '#3E3E3E', wordBreak: 'break-word', flex: 1 }}
                                        >
                                            {value || 'N/A'}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </Paper>
                {/* Back Side */}
                <Box className={styles.flipCardBack}>
                    <Box
                        sx={{
                            backgroundColor: '#394009',
                            height: '60px',
                            width: '70px'
                        }}
                    >
                        Content at Back
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}
