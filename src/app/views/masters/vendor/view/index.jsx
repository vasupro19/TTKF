/* eslint-disable react/no-array-index-key */
/* eslint-disable no-nested-ternary */
import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import MyTabs from '@/core/components/CapsuleTabs'
import MainCard from '@/core/components/extended/MainCard'
import IdentityCard from '@/core/components/IdentityCard'
import CustomButton from '@/core/components/extended/CustomButton'
import { Box, Grid, IconButton, TextField, Tooltip } from '@mui/material' // Import Button
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import Info from '@mui/icons-material/Info'
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined'
import LocationOn from '@mui/icons-material/LocationOn'
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined'
import LocalShipping from '@mui/icons-material/LocalShipping'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import Description from '@mui/icons-material/Description'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos' // Import back icon
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos' // Import next icon
import { useDispatch } from 'react-redux'
import { getVendorsById } from '@/app/store/slices/api/vendorSlice'
import { getReadOnlyInputSx } from '@/utilities'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { Edit } from '@mui/icons-material'

const customSx = getReadOnlyInputSx()

export default function ViewVendor() {
    const { id: viewID } = useParams()
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [activeTab, setActiveTab] = useState(0)
    const [companyData, setCompanyData] = useState({})

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue)
    }

    const tabsFields = [
        {
            label: 'General Information',
            icon: {
                outlined: <InfoOutlined />,
                filled: <Info />
            },
            disabled: false
        },
        {
            label: 'Bill From Address',
            icon: {
                outlined: <LocationOnOutlined />,
                filled: <LocationOn />
            },
            disabled: false
        },
        {
            label: 'Ship From Address',
            icon: {
                outlined: <LocalShippingOutlined />,
                filled: <LocalShipping />
            },
            disabled: false
        },
        {
            label: 'Other Details',
            icon: {
                outlined: <DescriptionOutlined />,
                filled: <Description />
            },
            disabled: false
        }
    ]

    const handleNextTab = () => {
        setActiveTab(prev => Math.min(prev + 1, tabsFields.length - 1))
    }

    const handleBackTab = () => {
        setActiveTab(prev => Math.max(prev - 1, 0))
    }

    // Data for each tab
    const basicInformationData = [
        { label: 'Company Name', value: companyData?.name, type: 'text' },
        { label: 'Ref No.', value: companyData?.no, type: 'text' },
        { label: 'Vendor Code', value: companyData?.code, type: 'text' },
        { label: 'Brand Name', value: companyData?.brand_name, type: 'text' },
        { label: 'GSTIN', value: companyData?.gst_in, type: 'text' },
        { label: 'PAN No.', value: companyData?.pan_no, type: 'text' },
        { label: 'FSSAI No.', value: companyData?.fssai_no, type: 'text' },
        { label: 'Tax Identification No.', value: companyData?.tin_no, type: 'text' },
        { label: 'CIN', value: companyData?.cin_no, type: 'text' }
    ]

    const billToAddressData = [
        { label: 'Address Line 1', value: companyData?.bill_address_1, gridProps: { md: 6 }, type: 'text' },
        { label: 'Address Line 2', value: companyData?.bill_address_2, gridProps: { md: 6 }, type: 'text' },
        { label: 'Pincode', value: companyData?.bill_pincode, type: 'text' },
        { label: 'City', value: companyData?.bill_city_id, type: 'text' },
        { label: 'State', value: companyData?.bill_state_id, type: 'text' },
        { label: 'Country', value: companyData?.bill_country_id, type: 'text' },
        { label: 'Contact Name', value: companyData?.bill_contact_name, type: 'text' },
        { label: 'Contact Email', value: companyData?.bill_contact_email, type: 'text' },
        { label: 'Contact Number', value: companyData?.bill_contact_no, type: 'phone' },
        { label: 'Latitude/Longitude', value: companyData?.bill_lat_long, type: 'text' }
    ]

    const shipToAddressData = [
        { label: 'Address Line 1', value: companyData?.ship_address_1, gridProps: { md: 6 }, type: 'text' },
        { label: 'Address Line 2', value: companyData?.ship_address_2, gridProps: { md: 6 }, type: 'text' },
        { label: 'Pincode', value: companyData?.ship_pincode, type: 'text' },
        { label: 'City', value: companyData?.ship_city_id, type: 'text' },
        { label: 'State', value: companyData?.ship_state_id, type: 'text' },
        { label: 'Country', value: companyData?.ship_country_id, type: 'text' },
        { label: 'Contact Name', value: companyData?.ship_contact_name, type: 'text' },
        { label: 'Contact Email', value: companyData?.ship_contact_email, type: 'text' },
        { label: 'Contact Number', value: companyData?.ship_contact_no, type: 'phone' },
        { label: 'Latitude/Longitude', value: companyData?.ship_lat_long, type: 'text' }
    ]

    const otherDetailsData = [
        { label: 'Allow Excess GRN', value: companyData?.allow_excess_grn ? 'Yes' : 'No', type: 'text' },
        ...(companyData?.allow_excess_grn ? [{ label: 'Tolerance', value: companyData?.tolerance, type: 'text' }] : []),
        { label: 'QC Required', value: companyData?.qc_required ? 'Yes' : 'No', type: 'text' },
        { label: 'UID Label Required', value: companyData?.uid_label_required ? 'Yes' : 'No', type: 'text' },
        { label: 'Shipping Term', value: companyData?.shipping_term, type: 'text' },
        { label: 'Currency', value: companyData?.currency, type: 'text' },
        { label: 'Credit Period (Days)', value: companyData?.credit_period_day, type: 'text' }
    ]

    const identityCardData = [
        { label: 'Company Name', value: companyData?.name },
        { label: 'GSTIN', value: companyData?.gst_in },
        { label: 'PAN', value: companyData?.pan_no },
        { label: 'Email', value: companyData?.ship_contact_email },
        { label: 'Phone Number', value: companyData?.ship_contact_no },
        {
            label: 'Shipping Address',
            value:
                companyData?.ship_address_1 || companyData?.ship_pincode
                    ? `${companyData?.ship_address_1 || ''}${companyData?.ship_pincode ? `-${companyData?.ship_pincode}` : ''}`
                    : 'N/A'
        }
    ]

    const getVendorData = async id => {
        const { data } = await dispatch(getVendorsById.initiate(id))
        if (!data?.data) return

        setCompanyData(data.data)
    }

    useEffect(() => {
        // eslint-disable-next-line radix
        if (viewID && parseInt(viewID)) getVendorData(viewID)
    }, [viewID])

    const tabsEnabled = tabsFields.map(() => true) // Assuming all tabs are always enabled for viewing

    return (
        <MainCard sx={{ py: '1px' }} contentSX={{ px: '2px', py: 1.5 }}>
            <Grid
                container
                gap={4}
                sx={{
                    border: '1px solid #d0d0d0',
                    px: 1.5,
                    py: 2,
                    borderRadius: '8px',
                    backgroundColor: 'grey.bgLighter',
                    minHeight: '82vh'
                }}
            >
                {/* Identity Card Grid */}
                <Grid item xs={12} md={3.6}>
                    <Grid item xs={12} sx={{ marginBottom: 2 }}>
                        <IdentityCard data={identityCardData} showProfileImage={false} />
                    </Grid>
                </Grid>

                {/* Tabs and Details Grid */}
                <Grid item md={8} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                width: '100%',
                                alignItems: 'center',
                                gap: 1,
                                marginBottom: 1,
                                flexDirection: { sm: 'row', xs: 'column' }
                            }}
                        >
                            <MyTabs
                                activeTab={activeTab}
                                handleTabChange={handleTabChange}
                                tabsFields={tabsFields.map((tab, index) => ({
                                    ...tab,
                                    icon: tab.icon
                                        ? activeTab === index && typeof tab.icon === 'object' && tab.icon.filled
                                            ? tab.icon.filled
                                            : typeof tab.icon === 'object' && tab.icon.outlined
                                              ? tab.icon.outlined
                                              : tab.icon
                                        : null
                                }))}
                                tabsEnabled={tabsEnabled}
                                customSx={{ width: '100%' }}
                            />
                            <UiAccessGuard type='edit'>
                                <Link to={`/master/vendor/edit/${viewID}`}>
                                    <IconButton
                                        sx={{ color: 'success.main', border: '1px solid #60498a' }}
                                        size='small'
                                        aria-label='edit row'
                                    >
                                        <Tooltip title='Edit'>
                                            <Edit fontSize='medium' sx={{ fill: '#60498a' }} />
                                        </Tooltip>
                                    </IconButton>
                                </Link>
                            </UiAccessGuard>
                        </Box>

                        <Box sx={{ padding: 2, height: { xs: 'auto', sm: '200px' } }}>
                            <Grid container spacing={2}>
                                {activeTab === 0 &&
                                    basicInformationData.map((field, index) => (
                                        <Grid item xs={12} md={4} key={index}>
                                            <Tooltip
                                                title={field.value?.length > 20 ? field.value : ''}
                                                placement='bottom'
                                                arrow
                                            >
                                                <TextField
                                                    fullWidth
                                                    label={field.label}
                                                    value={field.value}
                                                    InputProps={{ readOnly: true }}
                                                    InputLabelProps={{ shrink: true }}
                                                    sx={customSx}
                                                />
                                            </Tooltip>
                                        </Grid>
                                    ))}
                                {activeTab === 1 &&
                                    billToAddressData.map((field, index) => (
                                        <Grid item xs={12} md={field.gridProps?.md || 4} key={index}>
                                            <Tooltip
                                                title={field.value?.length > 20 ? field.value : ''}
                                                placement='bottom'
                                                arrow
                                            >
                                                <TextField
                                                    fullWidth
                                                    label={field.label}
                                                    value={field.value}
                                                    InputProps={{ readOnly: true }}
                                                    InputLabelProps={{ shrink: true }}
                                                    sx={customSx}
                                                />
                                            </Tooltip>
                                        </Grid>
                                    ))}
                                {activeTab === 2 &&
                                    shipToAddressData.map((field, index) => (
                                        <Grid item xs={12} md={field.gridProps?.md || 4} key={index}>
                                            <Tooltip
                                                title={field.value?.length > 20 ? field.value : ''}
                                                placement='bottom'
                                                arrow
                                            >
                                                <TextField
                                                    fullWidth
                                                    label={field.label}
                                                    value={field.value}
                                                    InputProps={{ readOnly: true }}
                                                    InputLabelProps={{ shrink: true }}
                                                    sx={customSx}
                                                />
                                            </Tooltip>
                                        </Grid>
                                    ))}
                                {activeTab === 3 &&
                                    otherDetailsData.map((field, index) => (
                                        <Grid item xs={12} md={4} key={index}>
                                            <Tooltip
                                                title={field.value?.length > 20 ? field.value : ''}
                                                placement='bottom'
                                                arrow
                                            >
                                                <TextField
                                                    fullWidth
                                                    label={field.label}
                                                    value={field.value}
                                                    InputProps={{ readOnly: true }}
                                                    InputLabelProps={{ shrink: true }}
                                                    sx={customSx}
                                                />
                                            </Tooltip>
                                        </Grid>
                                    ))}
                            </Grid>
                        </Box>

                        {/* Navigation Buttons */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                            <CustomButton
                                variant='clickable'
                                startIcon={<ArrowBackIosIcon />}
                                onClick={handleBackTab}
                                disabled={activeTab === 0}
                                customStyles={{
                                    bgcolor: 'grey.700', // Attractive grey background
                                    color: 'white', // White text
                                    '&:hover': {
                                        bgcolor: 'grey.800' // Darker grey on hover
                                    },
                                    '&.Mui-disabled': {
                                        bgcolor: 'grey.300', // Lighter grey when disabled
                                        color: 'grey.500'
                                    },
                                    boxShadow: 'none', // No shadow for a cleaner look
                                    borderRadius: '8px', // Rounded corners
                                    padding: '8px 12px',
                                    height: '2rem',
                                    minWidth: '80px' // Ensure consistent button size
                                }}
                            >
                                Back
                            </CustomButton>
                            <CustomButton
                                variant='clickable'
                                endIcon={<ArrowForwardIosIcon />}
                                onClick={handleNextTab}
                                disabled={activeTab === tabsFields.length - 1}
                                customStyles={{
                                    bgcolor: 'primary.main', // Primary color background
                                    color: 'white', // White text
                                    '&:hover': {
                                        bgcolor: 'primary.dark' // Darker primary on hover
                                    },
                                    '&.Mui-disabled': {
                                        bgcolor: 'grey.300', // Lighter grey when disabled
                                        color: 'grey.500'
                                    },
                                    boxShadow: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    height: '2rem',
                                    minWidth: '80px' // Ensure consistent button size
                                }}
                            >
                                Next
                            </CustomButton>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </MainCard>
    )
}
