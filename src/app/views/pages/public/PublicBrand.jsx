import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'
import { BarChart2 } from 'lucide-react'
import { GREEN_BRIGHT, INK } from './publicTheme'

/** The product's mark and name — on a dark background by default, on a light one with `dark={false}`. */
export default function PublicBrand({ dark = true, size = 'md' }) {
    const big = size === 'lg'
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
                sx={{
                    display: 'flex',
                    p: big ? 1.1 : 0.9,
                    borderRadius: '10px',
                    bgcolor: dark ? 'rgba(255,255,255,0.12)' : '#1c2d45',
                    border: '1px solid',
                    borderColor: dark ? 'rgba(255,255,255,0.18)' : 'transparent'
                }}
            >
                <BarChart2 color='white' size={big ? 22 : 18} />
            </Box>
            <Typography
                sx={{
                    fontWeight: 800,
                    letterSpacing: '-0.3px',
                    fontSize: big ? '1.35rem' : '1.1rem',
                    color: dark ? '#fff' : INK
                }}
            >
                Travelytics
                <Box component='span' sx={{ color: GREEN_BRIGHT }}>
                    .cloud
                </Box>
            </Typography>
        </Box>
    )
}

PublicBrand.propTypes = { dark: PropTypes.bool, size: PropTypes.oneOf(['md', 'lg']) }
