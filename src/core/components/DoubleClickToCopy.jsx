import { Tooltip, Typography } from '@mui/material'
import { useRef, useEffect, useState, useCallback, useMemo } from 'react'

// ** import from redux
import { useDispatch } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'

// ** import propTypes
import PropTypes from 'prop-types'

// Custom hook for detecting text overflow with debounce
const useTextOverflow = (value, typographySx) => {
    const textRef = useRef(null)
    const [isOverflowing, setIsOverflowing] = useState(false)
    const timeoutRef = useRef(null)

    // More accurate text measurement using Canvas API for showing tooltip only when necessary otherwise it conflicts with our contextmenu
    const checkTextOverflow = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            if (textRef.current) {
                const element = textRef.current
                const styles = window.getComputedStyle(element)

                // Get the actual text measurement using Canvas
                const canvas = document.createElement('canvas')
                const context = canvas.getContext('2d')
                context.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`
                const textWidth = context.measureText(value).width

                // Container width with some padding for safety
                const containerWidth = element.clientWidth - 1

                // Compare actual text width with container width
                const shouldShowTooltip = textWidth > containerWidth

                if (isOverflowing !== shouldShowTooltip) {
                    setIsOverflowing(shouldShowTooltip)
                }
            }
        }, 100) // Small debounce
    }, [isOverflowing, value])

    useEffect(() => {
        checkTextOverflow()

        const resizeObserver = new ResizeObserver(() => {
            checkTextOverflow()
        })

        if (textRef.current) {
            resizeObserver.observe(textRef.current)
        }

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            resizeObserver.disconnect()
        }
    }, [value, typographySx, checkTextOverflow])

    return { textRef, isOverflowing }
}

function DoubleClickToCopy({ value, typographySx }) {
    const dispatch = useDispatch()
    const { textRef, isOverflowing } = useTextOverflow(value, typographySx)

    const handleDoubleClick = useCallback(() => {
        navigator.clipboard.writeText(value).then(() => {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Text copied!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        })
    }, [value, dispatch])

    // Memoize the Typography style
    const mergedSx = useMemo(() => ({ ...typographySx }), [typographySx])

    // Only show tooltip if text is actually overflowing
    return (
        <Tooltip arrow title={value} disableHoverListener={!isOverflowing}>
            <Typography ref={textRef} noWrap onDoubleClick={handleDoubleClick} sx={mergedSx}>
                {value}
            </Typography>
        </Tooltip>
    )
}

// Add propTypes here
DoubleClickToCopy.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired, // The value to copy, string or number
    // eslint-disable-next-line react/forbid-prop-types
    typographySx: PropTypes.object // Optional style object for Typography
}

export default DoubleClickToCopy
