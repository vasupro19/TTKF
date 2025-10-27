import React from 'react'
import { Box, Divider, Stack, Typography, Container, styled, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket'
import ArchiveIcon from '@mui/icons-material/Archive'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

const Connector = styled(Divider)(({ theme, vertical, date }) => ({
    backgroundColor: date ? theme.palette.secondary.main : theme.palette.grey[400],
    height: vertical ? '40px' : '2px',
    width: vertical ? '2px' : '100px',
    margin: vertical ? '4px 0' : '0 auto',
    alignSelf: 'center'
}))

const StageContainer = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '16px'
}))

// eslint-disable-next-line react/prop-types
function LMDStatus({ createdAt }) {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    const stages = [
        {
            icon: <AddCircleOutlineIcon fontSize='large' color='secondary' />,
            label: 'Created',
            date: createdAt || ''
        },
        {
            icon: <ShoppingBasketIcon fontSize='large' color='disabled' />,
            label: 'Picked',
            date: ''
        },
        {
            icon: <ArchiveIcon fontSize='large' color='disabled' />,
            label: 'Packed',
            date: ''
        },
        {
            icon: <LocalShippingIcon fontSize='large' color='disabled' />,
            label: 'In Transit',
            date: ''
        },
        {
            icon: <DeliveryDiningIcon fontSize='large' color='disabled' />,
            label: 'OFD',
            date: ''
        },
        {
            icon: <CheckCircleOutlineIcon fontSize='large' color='disabled' />,
            label: 'Delivered',
            date: ''
        }
    ]

    return (
        <Container maxWidth='lg'>
            <Stack
                direction={isMobile ? 'column' : 'row'}
                justifyContent='center'
                alignItems={isMobile ? 'center' : 'center'}
                spacing={isMobile ? 2 : 0}
            >
                {stages.map((stage, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <React.Fragment key={index}>
                        <StageContainer>
                            {stage.icon}
                            <Typography
                                variant='subtitle1'
                                fontWeight={!stage?.date ? 'normal' : 'bold'}
                                sx={!stage?.date ? { color: 'gray' } : {}}
                            >
                                {stage.label}
                            </Typography>
                            <Typography variant='caption'>{stage.date}</Typography>
                        </StageContainer>
                        {index < stages.length - 1 && (
                            <Connector vertical={isMobile} date={stages?.[index + 1]?.date} />
                        )}
                    </React.Fragment>
                ))}
            </Stack>
        </Container>
    )
}

export default LMDStatus
