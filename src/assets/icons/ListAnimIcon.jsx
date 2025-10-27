/* eslint-disable react/prop-types */
import React, { forwardRef, useImperativeHandle } from 'react'
import { motion, useAnimation } from 'motion/react'
import Box from '@mui/material/Box'

const ListAnimIcon = forwardRef((props, ref) => {
    const { size = 16, className, shouldAnimate = false } = props
    const controls = useAnimation()

    useImperativeHandle(ref, () => ({
        triggerAnimation: () => {
            if (shouldAnimate) {
                controls.start({
                    scale: 1.2,
                    transition: {
                        type: 'spring',
                        stiffness: 200,
                        damping: 10,
                        scale: [1, 0.8, 1],
                        mass: 1
                    }
                })
            }
        },
        resetAnimation: () => {
            controls.start({
                scale: 1,
                transition: {
                    type: 'spring',
                    scale: [1, 0.9, 1],
                    stiffness: 200,
                    damping: 10
                }
            })
        }
    }))

    return (
        <Box
            sx={{
                cursor: 'pointer',
                userSelect: 'none',
                '&:hover': {
                    backgroundColor: 'accent.main'
                },
                transition: 'background-color 200ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            className={className}
        >
            <motion.svg
                xmlns='http://www.w3.org/2000/svg'
                width={size}
                height={size}
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
            >
                <motion.path
                    d='M4 10c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2'
                    animate={controls}
                    initial={{ scale: 1 }}
                    transition={{
                        delay: 0.3,
                        type: 'spring',
                        stiffness: 200,
                        damping: 10
                    }}
                />
                <motion.path
                    d='M10 16c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2'
                    animate={controls}
                    initial={{ scale: 1 }}
                    transition={{
                        delay: 0.2,
                        type: 'spring',
                        stiffness: 200,
                        damping: 10
                    }}
                />
                <motion.rect
                    width='8'
                    height='8'
                    x='14'
                    y='14'
                    rx='2'
                    animate={controls}
                    initial={{ scale: 1 }}
                    transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 10
                    }}
                />
            </motion.svg>
        </Box>
    )
})

export default ListAnimIcon
