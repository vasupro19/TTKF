import { createSlice } from '@reduxjs/toolkit'

const orderData = createSlice({
    name: 'orderData',
    initialState: {
        id: '',
        order_no: '',
        external_order_id: '',
        order_type: null,
        payment_mode: null,
        order_date: '',
        priority: '',
        channel_code: '',
        fulfilled_by: '',

        bill_add1: '',
        bill_add2: '',
        bill_to_name: '',
        bill_phone1: '',
        bill_phone2: '',
        bill_email: '',
        bill_pincode: '',
        bill_lat: '',
        bill_city_id: '',
        bill_state_id: '',
        bill_country_id: '',

        ship_add1: '',
        ship_add2: '',
        ship_to_name: '',
        ship_phone1: '',
        ship_phone2: '',
        ship_email: '',
        ship_pincode: '',
        ship_lat: '',
        ship_city_id: '',
        ship_state_id: '',
        ship_country_id: '',

        gst_no: '',
        bill_same_ship: false,
        customer_name: '',
        tracking_no: '',
        currency: 'INR (₹)',
        total_amount: '',
        carrier_name: '',
        isGift: false,
        gift_message: '',
        discount_code: '',
        remarks: '',
        invoice_no: '',
        total_discount: '',
        transport_mode: '',
        shipping_charges: '',
        other_charges: '',
        status: ''
    },
    reducers: {
        setOrderDetails: (state, action) => {
            state.orderDetails = action.payload
        },
        setOrderId: (state, action) => {
            state.id = action.payload
        }
    }
})

export const { setOrderDetails, setOrderId } = orderData.actions
export const OrderData = orderData.reducer
