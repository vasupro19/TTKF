/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Grid, Divider, TextField, Autocomplete } from '@mui/material'

// import core components
import MainCard from '@core/components/extended/MainCard'
import MyTabs from '@core/components/CapsuleTabs'
import InputConfirmModal from '@/core/components/modals/InputConfirmModal'

// import from redux
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import { Comment, Info, LocalShipping, ShoppingCart } from '@mui/icons-material'
import IdCardContainer from '@/core/components/IdCardContainer'
import { openModal, closeModal } from '@/app/store/slices/modalSlice'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import OutboundOrderDetails from '@/app/views/tables/outboundOrdersDetails'
import LMDStatus from '@/core/components/LMDStatus'
import CustomButton from '@/core/components/extended/CustomButton'
import { getReadOnlyInputSx } from '@/utilities'
import { useGetOrderByIdMutation } from '@/app/store/slices/api/orderSlice'
import OrderDetailCard from '../OrderDetailCard'
import MenuDropdown from './MenuDropDown'

// eslint-disable-next-line react-refresh/only-export-components
export const initialValues = {
    tabId: 'generalInformation',
    order_no: `SO12345`,
    wms_ref_no: 'WMS12345',
    customer_name: 'John Doe',
    customer_id: 'CUST001',
    order_type: 'B2B',
    status: 'Confirm',
    shipment_mode: 'Express',
    payment_status: 'PAID',
    order_date: new Date().toISOString().split('T')[0],
    fulfilled_by: '2024-08-12 09:15 pm',
    transport_mode: 'AIR',
    channel: 'Amazon',
    priority: true,
    bill_address_1: '123 Billing Street',
    bill_address_2: 'Suite 100',
    bill_pincode: '400001',
    bill_pincode_id: 'PIN001',
    bill_city: 'Mumbai',
    bill_state: 'Maharashtra',
    bill_country: 'India',
    bill_contact_name: 'Billing Contact',
    bill_contact_email: 'billing@example.com',
    bill_contact_no: '+911234567890',
    secondary_bill_contact_no: '+911234567891',
    bill_lat_long: '12.3456,78.9101',
    same_as_billing_address: true,
    ship_address_1: '456 Shipping Avenue',
    ship_address_2: 'Apt 200',
    ship_pincode: '400002',
    ship_pincode_id: 'PIN002',
    ship_city: 'Mumbai',
    ship_state: 'Maharashtra',
    ship_country: 'India',
    ship_contact_name: 'Shipping Contact',
    secondary_ship_contact_no: '+911234567892',
    ship_contact_no: '+911234567893',
    ship_contact_email: 'shipping@example.com',
    ship_lat_long: '12.3456,78.9101',
    isGift: false,
    gift_message: '',
    discount_code: 'DISC10',
    remarks: 'Handle with care',
    invoice_no: 'INV12345',
    total_amount: '₹ 5,470',
    total_discount: '₹ 500',
    gst: 'GSTIN12345',
    shipping_charges: '₹ 100',
    other_charges: '₹ 50',
    carrier_name: 'Delhivery',
    tracking_no: 'JD987D9879',
    currency: 'INR',
    on_hold: 'No'
}

const tabsFields = [
    { label: 'Order Info', icon: <ShoppingCart />, disabled: false },
    { label: 'Bill To Address', icon: <LocalShipping />, disabled: false },
    { label: 'Ship To Address', icon: <Comment />, disabled: false },
    { label: 'Invoice & Others', icon: <Info />, disabled: false }
]

