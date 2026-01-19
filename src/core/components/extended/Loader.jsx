/* eslint-disable react/self-closing-comp */
import { Box, Typography } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'

import '@assets/styles/loader.css'

function Loader() {
    const { user } = useSelector(state => state.auth)

    return (
        <Box className='splash-screen'>
            <Box className='loader'>
                <Box className='truckWrapper'>
                    <Box className='truckBody'>{user?.clientName}</Box>
                </Box>
            </Box>

            <Box className='title-container'>
                <Typography component='h1' className='main-title'>
                    {user?.clientName}
                </Typography>
                {/* <Typography component='p' className='sub-title'>
                    TRAVEL
                </Typography> */}
            </Box>
        </Box>
    )
}

export default Loader
