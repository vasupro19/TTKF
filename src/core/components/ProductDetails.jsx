import React from 'react'
import { Paper, Box, Typography, Divider } from '@mui/material'
import PropTypes from 'prop-types'

export default function ProductDetails({ data = [], productName = '', showNoData = false }) {
    return (
        <Paper
            variant='outlined'
            sx={{
                padding: 1.5,
                background: 'linear-gradient(145deg, #e6e8ed, #ffffff)',
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'grey.borderLight',
                boxShadow: '6px 6px 12px #d1d4db, -6px -6px 12px #ffffff',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                    boxShadow: '10px 10px 20px #d1d4db, -10px -10px 20px #ffffff',
                    transform: 'translateY(-1px)'
                },
                minHeight: '140px'
            }}
        >
            {!showNoData && (
                <>
                    <Typography variant='h4' sx={{ wordBreak: 'break-word' }}>
                        {productName ?? ''}
                    </Typography>
                    <Divider sx={{ borderColor: 'primary.main', marginTop: 0.5 }} />
                </>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 4 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5
                        }}
                    >
                        {showNoData ? (
                            <Typography variant='body2' sx={{ color: '#5A5A5A', fontWeight: 'bold' }}>
                                NO Data
                            </Typography>
                        ) : (
                            data.map(({ label, value, sx }) => (
                                <Box
                                    key={label}
                                    sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 0.5,
                                        ...(sx || {})
                                    }}
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
                                        sx={{
                                            color: '#3E3E3E',
                                            wordBreak: 'break-word',
                                            flex: 1
                                        }}
                                    >
                                        {value || 'N/A'}
                                    </Typography>
                                </Box>
                            ))
                        )}
                    </Box>
                </Box>
            </Box>
        </Paper>
    )
}

ProductDetails.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    data: PropTypes.array,
    productName: PropTypes.string,
    showNoData: PropTypes.bool
}
