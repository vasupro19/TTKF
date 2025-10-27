/* eslint-disable react/forbid-prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'

/**
 * A reusable badge component that displays different statuses with customizable styles.
 *
 * @component
 * @example
 * // Renders a success badge with the label "Active"
 * <SoftStatusBadge type="success" label="Active" />
 *
 * @param {Object} props - The component props.
 * @param {string} props.type - The status type, determining the badge's color.
 * @param {string} props.label - The text label displayed on the badge.
 * @param {JSX.Element} [props.icon=null] - Optional icon to display inside the badge.
 * @param {Object} [props.customSx={}] - Custom styles to override default styling.
 * @returns {JSX.Element} A styled badge component.
 */
function SoftStatusBadge({ type, label, icon = null, customSx = {} }) {
    /**
     * Determines the background color, text color, and border style based on the type.
     *
     * @param {string} typeVal - The type of badge.
     * @returns {Object} Style properties for the badge.
     */
    const getBadgeStyle = typeVal => {
        switch (typeVal) {
            case 'success':
                return { bgColor: '#E0F2E7', textColor: '#35B47E', borderStyle: '0.2px solid #35B47E' }
            case 'danger':
                return { bgColor: '#FEE7DC', textColor: '#B34742', borderStyle: '0.2px solid #E74C3C' }
            case 'info':
                return { bgColor: '#E3F7FC', textColor: '#2980B9', borderStyle: '0.2px solid #2980B9' }
            case 'alert':
                return { bgColor: '#FFF4E0', textColor: '#E67E22', borderStyle: '0.2px solid #E67E22' }
            case 'warning':
                return { bgColor: '#FFF9E1', textColor: '#F1C40F', borderStyle: '0.2px solid #F1C40F' }
            case 'purple':
                return { bgColor: '#F2E6FF', textColor: '#8E44AD', borderStyle: '0.2px solid #8E44AD' }
            case 'orange':
                return { bgColor: '#FFEDD9', textColor: '#D35400', borderStyle: '0.2px solid #D35400' }
            case 'indigo':
                return { bgColor: '#EDE7F6', textColor: '#5E35B1', borderStyle: '0.2px solid #5E35B1' }
            case 'cyan':
                return { bgColor: '#E0F7FA', textColor: '#0097A7', borderStyle: '0.2px solid #0097A7' }
            case 'lime':
                return { bgColor: '#F1F8E9', textColor: '#7CB342', borderStyle: '0.2px solid #7CB342' }
            case 'deepOrange':
                return { bgColor: '#FBE9E7', textColor: '#E64A19', borderStyle: '0.2px solid #E64A19' }
            default:
                return { bgColor: '#E0E0E0', textColor: '#000000', borderStyle: '0.2px solid black' }
        }
    }

    const { bgColor, textColor } = getBadgeStyle(type)

    return (
        <Box
            sx={{
                backgroundColor: bgColor,
                color: textColor,
                borderRadius: '8px',
                width: 'max-content',
                height: '1.25rem',
                fontWeight: '600',
                paddingX: 1.2,
                ...customSx
            }}
            // icon={icon ? React.cloneElement(icon, { style: { color: textColor } }) : null}
            // size='small'
        >
            {label}
        </Box>
    )
}

SoftStatusBadge.propTypes = {
    type: PropTypes.oneOf([
        'success',
        'danger',
        'info',
        'alert',
        'warning',
        'purple',
        'orange',
        'indigo',
        'cyan',
        'lime',
        'deepOrange',
        'default'
    ]).isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.element,
    customSx: PropTypes.object
}

export default SoftStatusBadge
