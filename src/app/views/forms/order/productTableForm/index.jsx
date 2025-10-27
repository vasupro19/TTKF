/* eslint-disable no-unused-vars */
/* eslint-disable react/forbid-prop-types */
import { useRef, useEffect, useState, memo, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Formik } from 'formik'
import Button from '@mui/material/Button'
import { debounce, styled, TableCell, TextField, useTheme } from '@mui/material'
import { z } from 'zod'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'
import CustomAutocomplete from '@/core/components/extended/CustomAutocomplete'
import { useScanOrderItemMutation } from '@/app/store/slices/api/orderSlice'
import { isEdit } from '@/constants'
import { getItemsList } from '@/app/store/slices/api/commonSlice'
import { getVendorAndProductById } from '@/app/store/slices/api/purchaseOrderSlice'
import CustomButton from '@/core/components/extended/CustomButton'

const initialValues = {
    item_no: '',
    EAN_UPC: '',
    description: '',
    quantity: '',
    mrp: '',
    sellingPrice: '',
    batch: '',
    discount: '',
    tax: '',
    shelfLife: ''
}

// Custom styled components moved outside the component to avoid recreation on each render
const CustomTextField = styled(TextField)({
    '& input': {
        backgroundColor: '#fff',
        padding: '4px 8px',
        height: '10px',
        boxShadow: 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px'
    },
    width: 'auto',
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'gray'
    }
})

const customSx = {
    '& input': {
        backgroundColor: '#fff',
        padding: '4px 8px',
        height: '8px'
    },
    '& .MuiInputBase-root.MuiOutlinedInput-root': {
        backgroundColor: 'white'
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'gray'
    }
}

const customInputSx = {
    '&.MuiAutocomplete-hasPopupIcon .MuiOutlinedInput-root, &.MuiAutocomplete-hasClearIcon .MuiOutlinedInput-root': {
        paddingRight: '6px !important',
        boxShadow: 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px'
    }
}

// Validation schema defined outside component
const validationSchema = z.object({
    item_no: z.preprocess(
        val => (typeof val === 'object' && val !== null ? val : null),
        z
            .object({
                value: z.number().min(1, { message: 'product code is required!' }),
                label: z.string(),
                text: z.string()
            })
            .nullable()
            .refine(val => val !== null, {
                message: 'product code is required!'
            })
    ),
    quantity: z.number().min(1, { message: 'product quantity is required!' }),
    sellingPrice: z.number().min(1, { message: 'Selling Price is required!' })
})

// Memoized TableCellField component to prevent unnecessary re-renders
const TableCellField = memo(
    ({
        field,
        values,
        handleCustomChange,
        setFieldValue,
        handleChange,
        setFieldTouched,
        touched,
        errors,
        globalCellStyles,
        bdStr,
        config
        // customSx,
        // customInputSx
    }) => (
        <TableCell
            sx={{
                borderTop: bdStr,
                borderBottom: bdStr,
                ...globalCellStyles
            }}
        >
            {field.type === 'CustomAutocomplete' ? (
                <CustomAutocomplete
                    name={field.name}
                    options={field.options}
                    placeholder={field.placeholder}
                    value={values[field.name]}
                    onChange={(event, value) => {
                        setFieldValue(field.name, value)
                        handleCustomChange(
                            { target: { name: field.name, value: value || '' } },
                            { setFieldValue, handleChange }
                        )
                    }}
                    customSx={field.customSx || customSx}
                    customInputSx={field.customInputSx || customInputSx}
                    showAdornment={false}
                    customInputProp={{
                        height: '30px'
                    }}
                    setFieldValue={setFieldValue}
                    setFieldTouched={setFieldTouched}
                    touched={touched[field.name]}
                    error={errors[field.name]}
                    showErrors={false}
                    isOptionEqualToValue={(option, selectedValue) => option.value === selectedValue.value}
                    isDisabled={field.name === 'item_no' ? !config.canScanItems : field.isDisabled}
                />
            ) : (
                <CustomTextField
                    variant='outlined'
                    name={field.name}
                    type={field.type}
                    size='small'
                    fullWidth
                    placeholder={field.placeholder}
                    disabled={field.isDisabled}
                    value={values[field.name]}
                    onChange={e => handleCustomChange(e, { setFieldValue, handleChange })}
                    touched={touched[field.name]}
                    error={errors[field.name]}
                />
            )}
        </TableCell>
    )
)

