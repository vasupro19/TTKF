import PropTypes from 'prop-types'

// third-party
import { motion } from 'framer-motion'

// ==============================|| ANIMATION FOR CONTENT ||============================== //

function NavMotion({ children, sx }) {
    const motionVariants = {
        initial: {
            opacity: 0,
            scale: 0.99
        },
        in: {
            opacity: 1,
            scale: 1
        },
        out: {
            opacity: 0,
            scale: 0.99
        }
    }

    const motionTransition = {
        type: 'tween',
        ease: 'anticipate',
        duration: 0.4
    }

    return (
        <motion.div
            style={sx}
            initial='initial'
            animate='in'
            exit='out'
            variants={motionVariants}
            transition={motionTransition}
        >
            {children}
        </motion.div>
    )
}

NavMotion.propTypes = {
    children: PropTypes.node,
    // eslint-disable-next-line react/forbid-prop-types
    sx: PropTypes.object
}

export default NavMotion
