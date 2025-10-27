import PropTypes from 'prop-types'
import { Link as RouterLink } from 'react-router-dom'
import LaunchIcon from '@mui/icons-material/Launch'
import { Box, Link } from '@mui/material'

/**
 * CustomLink component
 *
 * A reusable link component that provides custom styling
 * for color, hover, and active states. Optionally displays
 * a launch icon in the top right corner of the label if an icon prop is passed.
 *
 * @component
 * @param {string} href - The URL href which the link will navigate
 * @param {object} state - Optional state to pass along with the navigation
 * @param {object} sx - A style object for custom link styling
 * @param {React.ReactNode} children - The content inside the link
 * @param {boolean} icon - If true, displays a launch icon in the top right of the label
 * @returns {JSX.Element} Rendered link component
 */
function CustomLink({ href = '/', sx = {}, children, icon = false, state = null }) {
    return (
        <Link
            component={RouterLink}
            to={href}
            state={state}
            sx={{
                color: 'black',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                position: 'relative',
                '&:hover': {
                    color: 'blue !important',
                    textDecoration: 'underline'
                },
                '&:active': {
                    color: 'darkblue'
                },
                ...sx
            }}
            // just to restrict custom context menu
            onContextMenu={e => {
                e.stopPropagation()
            }}
        >
            {children}
            {icon && (
                <Box
                    component='span'
                    sx={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-1rem',
                        fontSize: '1rem',
                        color: 'inherit'
                    }}
                >
                    <LaunchIcon fontSize='inherit' />
                </Box>
            )}
        </Link>
    )
}

CustomLink.propTypes = {
    /**
     * The URL that the link navigates to
     */
    href: PropTypes.string.isRequired,
    /**
     * Style overrides for the link
     */
    // eslint-disable-next-line react/forbid-prop-types
    sx: PropTypes.object,
    /**
     * State to pass along with the navigation
     */
    // eslint-disable-next-line react/forbid-prop-types
    state: PropTypes.object,
    /**
     * Content to be displayed inside the link
     */
    children: PropTypes.node.isRequired,
    /**
     * Display launch icon in the top right if true
     */
    icon: PropTypes.bool
}

export default CustomLink
