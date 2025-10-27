/* eslint-disable */

import React, { forwardRef, useImperativeHandle } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { Box, SvgIcon } from '@mui/material'

const ClockAnimIcon = forwardRef((props, ref) => {
    const { size = 18, stroke = 'currentColor' } = props
    const hourHandControls = useAnimationControls()
    const minuteHandControls = useAnimationControls()

    const handTransition = {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
      }
      
      const handVariants = {
        normal: { rotate: 0, originX: '-50%', originY: '50%' },
        animate: { rotate: 360 },
      }
      
      const minuteHandTransition = {
        duration: 0.5,
        ease: 'easeInOut',
      }
      
      const minuteHandVariants = {
        normal: { rotate: 0, originX: '-50%', originY: '50%' },
        animate: { rotate: 45 },
      }
    // Expose animation controls to parent
    useImperativeHandle(ref, () => ({
        triggerAnimation: () => {
            hourHandControls.start({ rotate: 360 }) // Slower movement (e.g., 30°)
            minuteHandControls.start({ rotate: 360 }) // Faster movement (e.g., 180°)
        },
        resetAnimation: () => {
            hourHandControls.start({ rotate: 0 })
            minuteHandControls.start({ rotate: 0 })
        }
    }))


    return (
        <Box
            sx={{
                cursor: 'pointer',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.1)' }
            }}
            {...props}
        >
            <SvgIcon sx={{ width: size, height: size }} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke={stroke} strokeWidth="2" fill="none" />
                
                {/* Hour Hand (Slower Rotation) */}
                <motion.line
                    x1="12"
                    y1="12"
                    x2="12"
                    y2="7"
                    stroke={stroke}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    variants={handVariants}
                    animate={hourHandControls}
                    initial={{ rotate: 0 }}
                    transition={handTransition}
                />
                
                {/* Minute Hand (Faster Rotation) */}
                <motion.line
                    x1="12"
                    y1="12"
                    x2="16"
                    y2="12"
                    stroke={stroke}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    variants={minuteHandVariants}
                    animate={minuteHandControls}
                    transition={minuteHandTransition}
                    initial={{ rotate: 0 }}
                />
            </SvgIcon>
        </Box>
    )
})

export { ClockAnimIcon }
