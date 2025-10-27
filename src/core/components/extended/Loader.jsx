/* eslint-disable react/self-closing-comp */
import { Box, Typography } from '@mui/material'

import '@assets/styles/loader.css'

function Loader() {
    return (
        <Box className='splash-screen'>
            <Box className='loader'>
                <Box className='truckWrapper'>
                    <Box className='truckBody'>TTK</Box>
                </Box>
            </Box>

            <Box className='title-container'>
                <Typography component='h1' className='main-title'>
                    TTK
                </Typography>
                <Typography component='p' className='sub-title'>
                    TRAVEL
                </Typography>
            </Box>
        </Box>
    )
}

export default Loader
