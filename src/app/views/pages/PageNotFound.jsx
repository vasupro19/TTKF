import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'
import NotFoundSvg from '@assets/illustrations/404.svg' // Adjust path accordingly
import { useMediaQuery } from '@mui/material'
import CustomButton from '@/core/components/extended/CustomButton'
import { LeftArrowAnimIcon } from '@/assets/icons/LeftArrowAnimIcon'

function PageNotFound() {
    const isMobile = useMediaQuery('(max-width: 600px)')
    const navigate = useNavigate()

    return (
        <Grid
            container
            sx={{
                height: '100vh',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: 2,
                background: 'radial-gradient(circle, rgba(248, 250, 252, 0.72) 50%, rgba(225, 240, 245, 1) 100%)'
            }}
        >
            <img
                src={NotFoundSvg}
                alt='404'
                style={{ maxWidth: isMobile ? '340px' : '380px', marginBottom: '0.5rem' }}
            />
            <Typography variant='h2'>Page not found!</Typography>
            <Typography variant='body2' color='textSecondary' sx={{ my: 1 }}>
                Oops! Looks like you followed a bad link.
            </Typography>

            <CustomButton
                variant='clickable'
                customStyles={{ mt: 2, borderRadius: 3 }}
                shouldAnimate
                startIcon={<LeftArrowAnimIcon size={20} />}
                onClick={() => navigate(-1)}
            >
                Go Back
            </CustomButton>
        </Grid>
    )
}

export default PageNotFound
