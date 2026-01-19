import PropTypes from 'prop-types'
import { useMemo } from 'react'

// material-ui
import { CssBaseline, StyledEngineProvider } from '@mui/material'
import { createTheme, ThemeProvider } from '@mui/material/styles'

// project import
import Palette from './palette'
import Typography from './typography'

import componentStyleOverrides from './compStyleOverride'
import customShadows from './shadows'

export default function ThemeCustomization({ children }) {
    const borderRadius = 8
    // const fontFamily = `'Roboto', sans-serif`
    const fontFamily = `'Bookerly', sans-serif`
    const outlinedFilled = true

    const theme = Palette()

    const themeTypography = useMemo(
        () => Typography(theme, borderRadius, fontFamily),
        [theme, borderRadius, fontFamily]
    )
    const themeCustomShadows = useMemo(() => customShadows(theme), [theme])

    const themeOptions = useMemo(
        () => ({
            direction: 'ltr',
            palette: theme.palette,
            mixins: {
                toolbar: {
                    minHeight: '48px',
                    padding: '16px',
                    '@media (min-width: 600px)': {
                        minHeight: '48px'
                    }
                }
            },
            typography: themeTypography,
            customShadows: themeCustomShadows
        }),
        [theme, themeCustomShadows, themeTypography]
    )

    const themes = createTheme(themeOptions)
    themes.components = useMemo(
        () => componentStyleOverrides(themes, borderRadius, outlinedFilled),
        [themes, borderRadius, outlinedFilled]
    )

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={themes}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </StyledEngineProvider>
    )
}

ThemeCustomization.propTypes = {
    children: PropTypes.node
}