TableCellField.propTypes = {
    field: PropTypes.object.isRequired,
    values: PropTypes.object.isRequired,
    handleCustomChange: PropTypes.func.isRequired,
    setFieldValue: PropTypes.func.isRequired,
    handleChange: PropTypes.func.isRequired,
    setFieldTouched: PropTypes.func.isRequired,
    touched: PropTypes.object,
    errors: PropTypes.object,
    globalCellStyles: PropTypes.object.isRequired,
    bdStr: PropTypes.string.isRequired,
    customSx: PropTypes.object.isRequired,
    customInputSx: PropTypes.object.isRequired,
    config: PropTypes.object
}

function ProductTableForm({ setConfig, config, poData, products, fetchOrderItems }) {
    const { id: editId } = useParams()

    const theme = useTheme()
    const dispatch = useDispatch()
    const formikRef = useRef()
    const { scanOrderItemLKey } = useSelector(state => state.loading)
    const [scanOrderItem] = useScanOrderItemMutation()
    const [product, setProduct] = useState([])
    const [dualMrp, setDualMrp] = useState(true)
    const bdStr = '2px solid !important'

    // Memoize global cell styles to prevent recreating on each render
    const globalCellStyles = {
        padding: '6px 8px',
        border: 'none',
        borderColor: 'primary.dark',
        backgroundColor: theme.palette.grey[200]
    }

    const getItemsListReq = useMemo(
        () =>
            debounce(async (callback, request = `?term=&limit=40&page=1`) => {
                try {
                    const { data: response } = await dispatch(
                        getItemsList.initiate(request, { meta: { disableLoader: false } })
                    )
                    callback(response?.items || [])
                } catch (error) {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: error.data?.message || 'An error occurred, please try again',
                            variant: 'alert',
                            alert: { color: 'error' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                }
            }, 400),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    const handleAutoCompleteSearch = search => {
        getItemsListReq(data => setProduct(data), `?term=${search?.value || ''}&limit=40&page=1`)
    }

    // Memoize table fields definition to prevent recreation on each render
    const tabsFields = [
        {
            name: 'item_no',
            label: 'Product Code',
            placeholder: 'Select here',
            type: 'CustomAutocomplete',
            options: product || [],
            onInputChange: handleAutoCompleteSearch,
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue)
        },
        {
            name: 'EAN_UPC',
            label: 'EAN/UPC',
            placeholder: 'EAN/UPC',
            type: 'text',
            isDisabled: true
        },
        {
            name: 'description',
            label: 'Description',
            placeholder: 'Description',
            type: 'text',
            isDisabled: true
        },
        {
            name: 'quantity',
            label: 'Quantity*',
            placeholder: 'Quantity*',
            type: 'number',
            isDisabled: !config.canScanItems
        },
        {
            name: 'mrp',
            label: 'MRP',
            placeholder: 'MRP',
            type: 'number',
            isDisabled: !dualMrp || !config.canScanItems
        },
        {
            name: 'sellingPrice',
            label: 'Selling Price*',
            placeholder: 'Selling Price*',
            type: 'number',
            isDisabled: !config.canScanItems
        },
        // isEdit(editId) && {
        //     name: 'Status',
        //     label: 'Status',
        //     placeholder: 'Status',
        //     type: 'text',
        //     isDisabled: true
        // },
        {
            name: 'batch',
            label: 'Lot/Batch',
            placeholder: 'Lot/Batch',
            type: 'text',
            isDisabled: !config.canScanItems
        },
        {
            name: 'discount',
            label: 'Discount',
            placeholder: 'Discount %',
            type: 'number',
            isDisabled: !config.canScanItems
        },
        {
            name: 'tax',
            label: 'Tax Percentage',
            placeholder: 'Tax %',
            type: 'number',
            isDisabled: !config.canScanItems
        },
        {
            name: 'shelfLife',
            label: 'shelf life',
            placeholder: 'shelf life %',
            type: 'number',
            isDisabled: !config.canScanItems
        }
    ]

    const validate = values => {
        try {
            validationSchema.parse(values)
            return {}
        } catch (error) {
            const formikErrors = error.formErrors.fieldErrors

            if (formikErrors.item_no) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'Please select a Product code',
                        variant: 'alert',
                        alert: { color: 'warning', icon: 'warning' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
            }

            return formikErrors
        }
    }

    const getProductData = async query => {
        try {
            const { data: response } = await dispatch(getVendorAndProductById.initiate(query))
            formikRef.current.setFieldValue('EAN_UPC', response?.data?.productDetails?.no_2)
            formikRef.current.setFieldValue('mrp', response?.data?.productDetails?.mrp_price)
            setDualMrp(!!response?.data?.productDetails?.dual_mrp)
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error.data?.message || 'An error occurred, please try again',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        }
    }

    const handleCustomChange = (e, { setFieldValue, handleChange }) => {
        const { name, value } = e.target

        if (name === 'item_no' && value && value?.value) getProductData(`?item_id=${value.value}`)
        else if (name === 'item_no' && !value) formikRef.current.resetForm()
        if (['quantity'].includes(name)) {
            if (value === '') {
                setFieldValue(name, '')
            } else {
                let numericValue = parseFloat(value)
                if (Number.isNaN(numericValue) || numericValue < 0) {
                    numericValue = 0
                }
                setFieldValue(name, numericValue)
            }
        } else if (['tax', 'discount'].includes(name)) {
            if (value === '') {
                setFieldValue(name, '')
            } else {
                let numericValue = parseFloat(value)
                if (Number.isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
                    numericValue = Math.max(0, Math.min(100, numericValue || 0))
                }
                setFieldValue(name, numericValue)
            }
        } else {
            handleChange(e)
        }
    }

    const handleFormSubmit = async (values, { resetForm }) => {
        try {
            const payload = {
                order_no: poData?.order_no || '',
                original_order_no: poData?.original_order_no || '',
                external_order_id: poData?.external_order_id || '',
                order_date: poData?.order_date,
                fulfilled_by: poData?.fulfilled_by,
                invoice_no: poData?.invoice_no,
                payment_mode: poData?.payment_mode?.label,
                shipment_mode: poData?.shipment_mode?.label,
                order_type: poData?.order_type?.label,
                bill_same_ship: poData.bill_same_ship === 'true' ? 'n' : 'y',
                discount_code: poData?.discount_code,
                remarks: poData?.remarks,
                channel_code: poData?.channel_code?.label || '',
                priority: poData?.priority?.value,
                courier_code: poData?.carrier_name?.label,
                currency: poData?.currency?.value,
                customer_no: poData?.customer_name?.split('(')[0]?.trim(),
                awb_no: poData?.tracking_no || '',
                gst_no: poData?.gst_no,
                total_price: Number(poData?.total_amount),

                bill_add1: poData?.bill_add1 || '',
                bill_add2: poData?.bill_add2 || '',
                bill_phone1: poData?.bill_phone1 || '',
                bill_phone2: poData?.bill_phone2 || '',
                bill_email: poData?.bill_email || '',
                bill_country: poData?.bill_country_id?.label || '',
                bill_state: poData?.bill_state_id?.label || '',
                bill_city: poData?.bill_city_id?.label || '',
                bill_pincode: poData?.bill_pincode || '',
                bill_to_name: poData?.bill_to_name || '',
                bill_lat: poData?.bill_lat || '',

                ship_to_name: poData?.ship_to_name || '',
                ship_add1: poData?.ship_add1 || '',
                ship_add2: poData?.ship_add2 || '',
                ship_phone1: poData?.ship_phone1 || '',
                ship_phone2: poData?.ship_phone2 || '',
                ship_email: poData?.ship_email || '',
                ship_country: poData?.ship_country_id?.label || '',
                ship_state: poData?.ship_state_id?.label || '',
                ship_city: poData?.ship_city_id?.label || '',
                ship_pincode: poData?.ship_pincode || '',
                ship_lat: poData?.ship_lat || '',

                items: [
                    {
                        item_id: values.item_no.value,
                        uid: poData?.uid,
                        quantity: Number(values.quantity) || 0,
                        lot_no: values.batch ? values.batch : null,
                        tax: values.tax ? Number(values.tax) : null,
                        mrp: Number(values.mrp) || 0,
                        selling_price: Number(values.sellingPrice),
                        uom: values.uom || '',
                        discount_amount: Number(values.discount) || null
                    }
                ]
            }

            if (config.orderId) {
                payload.id = config.orderId
            }

            const { data: response } = await scanOrderItem(payload).unwrap()

            setConfig({ ...config, orderId: response.orderDetail.id, submit: true })
            if (!config.orderId) await fetchOrderItems(`?id=${response.orderDetail.id}`)

            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Item scanned successfully!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )

            resetForm()
        } catch (error) {
            const backendErrors = error?.data?.data?.errors || []
            if (!backendErrors.length) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: error.data?.message || error.message || 'Unable to scan item!',
                        variant: 'alert',
                        alert: { color: 'error', icon: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
            } else {
                Object.entries(backendErrors).forEach(([field, messages]) => {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: messages.join(', '),
                            variant: 'alert',
                            alert: { color: 'error', icon: 'error' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                })
            }
        }
    }

    useEffect(() => {
        getItemsListReq(data => setProduct(data))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (products && products.length) setProduct([...products])
    }, [products])

    return (
        <Formik
            innerRef={formikRef}
            initialValues={initialValues}
            validate={validate}
            validateOnBlur={false}
            validateOnChange
            onSubmit={handleFormSubmit}
        >
            {({ values, handleChange, setFieldValue, setFieldTouched, handleSubmit, errors, touched }) => (
                <>
                    {tabsFields
                        ?.filter(field => field?.name)

                        .map(field => (
                            <TableCellField
                                key={field.name}
                                field={field}
                                values={values}
                                handleCustomChange={handleCustomChange}
                                setFieldValue={setFieldValue}
                                handleChange={handleChange}
                                setFieldTouched={setFieldTouched}
                                touched={touched}
                                errors={errors}
                                globalCellStyles={globalCellStyles}
                                bdStr={bdStr}
                                customSx={customSx}
                                customInputSx={customInputSx}
                                config={config}
                            />
                        ))}

                    <TableCell
                        sx={{
                            borderRight: bdStr,
                            borderTop: bdStr,
                            borderBottom: bdStr,
                            borderBottomRightRadius: '8px',
                            borderTopRightRadius: '8px',
                            ...globalCellStyles
                        }}
                    >
                        <CustomButton
                            variant='clickable'
                            size='small'
                            sx={{
                                padding: '4px'
                            }}
                            onClick={handleSubmit}
                            disabled={isEdit(editId) && !config.canScanItems}
                            type='submit'
                            loading={scanOrderItemLKey}
                        >
                            {!scanOrderItemLKey && '+ Add'}
                        </CustomButton>
                    </TableCell>
                </>
            )}
        </Formik>
    )
}

export default memo(ProductTableForm)

ProductTableForm.propTypes = {
    setConfig: PropTypes.func,
    config: PropTypes.object,
    poData: PropTypes.object,
    // products: PropTypes.arrayOf(PropTypes.any),
    fetchOrderItems: PropTypes.func,
    products: PropTypes.array
}
