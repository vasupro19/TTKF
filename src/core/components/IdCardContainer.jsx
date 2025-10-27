/* eslint-disable */
import React from 'react'
import { Paper, Box, Typography } from '@mui/material'

import placeholderImg from '@assets/images/placeholder-image.webp'

export default function IdCardContainer({ children }) {

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
                minHeight: {xs:'7rem',sm:'8rem'}
            }}
        >
           {children}
        </Paper>
    )
}
