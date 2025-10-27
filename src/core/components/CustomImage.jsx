import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import placeholderImg from '@assets/images/placeholder-image.webp'

export default function CustomImage({ src, alt, styles, props }) {
    const [imgSrc, setImgSrc] = useState(src || placeholderImg)

    useEffect(() => {
        if (!src) {
            setImgSrc(placeholderImg)
        }
    }, [src])

    const handleError = () => {
        setImgSrc(placeholderImg)
    }

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <Box component='img' loading='lazy' src={imgSrc} alt={alt} sx={styles} onError={handleError} {...props} />
}

CustomImage.propTypes = {
    src: PropTypes.string.isRequired,
    alt: PropTypes.string.isRequired,
    styles: PropTypes.shape({}),
    props: PropTypes.shape({})
}
