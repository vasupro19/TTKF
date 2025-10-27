/*eslint-disable */

import React, { forwardRef, useImperativeHandle } from 'react'
import { motion, useAnimationControls } from 'framer-motion'

const ChevronRightAnimIcon = forwardRef((props, ref) => {
    const { shouldAnimate = false, animateOnHover = false, stroke = 'currentColor', size = 24 } = props
    const controls = useAnimationControls()

    // Expose animation controls to parent
    useImperativeHandle(ref, () => ({
        triggerAnimation: () => {
            if (shouldAnimate) {
                controls.start({ x: 2 })
            }
        },
        resetAnimation: () => {
            controls.start({ x: 0 })
        }
    }))

    const handleHoverStart = () => {
        if (animateOnHover) {
            controls.start({ x: 2 })
        }
    }

    const handleHoverEnd = () => {
        if (animateOnHover) {
            controls.start({ x: 0 })
        }
    }

    const defaultTransition = {
        times: [0, 0.4, 1],
        duration: 0.5,
        type: 'spring',
        stiffness: 200,
        damping: 10,
        mass: 1
    }

    return (
        <motion.svg
            xmlns='http://www.w3.org/2000/svg'
            width={size}
            height={size}
            viewBox='0 0 24 24'
            fill='none'
            stroke={stroke}
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            onHoverStart={handleHoverStart}
            onHoverEnd={handleHoverEnd}
        >
            <motion.path d='m9 18 6-6-6-6' animate={controls} initial={{ x: 0 }} transition={defaultTransition} />
        </motion.svg>
    )
})

ChevronRightAnimIcon.displayName = 'ChevronRightAnimIcon'

export { ChevronRightAnimIcon }
