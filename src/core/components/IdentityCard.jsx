/* eslint-disable */
import React from 'react'
import { Paper, Box, Typography } from '@mui/material'

import placeholderImg from '@assets/images/placeholder-image.webp'

export default function IdentityCard({ data = [], images = [], showImageOnTop = false, showProfileImage = false }) {
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
                minHeight: '9rem'
            }}
        >
            {showImageOnTop && (
                <Box
                    sx={{
                        mb: 2,
                        overflow: 'hidden',
                        width: '100%',
                        height: '180px',
                        border: '1px solid',
                        borderColor: 'grey.borderLight'
                    }}
                >
                    <img
                        src={images?.[0]?.url ?? placeholderImg}
                        alt={`ImageProduct`}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: images?.[0]?.url ? 'contain' : 'cover'
                        }}
                    />
                </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* Left Section */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 4 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                        }}
                    >
                        {data.map(({ label, value, sx }) => (
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
                        ))}
                    </Box>
                </Box>

                {/* Right Section: Profile Icon */}
                {!showImageOnTop && showProfileImage && (
                    <Box
                        sx={{
                            width: '100%',
                            maxWidth: '100px',
                            height: 'auto',
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            flexDirection: 'column'
                        }}
                    >
                        <img
                            src='https://archive.org/download/instagram-plain-round/instagram%20plain%20round.jpg'
                            alt='dummyImg'
                            style={{
                                width: '80%',
                                height: 'auto',
                                borderRadius: '50%',
                                background: 'linear-gradient(145deg, #dcdfe3, #ffffff)',
                                boxShadow: 'inset 6px 6px 10px #d1d4db, inset -6px -6px 10px #ffffff'
                            }}
                        />
                    </Box>
                )}
            </Box>
        </Paper>
    )
}
