import PropTypes from 'prop-types'
import { ButtonBase, Stack } from '@mui/material'
import { alpha } from '@mui/material/styles'

/**
 * Small, quiet selection pills — the planner's only selection control, so every choice looks and behaves
 * the same way.
 */
export function Pill({ label, selected = false, onClick, ariaLabel = '' }) {
    return (
        <ButtonBase
            onClick={onClick}
            aria-pressed={selected}
            aria-label={ariaLabel || label}
            sx={theme => ({
                px: 1.75,
                py: 0.875,
                borderRadius: 999,
                border: '1px solid',
                borderColor: selected ? theme.palette.primary.main : theme.palette.divider,
                bgcolor: selected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                color: selected ? theme.palette.primary.main : theme.palette.text.primary,
                fontSize: '0.9375rem',
                fontWeight: selected ? 600 : 400,
                lineHeight: 1.4,
                transition: 'background-color 120ms, border-color 120ms',
                '&:hover': { borderColor: selected ? theme.palette.primary.main : theme.palette.text.secondary },
                '&.Mui-focusVisible': {
                    outline: `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                    outlineOffset: 2
                }
            })}
        >
            {label}
        </ButtonBase>
    )
}

Pill.propTypes = {
    label: PropTypes.string.isRequired,
    selected: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    ariaLabel: PropTypes.string
}

/**
 * @description pick one; picking the selected one again clears it (every choice here is optional)
 */
export function ChoicePills({ options, value, onChange, name }) {
    return (
        <Stack direction='row' flexWrap='wrap' useFlexGap spacing={1} role='group' aria-label={name}>
            {options.map(option => (
                <Pill
                    key={option.label}
                    label={option.label}
                    selected={value === option.value}
                    onClick={() => onChange(value === option.value && option.value !== '' ? '' : option.value)}
                />
            ))}
        </Stack>
    )
}

ChoicePills.propTypes = {
    options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })).isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired
}

/**
 * @description pick any number
 */
export function TagPills({ options, values, onChange, name }) {
    return (
        <Stack direction='row' flexWrap='wrap' useFlexGap spacing={1} role='group' aria-label={name}>
            {options.map(option => {
                const selected = values.includes(option)
                return (
                    <Pill
                        key={option}
                        label={option}
                        selected={selected}
                        onClick={() =>
                            onChange(selected ? values.filter(item => item !== option) : [...values, option])
                        }
                    />
                )
            })}
        </Stack>
    )
}

TagPills.propTypes = {
    options: PropTypes.arrayOf(PropTypes.string).isRequired,
    values: PropTypes.arrayOf(PropTypes.string).isRequired,
    onChange: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired
}
