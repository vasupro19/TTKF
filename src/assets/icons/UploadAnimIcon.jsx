/*eslint-disable */

import React, { forwardRef, useImperativeHandle } from 'react'
import { motion, useAnimation } from 'motion/react'

const UploadAnimIcon = forwardRef((props, ref) => {
    const { shouldAnimate = false } = props
    const controls = useAnimation()

    // Expose methods to parent for animation control
    useImperativeHandle(ref, () => ({
        triggerAnimation: () => {
            if (shouldAnimate) {
                controls.start({ y: -2 }) // Arrow moves upwards
            }
        },
        resetAnimation: () => {
            controls.start({ y: 0 }) // Reset animation to default position
        }
    }))

    return (
        <motion.svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        >
            <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
            <motion.g
                animate={controls}
                initial={{ y: 0 }}
                transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 10,
                    mass: 1
                }}
            >
                <polyline points='17 8 12 3 7 8' /> {/* Upward arrow */}
                <line x1='12' y1='3' x2='12' y2='15' /> {/* Connecting line */}
            </motion.g>
        </motion.svg>
    )
})

export { UploadAnimIcon }
