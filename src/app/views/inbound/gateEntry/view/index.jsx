/* eslint-disable no-use-before-define */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-nested-ternary */
import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import MyTabs from '@/core/components/CapsuleTabs'
import MainCard from '@/core/components/extended/MainCard'
import IdentityCard from '@/core/components/IdentityCard'
import CustomButton from '@/core/components/extended/CustomButton'
import { Box, Grid, TextField, Tooltip } from '@mui/material' // Import Button
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined'
import LocalShipping from '@mui/icons-material/LocalShipping'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import Description from '@mui/icons-material/Description'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos' // Import back icon
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos' // Import next icon
import { useDispatch } from 'react-redux'
import { getCustomSx, getReadOnlyInputSx } from '@/utilities'
import { InsertDriveFile, InsertDriveFileOutlined, Receipt, ReceiptOutlined } from '@mui/icons-material'
import { getGateEntryDetails } from '@/app/store/slices/api/gateEntrySlice'
import CustomFileUpload from '@/core/components/forms/CustomFileUpload'

const customSx = getReadOnlyInputSx()
const getInputSx = getCustomSx()

export default function ViewGateEntryForm() {
    const { id: formId } = useParams()
    const dispatch = useDispatch()

    const [activeTab, setActiveTab] = useState(0)
    const [gateEntryData, setGateEntryData] = useState({})

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue)
    }

    const tabsFields = useMemo(
        () => [
            {
                label: 'Document Details',
                icon: {
                    outlined: <DescriptionOutlined />,
                    filled: <Description />
                },
                disabled: false,
                fields: [
                    { name: 'document_type', label: 'Document Type*', type: 'text' },
                    { name: 'type_of_reference', label: 'Type of Reference', type: 'text' },
                    { name: 'material_description', label: 'Material Description', type: 'text' },
                    { name: 'document_no', label: 'Document Number*', type: 'text' },
                    { name: 'vendors_lable', label: 'Vendor Name*', type: 'text' },
                    { name: 'material_type', label: 'Material Type', type: 'text' }
                ]
            },
            {
                label: 'Invoice Details',
                icon: {
                    outlined: <ReceiptOutlined />,
                    filled: <Receipt />
                },
                disabled: false,
                fields: [
                    { name: 'invoice_no', label: 'Invoice No.*', type: 'text' },
                    { name: 'invoice_value', label: 'Invoice Value*', type: 'currency' },
                    { name: 'invoice_quantity', label: 'Invoice Quantity*', type: 'number' },
                    { name: 'invoice_date', label: 'Invoice Date*', type: 'date' },
                    { name: 'no_of_cases', label: 'No. of Cases*', type: 'number' }
                ]
            },
            {
                label: 'Transporter Details',
                icon: {
                    outlined: <LocalShippingOutlined />,
                    filled: <LocalShipping />
                },
                disabled: false,
                fields: [
                    { name: 'transporter_name', label: 'Transporter Name*', type: 'text' },
                    { name: 'mode_of_transport', label: 'Mode of Transport*', type: 'text' },
                    { name: 'docket_no', label: 'Dock No.', type: 'text' },
                    { name: 'driver_name', label: 'Driver Name', type: 'text' },
                    { name: 'driver_mobile_no', label: 'Driver Mobile No.', type: 'phone' },
                    { name: 'e_way_no', label: 'E-Way Bill No.', type: 'text' },
                    { name: 'lr_no', label: 'LR No.', type: 'text' },
                    { name: 'remarks', label: 'Remarks', type: 'textarea' }
                ]
            },
            {
                label: 'File & Others',
                icon: {
                    outlined: <InsertDriveFileOutlined />,
                    filled: <InsertDriveFile />
                },
                disabled: false,
                fields: [
                    { name: 'lrDoc', label: 'LR Copy', type: 'file' },
                    { name: 'poNo', label: 'PO Copy', type: 'file' },
                    { name: 'invoiceDoc', label: 'Invoice Copy', type: 'file' },
                    { name: 'ewayBill', label: 'E-way Bill Copy', type: 'file' }
                ]
            }
        ],
        []
    )

    const handleNextTab = () => {
        setActiveTab(prev => Math.min(prev + 1, tabsFields.length - 1))
    }

    const handleBackTab = () => {
        setActiveTab(prev => Math.max(prev - 1, 0))
    }

    // Data for each tab
    const documentDetails = useMemo(
        () =>
            tabsFields[0].fields.map(field => ({
                label: field.label.replace('*', ''), // Clean label
                value: getFieldValue(gateEntryData, field.name),
                type: field.type,
                grid: field.grid
            })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [gateEntryData]
    )

    const invoiceDetails = useMemo(
        () =>
            tabsFields[1].fields.map(field => ({
                label: field.label.replace('*', ''),
                value: getFieldValue(gateEntryData, field.name),
                type: field.type,
                grid: field.grid
            })),
        [gateEntryData, tabsFields]
    )

    const transporterDetails = useMemo(
        () =>
            tabsFields[2].fields.map(field => ({
                label: field.label.replace('*', ''),
                value: getFieldValue(gateEntryData, field.name),
                type: field.type,
                grid: field.grid
            })),
        [gateEntryData, tabsFields]
    )

    const fileAndOtherDetails = useMemo(
        () =>
            tabsFields[3].fields.map(field => ({
                label: field.label.replace('*', ''),
                value: getFieldValue(gateEntryData, field.name),
                type: field.type,
                grid: field.grid
            })),
        [gateEntryData, tabsFields]
    )

    // Helper function to safely extract values
    function getFieldValue(data, fieldName) {
        const value = data?.[fieldName]

        // Handle object values (like from autocomplete)
        if (value && typeof value === 'object') {
            return value.label || value.value || 'N/A'
        }

        return value ?? 'N/A'
    }

    // Identity card data with memoization
    const identityCardData = useMemo(
        () => [
            {
                label: 'Document Type',
                value: getFieldValue(gateEntryData, 'document_type')
            },
            {
                label: 'Document Number',
                value: getFieldValue(gateEntryData, 'document_number')
            },
            {
                label: 'Invoice No.',
                value: getFieldValue(gateEntryData, 'invoice_no')
            },
            {
                label: 'Transporter Name',
                value: getFieldValue(gateEntryData, 'transporter_name')
            },
            {
                label: 'Driver Mobile No.',
                value: getFieldValue(gateEntryData, 'driver_mobile_no')
            }
        ],
        [gateEntryData]
    )

    // Replace the existing getGateEntryData function with this updated version:

    const getGateEntryData = async id => {
        const { data } = await dispatch(getGateEntryDetails.initiate(id))
        if (!data?.data) return

        // Map document files similar to your other component
        const documentFilenames = data.data.document_upload || []
        const fileFields = {
            lrDoc: null,
            invoiceDoc: null,
            poNo: null,
            ewayBill: null
        }

        documentFilenames.forEach(filename => {
            if (filename.includes('lr_doc')) {
                fileFields.lrDoc = filename
            } else if (filename.includes('invoice_doc')) {
                fileFields.invoiceDoc = filename
            } else if (filename.includes('pono_doc')) {
                fileFields.poNo = filename
            } else if (filename.includes('ewaybill_doc')) {
                fileFields.ewayBill = filename
            }
        })

        // Merge the original data with mapped file fields
        const parsedData = {
            ...data.data,
            ...fileFields,
            // Add any other field mappings you might need
            document_number:
                data.data.document_type === 'Non-ASN' ? data.data.ext_document_no || '' : data.data.document_no || '',
            vendor_name: data.data.vendors_lable || data.data.vendor_name,
            transport_method: data.data.mode_of_transport,
            e_way_bill: data.data.e_way_no || data.data.e_way_bill
        }

        setGateEntryData(parsedData)
    }

    useEffect(() => {
        // eslint-disable-next-line radix
        if (formId && parseInt(formId)) getGateEntryData(formId)
    }, [formId])

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
                        />

                        <Box sx={{ padding: 2, height: { xs: 'auto', sm: '200px' } }}>
                            <Grid container spacing={2}>
                                {activeTab === 0 &&
                                    documentDetails.map((field, index) => (
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
                                    invoiceDetails.map((field, index) => (
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
                                    transporterDetails.map((field, index) => (
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
                                    fileAndOtherDetails.map((field, index) => (
                                        <Grid item xs={12} md={4} key={index}>
                                            <CustomFileUpload
                                                field={{
                                                    name: field.label.toLowerCase().replace(/\s+/g, '_'), // Convert label to field name
                                                    label: field.label,
                                                    isDisabled: true, // Always disabled in view mode
                                                    isEdit: true, // Enable edit mode to show download functionality
                                                    buttonLabel: 'Download',
                                                    customSx: getInputSx
                                                }}
                                                formik={{
                                                    values: {
                                                        [field.label.toLowerCase().replace(/\s+/g, '_')]:
                                                            field.value === 'N/A' ? '' : field.value
                                                    },
                                                    touched: {},
                                                    errors: {},
                                                    setFieldTouched: () => {} // Dummy function since it's view mode
                                                }}
                                            />
                                        </Grid>
                                    ))}
                            </Grid>
                        </Box>

                        {/* Navigation Buttons */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0, gap: 2 }}>
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
