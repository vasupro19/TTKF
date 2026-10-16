import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { initialsOf } from './companyFacts'

/**
 * The agency's mark: its logo on a clean white tile, or its initials on a soft tint when it has none (or the image
 * can't load). Used by the menu and the Company screen.
 */
function BrandMark({ name, logo, size = 40 }) {
    const [failed, setFailed] = useState(false)
    useEffect(() => setFailed(false), [logo])
    const showLogo = Boolean(logo) && !failed

    return (
        <Box
            data-testid='brand-mark'
            sx={theme => ({
                width: size,
                height: size,
                flexShrink: 0,
                borderRadius: `${Math.round(size / 4)}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: `1px solid ${showLogo ? theme.palette.divider : alpha(theme.palette.primary.main, 0.18)}`,
                backgroundColor: showLogo ? '#fff' : alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontSize: `${Math.round(size * 0.38)}px`,
                fontWeight: 700,
                letterSpacing: '0.02em',
                userSelect: 'none'
            })}
        >
            {showLogo ? (
                <Box
                    component='img'
                    src={logo}
                    alt={`${name || 'Company'} logo`}
                    onError={() => setFailed(true)}
                    sx={{ width: '100%', height: '100%', objectFit: 'contain', p: `${Math.round(size / 10)}px` }}
                />
            ) : (
                initialsOf(name)
            )}
        </Box>
    )
}

BrandMark.propTypes = {
    name: PropTypes.string,
    logo: PropTypes.string,
    size: PropTypes.number
}

export default BrandMark
