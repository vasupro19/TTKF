import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import PropTypes from 'prop-types'

const CardContainer = styled('div')(({ theme }) => ({
    minWidth: 350,
    height: 180,
    perspective: '1000px',
    // Use theme breakpoints:
    [theme.breakpoints.down('sm')]: {
        width: '100%'
    },
    [theme.breakpoints.up('sm')]: {
        width: 'unset'
    }
}))

const CardInner = styled('div')(({ isflipped }) => ({
    width: '100%',
    height: '100%',
    position: 'relative',
    transformStyle: 'preserve-3d',
    transition: 'transform 0.999s',
    transform: isflipped ? 'rotateY(180deg)' : 'rotateY(0)'
}))

const CardFace = styled('div')({
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden'
})

const CardFront = styled(CardFace)({
    transform: 'rotateY(0deg)'
})

const CardBack = styled(CardFace)({
    transform: 'rotateY(180deg)'
})

export default function FlipCard({ front, back, isFlip, forceNoFlip }) {
    const [isFlipped, setIsFlipped] = useState(false)

    const handleClick = () => {
        if (isFlip && !forceNoFlip) return
        if (forceNoFlip) return
        setIsFlipped(prev => !prev)
    }

    return (
        <CardContainer onClick={handleClick}>
            <CardInner isflipped={isFlipped}>
                <CardFront>{front}</CardFront>
                <CardBack>{back}</CardBack>
            </CardInner>
        </CardContainer>
    )
}

FlipCard.propTypes = {
    front: PropTypes.node,
    back: PropTypes.node,
    isFlip: PropTypes.bool,
    forceNoFlip: PropTypes.bool
}
