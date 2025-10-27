import React from 'react'
import PropTypes from 'prop-types'
import './arrowButton.css'

/**
 * ArrowButton component renders a styled button using a unique polygon clip path. It supports multiple visual variants,
 * and it can optionally be made non-clickable (with no pointer cursor).
 *
 * @component
 *
 * @param {Object} props - The component props.
 * @param {string} [props.variant='blue'] - The variant of the button styling. Options: "blue", "green", "orange".
 * @param {string} props.label - The text label displayed inside the button. This is required.
 * @param {Function} [props.onClick=() => {}] - The function to call when the button is clicked.
 * @param {boolean} [props.nonClickable=false] - If `true`, makes the button visually and functionally non-clickable (no pointer cursor and no hover effects).
 * @param {Object} [props.customStyles] - Custom styles to apply to the button.
 * @returns {JSX.Element} The styled button.
 *
 * @example
 * ```jsx
 * // Example of a clickable button
 * <ArrowButton
 *   variant="blue"
 *   label="Click Me"
 *   onClick={() => alert('Button clicked!')}
 * />
 *
 * // Example of a non-clickable button
 * <ArrowButton
 *   variant="green"
 *   label="Static Button"
 *   nonClickable={true}
 * />
 * ```
 */
function ArrowButton({ variant = 'blue', label, onClick = () => {}, nonClickable = false, customStyles = {} }) {
    // List of supported button variants
    const supportedVariants = ['blue', 'green', 'orange', 'red', 'purple', 'gray']

    // Validate the provided variant and default to 'blue' if unsupported
    const finalVariant = supportedVariants.includes(variant) ? variant : 'blue'

    // Define className dynamically based on passed props
    const className = `arrow-button ${finalVariant} ${nonClickable ? 'non-clickable' : ''}`

    // If non-clickable, disable the onClick functionality
    const handleClick = nonClickable ? () => {} : onClick

    return (
        <button
            type='button'
            className={className}
            onClick={handleClick} // Event handler is conditionally disabled
            style={{ ...customStyles }} // Spread the style prop to allow custom styles
        >
            {label}
        </button>
    )
}

// PropTypes for type checking
ArrowButton.propTypes = {
    /**
     * The variant of the button which determines its background color and style.
     * Supported options: "blue", "green", "orange".
     */
    variant: PropTypes.string,

    /**
     * The text label to be displayed inside the button. This property is required.
     */
    label: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node // `node` includes strings, numbers, JSX, elements, and arrays of them
    ]).isRequired,

    /**
     * The function to be executed when the button is clicked.
     */
    onClick: PropTypes.func,

    /**
     * If `true`, makes the button visually non-clickable (removes pointer cursor and clickable effect).
     */
    nonClickable: PropTypes.bool,

    /**
     * Custom styles to apply to the button.
     */
    // eslint-disable-next-line react/forbid-prop-types
    customStyles: PropTypes.object
}

export default ArrowButton
