/* eslint-disable */
import React, { forwardRef, useImperativeHandle } from 'react'
import { Box } from '@mui/material'
import { motion, useAnimation } from 'framer-motion'

const iconVariants = {
    normal: { rotate: '0deg' },
    animate: {
        rotate: ['0deg', '-50deg'],
        transition: {
            duration: 0.2,
            ease: 'easeInOut'
        }
    }
}

const RefreshAnimIcon = forwardRef((props, ref) => {
    const { shouldAnimate = false } = props
    const controls = useAnimation()

    useImperativeHandle(ref, () => ({
        triggerAnimation: () => {
            if (shouldAnimate) {
                controls.start('animate')
            }
        },
        resetAnimation: () => {
            controls.start('normal')
        }
    }))

    const boxStyle = {
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '8px',
        transition: 'background-color 0.2s ease-in-out'
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
                variants={iconVariants}
                animate={controls}
                initial='normal'
            >
                <path d='M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' />
                <path d='M3 3v5h5' />
                <path d='M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16' />
                <path d='M16 16h5v5' />
            </motion.svg>
        </Box>
    )
})

export { RefreshAnimIcon }