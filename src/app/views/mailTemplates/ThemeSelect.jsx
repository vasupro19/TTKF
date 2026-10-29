import PropTypes from 'prop-types'
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material'

// ? the value of the "follow the theme for all emails" choice: a select can't hold null
const FOLLOW = ''

/** @description a theme's colours as a row of dots, so a theme is told apart at a glance */
export function ThemeSwatch({ colors = [], size = 12 }) {
    return (
        <Stack direction='row' spacing={0.5} aria-hidden='true' sx={{ flexShrink: 0 }}>
            {colors.map((color, index) => (
                <Box
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    sx={{
                        width: size,
                        height: size,
                        borderRadius: '50%',
                        bgcolor: color,
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                />
            ))}
        </Stack>
    )
}

ThemeSwatch.propTypes = { colors: PropTypes.arrayOf(PropTypes.string), size: PropTypes.number }

/**
 * Which theme an email is drawn in: colours and layout only, never its words. `themes` comes from the server
 * ([{ key, label, description, swatch }]). With `followLabel`, the first choice is "follow the theme for all emails" (value '');
 * `onChange` gets the theme's key, or '' for that.
 */
function ThemeSelect({
    themes,
    value,
    onChange,
    label = 'Theme',
    followLabel = '',
    disabled = false,
    size = 'small',
    sx = {}
}) {
    const byKey = Object.fromEntries(themes.map(theme => [theme.key, theme]))
    const known = value === FOLLOW ? Boolean(followLabel) : Boolean(byKey[value])
    return (
        <TextField
            select
            size={size}
            label={label}
            value={known ? value : ''}
            disabled={disabled || !themes.length}
            onChange={event => onChange(event.target.value)}
            sx={{ minWidth: 200, ...sx }}
            // ? the "follow" choice has the empty value, which MUI takes for no value and lays the label over it
            InputLabelProps={followLabel ? { shrink: true } : undefined}
            SelectProps={{
                renderValue: selected => {
                    const theme = byKey[selected]
                    if (!theme) return followLabel
                    return (
                        <Stack direction='row' spacing={1} alignItems='center'>
                            <ThemeSwatch colors={theme.swatch} />
                            <span>{theme.label}</span>
                        </Stack>
                    )
                },
                displayEmpty: Boolean(followLabel)
            }}
        >
            {followLabel ? <MenuItem value={FOLLOW}>{followLabel}</MenuItem> : null}
            {themes.map(theme => (
                <MenuItem key={theme.key} value={theme.key} sx={{ alignItems: 'flex-start', py: 1 }}>
                    <Stack direction='row' spacing={1.25} alignItems='flex-start'>
                        <Box sx={{ pt: 0.5 }}>
                            <ThemeSwatch colors={theme.swatch} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{theme.label}</Typography>
                            <Typography
                                color='text.secondary'
                                sx={{ fontSize: '0.75rem', whiteSpace: 'normal', maxWidth: 300 }}
                            >
                                {theme.description}
                            </Typography>
                        </Box>
                    </Stack>
                </MenuItem>
            ))}
        </TextField>
    )
}

ThemeSelect.propTypes = {
    themes: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            label: PropTypes.string,
            description: PropTypes.string,
            swatch: PropTypes.arrayOf(PropTypes.string)
        })
    ).isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    label: PropTypes.string,
    followLabel: PropTypes.string,
    disabled: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium']),
    sx: PropTypes.shape({})
}

export default ThemeSelect
