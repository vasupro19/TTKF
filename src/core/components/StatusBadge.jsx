/* eslint-disable react/forbid-prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import { Chip } from '@mui/material'

/**
 * A reusable badge component that displays different statuses with customizable styles.
 *
 * @component
 * @example
 * // Renders a success badge with the label "Active"
 * <StatusBadge type="success" label="Active" />
 *
 * @param {Object} props - The component props.
 * @param {string} props.type - The status type, determining the badge's color.
 * @param {string} props.label - The text label displayed on the badge.
 * @param {JSX.Element} [props.icon=null] - Optional icon to display inside the badge.
 * @param {Object} [props.customSx={}] - Custom styles to override default styling.
 * @returns {JSX.Element} A styled badge component.
 */
function StatusBadge({ type, label, icon = null, customSx = {}, onClick }) {
    /**
     * Determines the background color, text color, and border style based on the type.
     *
     * @param {string} typeVal - The type of badge.
     * @returns {Object} Style properties for the badge.
     */
    const getBadgeStyle = typeVal => {
        switch (typeVal) {
            case 'success':
                return { bgColor: '#E6F4EA', textColor: '#2E7D32', borderStyle: '0.2px solid rgba(46, 125, 50, 0.1)' }
            case 'danger':
                return { bgColor: '#FFE4E4', textColor: '#E74C3C', borderStyle: '0.2px solid rgba(231, 76, 60, 0.1)' }
            case 'info':
                return { bgColor: '#D9E4FF', textColor: '#0025A1', borderStyle: '0.2px solid rgba(0, 37, 161, 0.1)' }
            case 'alert':
                return { bgColor: '#FFF3CD', textColor: '#856404', borderStyle: '0.2px solid rgba(133, 100, 4, 0.1)' }
            case 'warning':
                return { bgColor: '#FFF9E6', textColor: '#F59F00', borderStyle: '0.2px solid rgba(245, 159, 0, 0.1)' }
            case 'purple':
                return { bgColor: '#F3E5F5', textColor: '#7B1FA2', borderStyle: '0.2px solid rgba(123, 31, 162, 0.1)' }
            case 'orange':
                return { bgColor: '#FFF0E6', textColor: '#F57C00', borderStyle: '0.2px solid rgba(245, 124, 0, 0.1)' }
            case 'indigo':
                return { bgColor: '#E8EAF6', textColor: '#3949AB', borderStyle: '0.2px solid rgba(57, 73, 171, 0.1)' }
            case 'cyan':
                return { bgColor: '#E0F7FA', textColor: '#00ACC1', borderStyle: '0.2px solid rgba(0, 172, 193, 0.1)' }
            case 'lime':
                return { bgColor: '#F9FBE7', textColor: '#827717', borderStyle: '0.2px solid rgba(130, 119, 23, 0.1)' }
            case 'deepOrange':
                return { bgColor: '#FBE9E7', textColor: '#D84315', borderStyle: '0.2px solid rgba(216, 67, 21, 0.1)' }
            default:
                return { bgColor: '#E0E0E0', textColor: '#000000', borderStyle: '0.2px solid rgba(0, 0, 0, 0.1)' }
        }
    }

    const { bgColor, textColor, borderStyle } = getBadgeStyle(type)

    return (
        <Chip
            label={label}
            sx={{
                backgroundColor: bgColor,
                color: textColor,
                borderRadius: '16px',
                border: borderStyle,
                paddingX: 1.5,
                height: '20px',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': {
                    backgroundColor: bgColor // Prevent hover color change
                },
                ...customSx
            }}
            icon={icon ? React.cloneElement(icon, { style: { color: textColor } }) : null}
            size='small'
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...(onClick ? { onClick } : {})} // Only apply onClick if it exists
        />
    )
}

StatusBadge.propTypes = {
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

export default StatusBadge
