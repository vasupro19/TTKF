import React, { useRef } from 'react'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import PropTypes from 'prop-types'
import { Tooltip, useTheme } from '@mui/material'

/**
 * CustomButton component for rendering a Material-UI Button with additional customizations.
 *
 * @param {Object} props - The properties object.
 * @param {string} props.text - The text to be displayed on the button. If children are provided, this prop is ignored.
 * @param {'text' | 'outlined' | 'contained' | 'clickable' | 'loading'} [props.variant='contained'] - The variant of the button.
 * @param {'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'} [props.color='primary'] - The color of the button.
 * @param {React.ReactElement} [props.startIcon] - The icon to display before the text or children.
 * @param {React.ReactElement} [props.endIcon] - The icon to display after the text or children.
 * @param {Function} [props.onClick=()=>{}] - Callback function to handle button click.
 * @param {boolean} [props.disabled=false] - Disable the button if true.
 * @param {boolean} [props.loading=false] - Show a spinner if true.
 * @param {Object} [props.customStyles={}] - Additional styles to apply to the button.
 * @param {Object} [props.sx={}] - MUI sx styles to apply to the button.
 * @param {React.ReactNode} [props.children] - Content to display inside the button. Overrides `text` prop.
 * @param {'button' | 'submit' | 'reset'} [props.type='button'] - Specifies the button's type attribute.
 * @returns {React.JSX.Element} The rendered button component.
 */
export default function CustomButton({
    text,
    variant = 'contained',
    color = 'primary',
    startIcon = null,
    endIcon = null,
    onClick = () => {},
    disabled = false,
    loading = false,
    customStyles = {},
    sx = {},
    children,
    type = 'button',
    disableRipple = false,
    shouldAnimate = false,
    clickable = false,
    tooltip = '',
    showTooltip = false
}) {
    const theme = useTheme() // Access the theme to use colors

    const isClickable = clickable || variant === 'clickable' // pass clickable or as variant or prop
    const isLoading = loading

    const clickableShadow = {
        boxShadow: '0px 4px 6px -2px rgba(0, 0, 0, 0.2)',
        transition: 'box-shadow 0.2s, transform 0.090s',
        ':active': {
            transform: 'translateY(0.4px)'
        },
        ':focus': {
            outlineOffset: '2px'
        }
    }

    // Force loading variant to be contained and primary
    /* eslint-disable */
    const buttonVariant = variant == 'clickable' || variant == 'loading' ? 'contained' : variant
    /* eslint-enable */

    const buttonColor = isLoading ? 'primary' : color

    // ** functions enable icons to animate
    const startIconRef = useRef()
    const endIconRef = useRef()

    const handleMouseEnter = () => {
        // Trigger animation only for icons that support it
        if (startIconRef.current && startIconRef.current.triggerAnimation) {
            startIconRef.current.triggerAnimation()
        }
        if (endIconRef.current && endIconRef.current.triggerAnimation) {
            endIconRef.current.triggerAnimation()
        }
    }

    const handleMouseLeave = () => {
        // Optionally reset animations on mouse leave
        if (startIconRef.current && startIconRef.current.resetAnimation) {
            startIconRef.current.resetAnimation()
        }
        if (endIconRef.current && endIconRef.current.resetAnimation) {
            endIconRef.current.resetAnimation()
        }
    }

    const buttonElement = (
        <Button
            variant={buttonVariant}
            color={buttonColor}
            startIcon={
                loading ? (
                    <CircularProgress size={20} color='inherit' />
                ) : (
                    startIcon && React.cloneElement(startIcon, { ref: startIconRef, shouldAnimate })
                )
            }
            endIcon={endIcon ? React.cloneElement(endIcon, { ref: endIconRef, shouldAnimate }) : null}
            onClick={onClick}
            disabled={disabled || loading}
            type={type}
            disableRipple={disableRipple}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            sx={{
                ...(isClickable ? clickableShadow : {}),
                '&.Mui-disabled': isLoading
                    ? {
                          backgroundColor: theme.palette.primary.main, // Use primary color for loading
                          opacity: 0.5, // Adjust opacity to your liking
                          color: theme.palette.primary.contrastText // Ensure text is readable
                      }
                    : {},
                ...customStyles,
                ...sx
            }}
        >
            {children || text}
        </Button>
    )

    // Wrap disabled buttons in span for tooltip functionality
    const wrappedButton = disabled ? <span style={{ display: 'inline-flex' }}>{buttonElement}</span> : buttonElement

    return tooltip ? (
        <Tooltip
            title={tooltip}
            disableHoverListener={!showTooltip}
            disableFocusListener={!showTooltip}
            disableTouchListener={!showTooltip}
            arrow
        >
            {wrappedButton}
        </Tooltip>
    ) : (
        wrappedButton
    )
}

CustomButton.propTypes = {
    text: PropTypes.string,
    variant: PropTypes.oneOf(['text', 'outlined', 'contained', 'clickable', 'loading']),
    color: PropTypes.oneOf(['primary', 'secondary', 'error', 'info', 'success', 'warning']),
    clickable: PropTypes.bool,
    startIcon: PropTypes.element,
    endIcon: PropTypes.element,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    disableRipple: PropTypes.bool,
    shouldAnimate: PropTypes.bool,
    customStyles: PropTypes.shape({}),
    // eslint-disable-next-line react/forbid-prop-types
    sx: PropTypes.object,
    children: PropTypes.node,
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
    tooltip: PropTypes.string,
    showTooltip: PropTypes.bool
}
