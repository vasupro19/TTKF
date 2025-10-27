/* eslint-disable */
import React, { forwardRef, useImperativeHandle } from 'react'
import { SvgIcon, Box } from '@mui/material'
import { motion, useAnimation } from 'framer-motion'

const pathVariants = {
    normal: { d: 'M5 12h14' },
    animate: {
        d: ['M5 12h14', 'M5 12h9', 'M5 12h14'],
        transition: {
            duration: 0.4
        }
    }
}

const secondaryPathVariants = {
    normal: { d: 'm12 5 7 7-7 7', translateX: 0 },
    animate: {
        d: 'm12 5 7 7-7 7',
        translateX: [0, -3, 0],
        transition: {
            duration: 0.4
        }
    }
}

const RightArrowAnimIcon = forwardRef((props, ref) => {
    const { shouldAnimate = false } = props
    const controls = useAnimation()

    // Expose methods to parent for animation control
    useImperativeHandle(ref, () => ({
        triggerAnimation: () => {
            if (shouldAnimate) {
                controls.start('animate') // Trigger the Framer Motion animation
            }
        },
        resetAnimation: () => {
            controls.start('normal') // Reset the animation to default state
        }
    }))

    const boxStyle = {
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '8px',
        transition: 'background-color 0.2s ease-in-out',
        ':hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.1)'
        }
    }

    const pathStyle = {
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
    }

    return (
        <Box sx={boxStyle}>
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
                {/* Horizontal line animation */}
                <motion.path
                    d='M5 12h14'
                    variants={pathVariants}
                    animate={controls}
                    initial="normal"
                    style={pathStyle}
                />
                {/* Arrow animation */}
                <motion.path
                    d='m12 5 7 7-7 7'
                    variants={secondaryPathVariants}
                    animate={controls}
                    initial="normal"
                    style={pathStyle}
                />
            </motion.svg>
        </Box>
    )
})

export { RightArrowAnimIcon }
