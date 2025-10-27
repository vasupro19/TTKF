/*eslint-disable */

import React, { forwardRef, useImperativeHandle } from 'react'
import { motion, useAnimation } from 'motion/react'

const DownloadAnimIcon = forwardRef((props, ref) => {
    const { shouldAnimate = false } = props
    const controls = useAnimation()

    // Expose the triggerAnimation method to the parent
    useImperativeHandle(ref, () => ({
        triggerAnimation: () => {
            if (shouldAnimate) {
                controls.start({ y: 2 })
            }
        },
        resetAnimation: () => {
            controls.start({ y: 0 })
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
                <polyline points='7 10 12 15 17 10' />
                <line x1='12' x2='12' y1='15' y2='3' />
            </motion.g>
        </motion.svg>
    )
})

export { DownloadAnimIcon }
