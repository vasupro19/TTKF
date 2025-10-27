import { useEffect, useState } from 'react'
import { Box, Grid, Divider, TextField, Typography } from '@mui/material'
import { useParams } from 'react-router-dom'
// ** import core components
import MainCard from '@core/components/extended/MainCard'
import MyTabs from '@core/components/CapsuleTabs'
import IdentityCard from '@core/components/IdentityCard'
import InboundGRNDetails from '@/app/views/tables/inboundGRNDetails'

// ** import from redux
import { AccessTime, Description, Info } from '@mui/icons-material'
import CustomFileUpload from '@/core/components/forms/CustomFileUpload'
import { useGetGrnByIdQuery } from '@/app/store/slices/api/grnSlice'
import { INBOUND_STATUS } from '@/constants'
import { dateTimeFormatter } from '@/utilities'

const tabsFields = [
    {
        label: 'General Information',
        icon: <Info />,
        disabled: false // You can set it to true if you want to disable a tab
    },
    {
        label: 'Log Info',
        icon: <Description />,
        disabled: false // You can set it to true if you want to disable a tab
    }
]

function Index() {
    const { id: viewId } = useParams()

    // eslint-disable-next-line no-unused-vars
    const { data: response, error: resError } = useGetGrnByIdQuery(viewId)

    const [activeTab, setActiveTab] = useState(0)
    const [cardData, setCardData] = useState([
        {
            label: 'Vendor Name',
            value: 'Vendor ABC',
            key: 'vender_name'
        },
        {
            label: 'Vendor Code',
            value: 'VEN68768',
            key: 'vender_code'
        },
        {
            label: 'Invoice No.',
            value: 'INV879DS8F7',
            key: 'invoice_no'
        },
        {
            label: 'Invoice Date',
            value: '06-01-2025 09:00 pm',
            key: 'invoice_date'
        }
    ])

    const [data, setData] = useState([
        { label: 'GRN Number', value: '', key: 'grn_no' },
        { label: 'GRN Status', value: '', key: 'status' },
        { label: 'Document', value: '', key: 'document_no' },
        { label: 'Total Expected Qty', value: '', key: 'total_invoice_quantity' },
        { label: 'Total GRN Qty', value: '', key: 'total_grn_quantity' },
        { label: 'Creation Date Time', value: '', key: 'created_at' }
    ])

    // Simplify tab change handling without validation
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue)
    }

    // Sample log info data (for Tab 2)
    // const logInfoData = [
    //     { label: 'Company', value: 'ABC Corp' },
    //     { label: 'Put Away Status', value: 'Completed' }
    // ]

    useEffect(() => {
        const cardDataKeys = cardData.map(item => item.key)

        if (response && response?.data) {
            const newCardData = []
            const newData = []
            const tempResp = { ...response.data }
            tempResp.created_at = dateTimeFormatter(tempResp.created_at)
            Object.keys(response?.data).map(item => {
                if (cardDataKeys.includes(item)) {
                    cardData.map(cardItem => {
                        if (cardItem.key === item) newCardData.push({ ...cardItem, value: tempResp[item] })
                        return cardItem
                    })
                } else
                    data.map(dataItem => {
                        if (dataItem.key === item)
                            newData.push({
                                ...dataItem,
                                value: item === 'status' ? INBOUND_STATUS[tempResp[item]].label : tempResp[item]
                            })
                        return dataItem
                    })
                return item
            })

            setCardData(newCardData)
            setData(newData)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [response])

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
                <Grid container xs={12} md={3.6} spacing={2}>
                    <Grid item xs={12} md={6} lg={12} sx={{ marginBottom: 2 }}>
                        <IdentityCard data={cardData} />
                    </Grid>
                </Grid>
                <Grid md={8.3} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
                        <MyTabs activeTab={activeTab} handleTabChange={handleTabChange} tabsFields={tabsFields} />

                        <Box sx={{ padding: 1, paddingTop: 1 }}>
                            <Grid container spacing={2}>
                                {/* Conditionally render General Info or Log Info based on activeTab */}
                                {activeTab === 0 ? (
                                    data.map(field => (
                                        <Grid item xs={12} sm={4} key={field.label}>
                                            <TextField
                                                fullWidth
                                                label={field.label}
                                                value={field.value}
                                                InputProps={{
                                                    readOnly: true // Make it non-editable
                                                }}
                                                sx={{
                                                    '& input': {
                                                        backgroundColor: '#fff',
                                                        padding: '10px 6px',
                                                        height: '20px', // Decrease input height
                                                        color:
                                                            field?.label === 'GRN Status' && field?.value === 'Closed'
                                                                ? 'secondary.dark'
                                                                : 'unset'
                                                    },
                                                    '& .MuiInputBase-root.MuiOutlinedInput-root': {
                                                        backgroundColor: 'white' // Apply the white background to the root element
                                                    },
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'gray' // Optional: change border color if needed
                                                    },
                                                    flexGrow: 1
                                                }} // You can adjust custom styles here
                                            />
                                        </Grid>
                                    ))
                                ) : (
                                    <Box
                                        padding={2}
                                        sx={{
                                            width: '100%'
                                        }}
                                    >
                                        <Grid container spacing={2} alignItems='center'>
                                            {/* File Upload Section */}
                                            <Grid item xs={12} md={6}>
                                                <CustomFileUpload
                                                    field={{
                                                        name: 'uploadedFile',
                                                        label: 'Shopify Payload (06-01-2025 09:00pm)',
                                                        isDisabled: true,
                                                        isEdit: true // Enables download mode
                                                    }}
                                                    formik={{
                                                        values: {
                                                            uploadedFile: 'https://jsonplaceholder.typicode.com/todos/1'
                                                        }
                                                    }} // Mimic Formik's values object
                                                />
                                            </Grid>

                                            {/* GRN Aging Section */}
                                            <Grid item xs={12} md={6}>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        // justifyContent: 'space-between',
                                                        gap: 1,
                                                        backgroundColor: 'grey.100',
                                                        padding: '8px 8px',
                                                        borderRadius: 1,
                                                        boxShadow: 1
                                                    }}
                                                >
                                                    <Typography
                                                        variant='h6'
                                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                                    >
                                                        Aging
                                                        <AccessTime fontSize='small' />
                                                    </Typography>
                                                    <Typography variant='body1' color='text.secondary'>
                                                        <strong>111 days</strong> (Manufactured on &apos;3 Jan
                                                        2025&apos;)
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                )}
                            </Grid>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={12} md={6} lg={12}>
                    <Divider
                        sx={{
                            marginTop: '-2rem',
                            borderColor: '#BCC1CA',
                            marginBottom: '1rem',
                            boxShadow: '1px 1px 4px #00000054'
                        }}
                    />
                    <InboundGRNDetails />
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default Index
