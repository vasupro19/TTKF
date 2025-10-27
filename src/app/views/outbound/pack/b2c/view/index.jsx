import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Grid, Divider, TextField, Typography } from '@mui/material'
import { Description, Receipt } from '@mui/icons-material'

import MainCard from '@core/components/extended/MainCard'
import { getReadOnlyInputSx } from '@/utilities'
import ViewB2CPackTable from '@/app/views/tables/pack/ViewB2CPackTable'
import CustomButton from '@/core/components/extended/CustomButton'

import AmazonColorIcon from '@/assets/icons/channel/AmazonColorIcon'
import MyntraColorIcon from '@/assets/icons/channel/MyntraColorIcon'
import ShopifyColorIcon from '@/assets/icons/channel/ShopifyColorIcon'
import flipkartColorIcon from '@/assets/icons/channel/flipkartColorIcon.svg'

import { useShowPackDataMutation } from '@/app/store/slices/api/packSlice'

const customSx = getReadOnlyInputSx()

const getChannelIcon = {
    Amazon: <AmazonColorIcon />,
    Myntra: <MyntraColorIcon />,
    Shopify: <ShopifyColorIcon />,
    Flipkart: <img src={flipkartColorIcon} alt='Flipkart' style={{ height: 18, width: 18 }} />
}

const initialDetailsData = [
    { label: 'Order ID', key: 'orderNo', value: '' },
    { label: 'Total Quantity', key: 'total_quantity', value: '' },
    { label: 'Total Weight', key: 'actual_weight', value: '' },
    { label: 'Invoice No.', key: 'invoice_no', value: '' },
    { label: 'AWB No.', key: 'awb_no', value: '' },
    {
        label: 'Channel',
        key: 'channel_code',
        value: '-'
    },
    { label: 'Courier', key: 'courier_code', value: '' }
]

function Index() {
    const { id: packId } = useParams()
    const [showPackData] = useShowPackDataMutation()
    // Details data used for read-only text fields
    const [detailsData, setDetailsData] = useState(structuredClone(initialDetailsData))

    useEffect(() => {
        if (!parseInt(packId, 10)) return
        ;(async () => {
            const { data: response } = await showPackData(packId).unwrap()
            if (response) {
                setDetailsData(
                    detailsData.map(item => {
                        if (item.key === 'channel')
                            item.value = (
                                <Box display='flex' alignItems='center' gap={1} justifyContent='center'>
                                    <>
                                        {getChannelIcon[item?.channel] || '-'}{' '}
                                        {/* Replace with the correct channel icon based on your data */}
                                        <Typography
                                            variant='body2'
                                            fontWeight={500}
                                            sx={{
                                                maxWidth: '100px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {item?.channel || '-'}
                                        </Typography>
                                    </>
                                </Box>
                            )
                        else if (item.key === 'actual_weight' && response[item.key])
                            item.value = `${response[item.key]} Kg`
                        else item.value = response[item.key] || ''
                        return item
                    })
                )
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [packId])

    return (
        <MainCard sx={{ py: '1px' }} contentSX={{ px: '2px', py: 1.5 }}>
            <Grid
                container
                gap={4}
                sx={{
                    border: '1px solid',
                    borderColor: 'grey.borderLight',
                    px: 1,
                    py: 1,
                    borderRadius: '8px'
                }}
            >
                <Grid md={12} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
                        {/* You can uncomment the Tabs component if needed */}
                        <Box sx={{ p: 1, pt: 2, width: '100%' }}>
                            <Grid container spacing={1.5}>
                                {detailsData.map((field, index) => (
                                    // eslint-disable-next-line react/no-array-index-key
                                    <Grid item xs={12} sm={3} key={index}>
                                        {field.label === 'Channel' ? (
                                            <TextField
                                                fullWidth
                                                label={field.label}
                                                value='' // Empty string as placeholder
                                                InputProps={{
                                                    readOnly: true,
                                                    startAdornment: field.value // Assuming field.value is a JSX element for Channel
                                                }}
                                                InputLabelProps={{ shrink: true }}
                                                sx={customSx}
                                            />
                                        ) : (
                                            <TextField
                                                fullWidth
                                                label={field.label}
                                                value={field.value} // Normal string value for other fields
                                                InputProps={{ readOnly: true }}
                                                InputLabelProps={{ shrink: true }}
                                                sx={customSx}
                                            />
                                        )}
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={12} md={6} lg={12}>
                    <Divider
                        sx={{
                            mt: '-2rem',
                            borderColor: '#BCC1CA',
                            mb: '1rem',
                            boxShadow: '1px 1px 4px #00000054'
                        }}
                    />
                    <ViewB2CPackTable
                        renderToolBarElement={
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2
                                }}
                            >
                                <CustomButton variant='outlined' clickable startIcon={<Description />}>
                                    Reprint Invoice
                                </CustomButton>
                                <CustomButton variant='outlined' clickable startIcon={<Receipt />}>
                                    Reprint Ship Label
                                </CustomButton>
                            </Box>
                        }
                    />
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default Index