function Index() {
    const { id: viewId } = useParams()

    const dispatch = useDispatch()
    const modalType = useSelector(state => state.modal.type)

    const [activeTab, setActiveTab] = useState(0)
    const [activeModal, setActiveModal] = useState(null)
    const [getOrderById] = useGetOrderByIdMutation()
    // eslint-disable-next-line no-unused-vars
    const [orderData, setOrderData] = useState(initialValues)
    const [customerInfo, setCustomerInfo] = useState({})
    // eslint-disable-next-line no-unused-vars
    const [isLoading, setIsLoading] = useState(true)
    const [basicInformationData, setBasicInformationData] = useState([])
    const [createdAt, setCreatedAt] = useState()
    const [billToAddressData, setBillToAddressData] = useState([])
    const [shipToAddressData, setShipToAddressData] = useState([])
    const [invoiceOthersData, setInvoiceOthersData] = useState([])

    const reasonRef = useRef('')
    const [cancelError, setCancelError] = useState(false)
    const cancellationReasons = ['Customer Request', 'Incorrect Order', 'Stock Unavailable', 'Duplicate Order', 'Other']

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue)
    }

    const customSx = getReadOnlyInputSx()

    useEffect(() => {
        const fetchOrderData = async () => {
            if (!viewId) return

            try {
                setIsLoading(true)
                const { data: response } = await getOrderById(viewId)

                if (response && response.success) {
                    const order = response.data
                    setCreatedAt(response.data.created_at)
                    setOrderData(order)

                    setCustomerInfo({
                        name: order.ship_to_name,
                        address: `${order.ship_add1 || ''}, ${order.ship_city || ''}, ${order.ship_state || ''}, ${order.ship_pincode || ''}`,
                        phone: order.ship_phone1,
                        gst: order.gst,
                        title: 'Customer Details',
                        businessName: order.client_id ? `Client #${order.client_id}` : ''
                    })

                    setBasicInformationData([
                        { label: 'Order No', value: order.order_no },
                        { label: 'WMS Ref No', value: order.no },
                        { label: 'Status', value: initialValues.status },
                        { label: 'Customer Name', value: order.ship_to_name },
                        { label: 'Order Type', value: order.order_type },
                        { label: 'Shipment Mode', value: order.shipment_method },
                        { label: 'Payment Status', value: order.payment_mode },
                        { label: 'Order Date', value: order.order_date },
                        { label: 'Fulfilled By', value: order.created_at },
                        { label: 'Channel', value: order.channel_code },
                        { label: 'Priority', value: order.priority ? 'Yes' : 'No' }
                    ])

                    setBillToAddressData([
                        { label: 'Address Line 1', value: order.bill_add1 },
                        { label: 'Address Line 2', value: order.bill_add2 },
                        { label: 'Pincode', value: order.bill_pincode },
                        { label: 'City', value: order.bill_city },
                        { label: 'State', value: order.bill_state },
                        { label: 'Country', value: order.bill_country },
                        { label: 'Contact Name', value: order.bill_to_name },
                        { label: 'Contact Email', value: order.bill_email },
                        { label: 'Contact No', value: order.bill_phone1 },
                        { label: 'Secondary Contact No', value: order.bill_phone2 },
                        {
                            label: 'Latitude, Longitude',
                            value: order.bill_lat && order.bill_long ? `${order.bill_lat},${order.bill_long}` : ''
                        }
                    ])

                    setShipToAddressData([
                        { label: 'Address Line 1', value: order.ship_add1 },
                        { label: 'Address Line 2', value: order.ship_add2 },
                        { label: 'Pincode', value: order.ship_pincode },
                        { label: 'City', value: order.ship_city },
                        { label: 'State', value: order.ship_state },
                        { label: 'Country', value: order.ship_country },
                        { label: 'Contact Name', value: order.ship_to_name },
                        { label: 'Contact No', value: order.ship_phone1 },
                        { label: 'Secondary Contact No', value: order.ship_phone2 },
                        { label: 'Contact Email', value: order.ship_email },
                        {
                            label: 'Latitude, Longitude',
                            value: order.ship_lat && order.ship_long ? `${order.ship_lat},${order.ship_long}` : ''
                        },
                        { label: 'GSTIN', value: order.gst_no }
                    ])

                    setInvoiceOthersData([
                        { label: 'Invoice No', value: order.inv_no },
                        { label: 'Total Order Amount', value: order.total_price ? `₹ ${order.total_price}` : '' },
                        { label: 'Currency', value: 'INR' },
                        { label: 'Discount Code', value: order.discount_code },
                        {
                            label: 'Total Discount',
                            value: order.total_discounts ? `₹ ${order.total_discounts}` : ''
                        },
                        {
                            label: 'Shipping Charges',
                            value: order.shipping_charges ? `₹ ${order.shipping_charges}` : ''
                        },
                        { label: 'Other Charges', value: '₹ 0' },
                        { label: 'Transport Mode', value: order.transport_mode },
                        { label: 'Carrier Name', value: order.courier_code },
                        { label: 'Tracking No.', value: order.tracking_no },
                        { label: 'On Hold', value: order.is_hold === 1 ? 'Yes' : 'No' },
                        { label: 'Is Gift', value: order.is_gift === 1 ? 'Yes' : 'No' },
                        { label: 'Gift Message', value: order.gift_message },
                        { label: 'Remarks', value: order.remarks }
                    ])
                } else {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: 'Failed to load order data',
                            variant: 'alert',
                            alert: { color: 'error' },
                            anchorOrigin: { vertical: 'top', horizontal: 'center' }
                        })
                    )
                }
            } catch (error) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'Unable to get order data!',
                        variant: 'alert',
                        alert: { color: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
            } finally {
                setIsLoading(false)
            }
        }

        fetchOrderData()
    }, [viewId, getOrderById, dispatch])

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
                        <IdCardContainer>
                            <OrderDetailCard {...customerInfo} />
                        </IdCardContainer>
                    </Grid>
                </Grid>
                <Grid md={8.3} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                width: '100%',
                                alignItems: 'center',
                                gap: 1,
                                marginBottom: 1,
                                flexDirection: { sm: 'row', xs: 'column-reverse' }
                            }}
                        >
                            <MyTabs
                                activeTab={activeTab}
                                handleTabChange={handleTabChange}
                                tabsFields={tabsFields}
                                customSx={{ width: '100%' }}
                            />
                            <MenuDropdown
                                onCloneClick={() => {
                                    setActiveModal('clonePopup')
                                    dispatch(
                                        openModal({
                                            type: 'confirm_modal'
                                        })
                                    )
                                }}
                                onCancelClick={() => {
                                    setActiveModal('cancelPopup')
                                    dispatch(
                                        openModal({
                                            type: 'confirm_modal'
                                        })
                                    )
                                }}
                            />
                        </Box>
                        <Box sx={{ padding: 1, paddingTop: 1 }}>
                            <Grid container spacing={2}>
                                {activeTab === 0 &&
                                    basicInformationData.map((field, index) => (
                                        <Grid item xs={12} sm={3} key={index}>
                                            <TextField
                                                fullWidth
                                                label={field.label}
                                                value={field.value}
                                                InputProps={{ readOnly: true }}
                                                InputLabelProps={{ shrink: true }} // Forces label to stay on top
                                                sx={
                                                    field.label === 'Status'
                                                        ? {
                                                              '& input': {
                                                                  backgroundColor: 'success.light',
                                                                  color: 'success.dark',
                                                                  fontWeight: 'bold',
                                                                  padding: '10px 6px'
                                                              },
                                                              '& .MuiOutlinedInput-root': {
                                                                  '&:hover': {
                                                                      borderColor: 'transparent' // Removes hover effect
                                                                  },
                                                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                      border: '1px solid #000' // Removes focus border
                                                                  }
                                                              },
                                                              '& .MuiInputBase-input': {
                                                                  cursor: 'text', // Allows text selection cursor
                                                                  userSelect: 'text' // Enables normal text selection
                                                              }
                                                          }
                                                        : customSx
                                                }
                                            />
                                        </Grid>
                                    ))}
                                {activeTab === 1 &&
                                    billToAddressData.map((field, index) => (
                                        <Grid item xs={12} sm={3} key={index}>
                                            <TextField
                                                fullWidth
                                                label={field.label}
                                                value={field.value}
                                                InputProps={{ readOnly: true }}
                                                InputLabelProps={{ shrink: true }} // Forces label to stay on top
                                                sx={customSx}
                                            />
                                        </Grid>
                                    ))}
                                {activeTab === 2 &&
                                    shipToAddressData.map((field, index) => (
                                        <Grid item xs={12} sm={3} key={index}>
                                            <TextField
                                                fullWidth
                                                label={field.label}
                                                value={field.value}
                                                InputProps={{ readOnly: true }}
                                                InputLabelProps={{ shrink: true }} // Forces label to stay on top
                                                sx={customSx}
                                            />
                                        </Grid>
                                    ))}
                                {activeTab === 3 &&
                                    invoiceOthersData.map((field, index) => (
                                        <Grid
                                            item
                                            xs={12}
                                            sm={
                                                // eslint-disable-next-line no-nested-ternary
                                                field?.label === 'Is Gift' || field?.label === 'On Hold'
                                                    ? 1.5
                                                    : field?.label === 'Remarks'
                                                      ? 6
                                                      : 3
                                            }
                                            key={index}
                                        >
                                            <TextField
                                                fullWidth
                                                label={field.label}
                                                value={field.value}
                                                InputProps={{ readOnly: true }}
                                                InputLabelProps={{ shrink: true }} // Forces label to stay on top
                                                sx={customSx}
                                            />
                                        </Grid>
                                    ))}
                            </Grid>
                        </Box>
                        <Box
                            sx={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            {activeTab !== 3 && (
                                <CustomButton
                                    onClick={() => {
                                        handleTabChange(null, activeTab + 1)
                                    }}
                                >
                                    Next
                                </CustomButton>
                            )}
                        </Box>
                    </Box>
                </Grid>
                <Grid
                    item
                    xs={12}
                    md={6}
                    lg={12}
                    sx={{
                        marginTop: '-3rem'
                    }}
                >
                    <LMDStatus createdAt={createdAt} />
                </Grid>
                <Grid item xs={12} md={6} lg={12}>
                    <Divider
                        sx={{
                            marginTop: '-2rem',
                            borderColor: '#BCC1CA',
                            marginBottom: '0.2rem',
                            boxShadow: '1px 1px 4px #00000054'
                        }}
                    />
                    <OutboundOrderDetails />
                </Grid>
            </Grid>
            {modalType === 'confirm_modal' &&
                // eslint-disable-next-line no-nested-ternary
                (activeModal === 'cancelPopup' ? (
                    <InputConfirmModal
                        title='Cancel Order'
                        message='Please select a reason for cancellation before proceeding.'
                        icon='warning'
                        confirmText='Cancel Order'
                        cancelText='Back'
                        onConfirm={() => {
                            if (!reasonRef.current) {
                                // Fix: Check if ref is valid
                                setCancelError(true)
                                return
                            }

                            const reason = reasonRef.current.value
                            if (!reason) {
                                setCancelError(true)
                                return
                            }

                            dispatch(
                                openSnackbar({
                                    open: true,
                                    message: 'Order cancelled successfully',
                                    variant: 'alert',
                                    alert: { color: 'info', icon: 'info' },
                                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                                })
                            )

                            dispatch(closeModal())
                        }}
                        onCancel={() => {
                            if (reasonRef.current) {
                                reasonRef.current.value = '' // Fix: Check if ref exists before setting value
                            }
                            setCancelError(false)
                            dispatch(closeModal())
                        }}
                        childComponent={
                            <Autocomplete
                                options={cancellationReasons}
                                getOptionLabel={option => option}
                                onChange={(event, newValue) => {
                                    if (reasonRef.current) {
                                        reasonRef.current.value = newValue || ''
                                    }
                                    setCancelError(!newValue)
                                }}
                                size='small'
                                renderInput={params => (
                                    <TextField
                                        {...params}
                                        label='Cancellation Reason'
                                        variant='outlined'
                                        error={cancelError}
                                        helperText={cancelError ? 'Please select a reason' : ''}
                                        inputRef={reasonRef} // Fix: Use inputRef properly
                                        sx={{
                                            '& input': {
                                                backgroundColor: '#fff',
                                                padding: '12px 8px'
                                            },
                                            '& .MuiInputBase-root.MuiOutlinedInput-root': {
                                                backgroundColor: 'white' // Apply the white background to the root element
                                            },
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'gray' // Optional: change border color if needed
                                            }
                                        }}
                                    />
                                )}
                            />
                        }
                    />
                ) : activeModal === 'clonePopup' ? (
                    <ConfirmModal
                        title='Clone Order'
                        message='Are you sure you want to clone this order'
                        icon='info'
                        confirmText='Yes'
                        customStyle={{ width: { xs: '300px', sm: '456px' } }}
                        onConfirm={() => {
                            dispatch(closeModal())
                            dispatch(
                                openSnackbar({
                                    open: true,
                                    message: 'Order cloned successfully',
                                    variant: 'alert',
                                    alert: { color: 'info', icon: 'info' },
                                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                                })
                            )
                        }}
                    />
                ) : null)}
        </MainCard>
    )
}

export default Index
