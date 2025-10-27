import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Grid, Divider, TextField, Typography } from '@mui/material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import MyTabs from '@core/components/CapsuleTabs'
import IdentityCard from '@core/components/IdentityCard'
import InboundPutAwayDetails from '@/app/views/tables/inboundPutAwayDetails'

// ** import from redux
import { AccessTime, Description, Info } from '@mui/icons-material'
import CustomFileUpload from '@/core/components/forms/CustomFileUpload'
import { getPutAwayById } from '@/app/store/slices/api/putAwaySlice'
import { useDispatch } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'
import { INBOUND_STATUS } from '@/constants'

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
    const dispatch = useDispatch()
    const [activeTab, setActiveTab] = useState(0)

    // Simplify tab change handling without validation
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue)
    }

    const [data, setData] = useState([])
    const [vendorData, setVendorData] = useState([])

    useEffect(() => {
        const getData = async id => {
            try {
                const { data: response } = await dispatch(getPutAwayById.initiate(id))
                const DataArray = []
                DataArray.push({ label: 'Put Away No', value: response?.data?.no })
                DataArray.push({ label: 'GRN Number', value: response?.data?.grn_no || response?.data?.document_no })
                DataArray.push({
                    label: 'Gate Entry Status',
                    value: INBOUND_STATUS[response?.data?.status]?.label || ''
                })
                DataArray.push({
                    label: 'Expected Qty',
                    value: response?.data?.expected_quantity || 0
                })
                DataArray.push({
                    label: 'Put Away Qty',
                    value: response?.data?.putaway_qty || ''
                })
                setData(DataArray)
                setVendorData([
                    {
                        label: 'Vendor Name',
                        value: response?.data?.vendor_name || 'N/A'
                    },
                    {
                        label: 'Vendor Code',
                        value: response?.data?.vendor_code || 'N/A'
                    },
                    {
                        label: 'Invoice No.',
                        value: response?.data?.invoice_no || 'N/A'
                    },
                    {
                        label: 'Invoice Date',
                        value: response?.data?.invoice_date || 'N/A'
                    }
                ])
            } catch (error) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'unable to get putaway data!',
                        variant: 'alert',
                        alert: { color: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
            }
        }

        if (viewId && parseInt(viewId, 10)) getData(viewId)
    }, [dispatch, viewId])

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
                        <IdentityCard data={vendorData} />
                    </Grid>
                </Grid>
                <Grid md={8.3} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
                        <MyTabs activeTab={activeTab} handleTabChange={handleTabChange} tabsFields={tabsFields} />

                        <Box sx={{ padding: 1, paddingTop: 1 }}>
                            <Grid container spacing={2}>
                                {/* Conditionally render General Info or Log Info based on activeTab */}
                                {activeTab === 0 ? (
                                    data.map((field, index) => (
                                        // eslint-disable-next-line react/no-array-index-key
                                        <Grid item xs={12} sm={4} key={index}>
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
                                                            field?.label === 'Gate Entry Status' &&
                                                            field?.value === 'Closed'
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
                                            {/* Put Away Aging Section */}
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
                                                        <strong>26 days</strong> (Manufactured on &apos;3 Jan
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
                    <InboundPutAwayDetails />
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default Index
