import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// import DummyTable from '@views/tables/DummyTable'
// import SuperAdminDashBoard from '@views/dashboard/superadmin/SuperAdminDashBoard'
// import { dualResponse } from '@app/store/slices/api/geoSlice'
// import { openSnackbar } from '@app/store/slices/snackbar'

function Home() {
    // const dispatch = useDispatch()
    // dummy implementation for file and json response slice
    // const resHandler = async () => {
    //     let message = 'Unable to handle res'
    //     let isError = false
    //     try {
    //         const data = await dispatch(dualResponse.initiate({ generateExcel: false }))
    //         console.log('got response ', data)

    //         message = data?.message || 'res handled successfully!'
    //     } catch (error) {
    //         isError = true
    //         message = error?.message || message
    //     } finally {
    //         dispatch(
    //             openSnackbar({
    //                 open: true,
    //                 message,
    //                 variant: isError ? 'error' : 'success',
    //                 alert: { color: 'info' },
    //                 anchorOrigin: { vertical: 'top', horizontal: 'right' }
    //             })
    //         )
    //     }
    // }

    return (
        <Box sx={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant='h2'>Dashboard coming soon !</Typography>
            {/* <DummyTable /> */}
            {/* <SuperAdminDashBoard /> */}
        </Box>
    )
}

export default Home
