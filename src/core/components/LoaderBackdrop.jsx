import { Backdrop, Box, CircularProgress } from '@mui/material'
import PropTypes from 'prop-types'

export default function LoaderBackdrop({ loading, text = 'Loading...' }) {
    return (
        <Backdrop
            sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                zIndex: theme => theme.zIndex.drawer + 1,
                position: 'absolute',
                backdropFilter: 'blur(1px)',
                borderRadius: '8px'
            }}
            open={loading}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                {text}
                <CircularProgress color='primary' size={40} thickness={4} />
            </Box>
        </Backdrop>
    )
}

LoaderBackdrop.propTypes = {
    loading: PropTypes.bool.isRequired,
    text: PropTypes.string
}
