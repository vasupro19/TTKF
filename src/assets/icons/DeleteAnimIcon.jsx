/*eslint-disable */

import React, { forwardRef, useImperativeHandle } from 'react'
import { motion, useAnimationControls } from 'framer-motion'

const DeleteAnimIcon = forwardRef((props, ref) => {
    const { shouldAnimate = false, animateOnHover = false, stroke = 'currentColor' } = props
    const controls = useAnimationControls()

    // Expose animation controls to parent
    useImperativeHandle(ref, () => ({
        triggerAnimation: () => {
            if (shouldAnimate) {
                controls.start({ y: -1 })
            }
        },
        resetAnimation: () => {
            controls.start({ y: 1 })
        }
    }))

    const handleHoverStart = () => {
        if (animateOnHover) {
            controls.start({ y: -1 })
        }
    }

    const handleHoverEnd = () => {
        if (animateOnHover) {
            controls.start({ y: 0 })
        }
    }

    return (
        <motion.svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke={stroke}
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            onHoverStart={handleHoverStart}
            onHoverEnd={handleHoverEnd}
        >
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
                <path d='M3 6h18' />
                <path d='M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' />
            </motion.g>
            <motion.path
                d='M19 8v12c0 1-1 2-2 2H7c-1 0-2-1-2-2V8'
                animate={controls}
                transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 10,
                    mass: 1
                }}
            />
            <motion.line
                x1='10'
                x2='10'
                y1='11'
                y2='17'
                animate={controls}
                transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 10,
                    mass: 1
                }}
            />
            <motion.line
                x1='14'
                x2='14'
                y1='11'
                y2='17'
                animate={controls}
                transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 10,
                    mass: 1
                }}
            />
        </motion.svg>
    )
})

export { DeleteAnimIcon }