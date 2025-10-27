/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/forbid-prop-types */
import React from 'react'
import { Typography, Tooltip } from '@mui/material'
import PropTypes from 'prop-types'

/**
 * TruncatedText - A reusable component that displays text with customizable truncation
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.text - The text content to display (required)
 * @param {string} [props.fallback='-'] - Fallback text to display if text is empty
 * @param {number} [props.lineClamp=2] - Number of lines before truncation occurs
 * @param {string|number} [props.maxWidth='300px'] - Maximum width of the text container
 * @param {string} [props.tooltipPlacement='top'] - Placement of the tooltip
 * @param {boolean} [props.showTooltip=true] - Whether to show tooltip on hover
 * @param {Object} [props.typographyProps={}] - Additional props for MUI Typography component
 * @param {Object} [props.tooltipProps={}] - Additional props for MUI Tooltip component
 * @param {Object} [props.sx={}] - Additional sx styles to apply to Typography
 * @returns {React.ReactElement} The TruncatedText component
 */
function TruncatedText({
    text,
    fallback = '-',
    lineClamp = 2,
    maxWidth = '300px',
    tooltipPlacement = 'top',
    showTooltip = true,
    typographyProps = {},
    tooltipProps = {},
    sx = {}
}) {
    const displayText = text || fallback

    const textComponent = (
        <Typography
            {...typographyProps}
            sx={{
                color: 'text.dark',
                fontWeight: '500',
                fontSize: '12px',
                maxWidth,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: lineClamp,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.5,
                height: 'auto',
                ...sx
            }}
        >
            {displayText}
        </Typography>
    )

    // If showTooltip is false or text is empty/equals fallback, return just the Typography
    if (!showTooltip || !text || text === fallback) {
        return textComponent
    }

    // Otherwise wrap in Tooltip
    return (
        <Tooltip title={displayText} placement={tooltipPlacement} arrow {...tooltipProps}>
            {textComponent}
        </Tooltip>
    )
}

TruncatedText.propTypes = {
    text: PropTypes.string,
    fallback: PropTypes.string,
    lineClamp: PropTypes.number,
    maxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tooltipPlacement: PropTypes.string,
    showTooltip: PropTypes.bool,
    typographyProps: PropTypes.object,
    tooltipProps: PropTypes.object,
    sx: PropTypes.object
}

export default TruncatedText
