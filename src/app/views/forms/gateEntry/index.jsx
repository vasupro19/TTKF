/* eslint-disable no-nested-ternary */
import React, { useState, useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useFormik } from 'formik'

// router
import { useParams, useNavigate, useLocation } from 'react-router-dom'

// theme components
import { Box, debounce, Divider, Grid } from '@mui/material'

// components
import FormComponent from '@core/components/forms/FormComponent'
import MainCard from '@core/components/extended/MainCard'
import IdentityCard from '@/core/components/IdentityCard'
import NotesInstructions from '@/core/components/NotesInstructions'
import MyTabs from '@/core/components/CapsuleTabs'
import SuccessCheckmark from '@/core/components/successCheckMark/SuccessCheckMark'

// redux imports
import { useDispatch, useSelector } from 'react-redux'
import {
    documentDropDown,
    getTransporterDropDown,
    getVendorDropDown,
    useSubmitGateEntryMutation,
    getGateEntryDetails,
    useUpdateGateEntryMutation
} from '@/app/store/slices/api/gateEntrySlice'
import { openSnackbar } from '@app/store/slices/snackbar'

import { objectLength } from '@/utilities'
import { closeModal, openModal } from '@/app/store/slices/modalSlice'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import {
    Description,
    DescriptionOutlined,
    InsertDriveFile,
    InsertDriveFileOutlined,
    LocalShipping,
    LocalShippingOutlined,
    Receipt,
    ReceiptOutlined
} from '@mui/icons-material'

function GateEntryForm() {
    const { id: formId } = useParams()
    const { pathname } = useLocation()
    const isEditable = pathname.includes('edit') && formId
    const {
        submitGateEntryLKey,
        updateGateEntryLKey,
        getTransporterDropDownLKey,
        getVendorDropDownLKey,
        documentDropDownLKey
    } = useSelector(state => state.loading)

    const navigate = useNavigate()
    const [editData, setEditData] = useState({})

    const [activeTab, setActiveTab] = useState(0)
    /* eslint-disable no-nested-ternary */
    const [tabsEnabled, setTabsEnabled] = useState(isEditable ? [true, true, false, true] : [true, false, false, true])
    const [documentNumbers, setDocumentNumbers] = useState([])
    const [transporterOptions, setTransporterOptions] = useState([])
    const [vendorOptions, setVendorOptions] = useState([])
    const [allowCases, setAllowCases] = useState(false)
    const [previousNoOfCases, setPreviousNoOfCases] = useState(null)
    const [submitGateEntry] = useSubmitGateEntryMutation()
    const [updateGateEntry] = useUpdateGateEntryMutation()

    const dispatch = useDispatch()
    const tabLabels = ['documentDetails', 'invoiceDetails', 'transporterDetails', 'fileOthers']

    // Initial form values
    const initialValues = {
        tabId: 'documentDetails',
        document_type: null,
        document_number: '',
        ext_document_no: '',
        vendor_name: '',
        type_of_reference: null,
        material_description: '',
        material_type: null,
        invoice_no: '',
        invoice_quantity: null,
        invoice_value: '',
        invoice_value_currency: 'INR',
        invoice_date: '',
        timestamp: '',
        docket_no: '',
        driver_name: '',
        driver_mobile_no: '',
        no_of_cases: null,
        transporter_name: '',
        transport_method: null,
        remarks: '',
        lr_no: '',
        lrDoc: null,
        invoiceDoc: null,
        poNo: null,
        ewayBill: null
    }

    // Validation schema
    const validationSchema = [
        z.object({
            // document_type: z.string().min(1, 'Document Type is required'),
            document_type: z
                .string()
                .nullable()
                .refine(val => val, 'Document Type is required'),
            document_number: z
                .union([
                    z.object({
                        value: z.number().min(1, { message: 'Document Number is required' }),
                        label: z.string()
                    }),
                    z.string().min(1, { message: 'Document Number is required' }),
                    z.null()
                ])
                .superRefine((val, ctx) => {
                    if (!val) {
                        ctx.addIssue({
                            code: 'invalid_type',
                            message: 'Document Number is required'
                        })
                    }
                }),
            vendor_name: z
                .union([
                    z.object({
                        value: z.string().min(1, { message: 'Vendor Name is required' }),
                        label: z.string()
                    }),
                    z.string().min(1, { message: 'Vendor Name is required' })
                ])
                .superRefine((val, ctx) => {
                    if (!val) {
                        ctx.addIssue({
                            code: 'invalid_type',
                            message: 'Vendor Name is required'
                        })
                    }
                }),
            type_of_reference: z.string().optional().nullable(),
            material_description: z.string().optional(),
            material_type: z.string({ invalid_type_error: 'Material Type is required' }).optional().nullable()
        }),
        z.object({
            invoice_no: z.string().min(1, 'Invoice No. is required'),
            invoice_value: z.string().min(1, 'Invoice Value is required'),
            invoice_quantity: z.preprocess(
                value => (typeof value === 'string' ? Number(value) : value),
                z.number({ invalid_type_error: 'Invoice Quantity is required' }).min(1, 'Invoice Quantity is required')
            ),
            invoice_date: z.string({ required_error: 'Invoice Date is required' }).min(1, 'Invoice Date is required'),
            no_of_cases: z
                .number({ invalid_type_error: 'Number of Cases is required' })
                .min(1, 'Number of Cases is required')
        }),
        z.object({
            docket_no: z.string().optional(),
            driver_name: z.string().optional(),
            driver_mobile_no: z.string().optional(),
            transporter_name: z
                .union([
                    z.object({
                        value: z.number().min(1, { message: 'Transporter Name is required' }),
                        label: z.string()
                    }),
                    z.string().min(1, { message: 'Transporter Name is required' })
                ])
                .superRefine((val, ctx) => {
                    if (!val) {
                        ctx.addIssue({
                            code: 'invalid_type',
                            message: 'Transporter Name is required'
                        })
                    }
                }),
            transport_method: z
                .string({ invalid_type_error: 'Mode is required' })
                .min(1, 'Mode of Transport is required'),
            e_way_bill: z.string().optional(),
            lr_no: z.string().optional(),
            remarks: z.string().optional().nullable()
        }),
        z.object({
            lrDoc: z.any().optional().nullable(),
            invoiceDoc: z.any().optional().nullable(),
            poNo: z.any().optional().nullable(),
            ewayBill: z.any().optional().nullable()
        })
    ]

    // validationSchema schema for edit
    const editValidationSchema = [
        z.object({}),
        z.object({
            invoice_no: z.string().min(1, 'Invoice No. is required'),
            invoice_value: z.string().min(1, 'Invoice Value is required'),
            invoice_quantity: z.union([z.string(), z.number()]).refine(value => Number(value) >= 1, {
                message: 'Invoice Quantity must be at least 1'
            }),
            invoice_date: z.string({ required_error: 'Invoice Date is required' }).min(1, 'Invoice Date is required')
        }),
        z.object({
            remarks: z.string().optional().nullable()
        }),
        z.object({})
    ]

    const enableTabsAfterValidation = upToIndex => {
        const updatedTabs = tabsEnabled.map((enabled, index) => index <= upToIndex)
        setTabsEnabled(updatedTabs)
    }

    const getVendorOptions = useMemo(
        () =>
            debounce(async (request = `?term=&limit=40&page=1`) => {
                const { data: response } = await dispatch(
                    getVendorDropDown.initiate(request, { meta: { disableLoader: true } })
                )

                const mappedOptions =
                    response?.items?.map(item => ({
                        value: item.value.toString(),
                        label: item.label,
                        text: item.text
                    })) || []

                setVendorOptions(mappedOptions)
            }, 400),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    const handleVendorSearch = search => {
        if (search.value.startsWith('VEND')) return
        getVendorOptions(`?term=${search?.value || ''}&limit=40&page=1`)
    }

    const getTransporterOptions = useMemo(
        () =>
            debounce(async (callback, request = `?term=&limit=40&page=1`) => {
                const { data: response } = await dispatch(
                    getTransporterDropDown.initiate(request, { meta: { disableLoader: true } })
                )

                callback(response?.items || [])
            }, 400),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    const handleTransporterSearch = search => {
        getTransporterOptions(
            data => {
                const items = data?.items || []
                setTransporterOptions(items.length ? items : transporterOptions)
            },
            `?term=${search?.value || ''}&limit=40&page=1`
        )
    }

    useEffect(() => {
        getVendorOptions()
        getTransporterOptions(data => setTransporterOptions(data))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Function to fetch and populate document-related data
    const fetchDocumentNumbers = async documentType => {
        try {
            if (documentType === 'Non-ASN') {
                setDocumentNumbers([])
                return
            }

            const response = await dispatch(documentDropDown.initiate(`?document_type=${documentType}`)).unwrap()

            if (response.success && response.data?.document_no) {
                const documentOptions = response.data.document_no.map(doc => ({
                    value: doc.value,
                    label: doc.label,
                    vendor_name: doc.vendor_name,
                    vendor_id: doc.vendor_id,
                    // Add additional fields based on document type
                    ...(documentType === 'ASN' && {
                        transporter_name: doc.transporter_name,
                        invoice_no: doc.invoice_no,
                        invoice_value: doc.invoice_value,
                        invoice_date: doc.invoice_date,
                        invoice_quantity: doc.invoice_quantity,
                        no_of_cases: doc.no_of_cases,
                        docket_no: doc.docket_no,
                        driver_name: doc.driver_name,
                        driver_mobile_no: doc.driver_mobile_no,
                        transport_method: doc.transport_method
                    })
                }))
                setDocumentNumbers(documentOptions)
            } else {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: response.message || 'Failed to fetch document numbers',
                        variant: 'alert',
                        alert: { color: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
            }
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error.data?.message || 'Error fetching document numbers',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        }
    }

    const validate = values => {
        try {
            // eslint-disable-next-line no-console
            console.log('in validations ', values)
            if (isEditable) {
                editValidationSchema[activeTab].parse(values)
            } else {
                validationSchema[activeTab].parse(values)
            }
            return {}
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log('formik error ', error)
            const formikErrors = {}
            error.errors.forEach(err => {
                formikErrors[err.path[0]] = err.message
            })
            return formikErrors
        }
    }

    const formik = useFormik({
        initialValues,
        validate,
        onSubmit: async values => {
            try {
                if (activeTab < tabLabels.length - 1) {
                    const nextTab = activeTab + 1
                    formik.setFieldValue('tabId', tabLabels[nextTab])
                    enableTabsAfterValidation(nextTab)
                    setActiveTab(nextTab)
                    Object.keys(formik.touched).forEach(field => {
                        formik.setFieldTouched(field, false)
                    })
                } else {
                    // Create a FormData object for file uploads
                    const formData = new FormData()

                    // Add all fields to the formData
                    formData.append('document_type', values.document_type)
                    formData.append(
                        'document_id',
                        values.document_type !== 'Non-ASN' ? values.document_number?.value || '' : ''
                    )
                    formData.append(
                        'document_no',
                        values.document_type !== 'Non-ASN'
                            ? values.document_number?.label || ''
                            : values.document_number || ''
                    )
                    formData.append(
                        'ext_document_no',
                        values.document_type === 'Non-ASN' ? values.document_number || '' : ''
                    )
                    formData.append(
                        'vendor_id',
                        values.document_type === 'Non-ASN'
                            ? values.vendor_name?.value || ''
                            : values.document_number?.vendor_id || ''
                    )
                    formData.append('type_of_reference', values.type_of_reference || '')
                    formData.append('material_description', values.material_description || '')
                    formData.append('material_type', values.material_type || '')
                    formData.append('invoice_no', values.invoice_no || '')
                    formData.append('invoice_date', values.invoice_date || '')
                    formData.append('invoice_value', values.invoice_value || '')
                    formData.append('invoice_quantity', values.invoice_quantity || null)
                    formData.append('no_of_cases', values.no_of_cases || null)
                    formData.append('transporter_name', values.transporter_name?.label || values.transporter_name || '')
                    formData.append(
                        'transporter_id',
                        values.document_type === 'Non-ASN'
                            ? parseInt(values?.transporter_id, 10) || ''
                            : values.transporter_name?.value || ''
                    )
                    formData.append('mode_of_transport', values.transport_method || '')
                    formData.append('docket_no', values.docket_no || '')
                    formData.append('driver_name', values.driver_name || '')
                    formData.append('driver_mobile_no', values.driver_mobile_no || '')
                    formData.append('e_way_no', values.e_way_bill || '')
                    formData.append('lr_no', values.lr_no || '')
                    formData.append('remarks', values.remarks || '')

                    if (values.lrDoc) formData.append('files[lr_doc]', values.lrDoc)
                    if (values.invoiceDoc) formData.append('files[invoice_doc]', values.invoiceDoc)
                    if (values.poNo) formData.append('files[pono_doc]', values.poNo)
                    if (values.ewayBill) formData.append('files[ewaybill_doc]', values.ewayBill)

                    // Make the API call
                    const response = isEditable
                        ? await updateGateEntry({
                              id: formId,
                              document_type: values.document_type,
                              invoice_no: values.invoice_no,
                              invoice_date: values.invoice_date,
                              invoice_value: values.invoice_value,
                              invoice_quantity: values.invoice_quantity,
                              remarks: values.remarks
                          }).unwrap()
                        : await submitGateEntry(formData).unwrap()

                    if (response.success) {
                        dispatch(
                            openSnackbar({
                                open: true,
                                message: isEditable ? 'Updated Successfully' : 'Submitted Successfully',
                                variant: 'alert',
                                alert: { color: 'success' },
                                anchorOrigin: { vertical: 'top', horizontal: 'center' }
                            })
                        )
                        formik.resetForm()
                        navigate('/inbound/gateEntry')
                    } else {
                        throw new Error(response.message || 'Failed to submit')
                    }
                }
            } catch (error) {
                if (error.data?.data?.errors || error.data?.errors?.errors) {
                    const backendErrors = error.data.data.errors || error.data.errors.errors
                    const formikErrors = {}
                    Object.entries(backendErrors).forEach(([field, messages]) => {
                        formikErrors[field] = messages.join(', ')
                    })

                    formik.setErrors(formikErrors)
                }
                dispatch(
                    openSnackbar({
                        open: true,
                        message:
                            error?.data?.message ||
                            error?.message ||
                            'something went wrong, please try again after some time!',
                        variant: 'alert',
                        alert: { color: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
            }
        },
        validateOnBlur: false,
        validateOnChange: true,
        enableReinitialize: true
    })

    const handleFileChange = event => {
        const { name, files } = event.target
        if (files && files.length > 0) {
            formik.setFieldValue(name, files[0])
        } else {
            formik.setFieldValue(name, null)
        }
    }

    const handleTabChange = (event, newValue) => {
        if (tabsEnabled[newValue]) {
            setActiveTab(newValue)
            formik.setFieldValue('tabId', tabLabels[newValue])
        }
    }

    useEffect(() => {
        if (isEditable && !objectLength(editData)) {
            dispatch(getGateEntryDetails.initiate(formId))
                .unwrap()
                .then(response => {
                    const { data } = response
                    setEditData(data)
                    const documentFilenames = data.document_upload || []
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

                    const parsedData = {
                        ...data,
                        ...fileFields,
                        document_number:
                            data.document_type === 'Non-ASN'
                                ? data.ext_document_no || ''
                                : { value: data.document_id || '', label: data.document_no || '' },
                        vendor_name: data.vendors_lable || data.vendor_name,
                        transport_method: data.mode_of_transport,
                        e_way_bill: data.e_way_no || data.e_way_bill
                    }

                    formik.setValues(parsedData)
                })
                .catch(error => {
                    // eslint-disable-next-line no-console
                    console.error('Error fetching gate entry details:', error)
                })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formId, isEditable, dispatch, editData])

    const customSx = {
        '& input': {
            backgroundColor: '#fff',
            padding: '12px 8px',
            height: '18px' // Decrease input height
        },
        '& .MuiInputBase-root.MuiOutlinedInput-root': {
            backgroundColor: 'white' // Apply the white background to the root element
        },
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'gray' // Optional: change border color if needed
        },
        flexGrow: 1
    }

    const tabsFields = [
        {
            label: 'Document Details',
            icon: {
                outlined: <DescriptionOutlined />,
                filled: <Description />
            },
            fields: [
                {
                    name: 'document_type',
                    label: 'Document Type',
                    type: 'CustomAutocomplete',
                    required: true,
                    options: [
                        { value: 'ASN', label: 'ASN' },
                        { value: 'PO', label: 'PO' },
                        { value: 'Non-ASN', label: 'Non-ASN' }
                        // { value: 'Return', label: 'Return' },
                        // { value: 'Custom', label: 'Custom' }
                    ],
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx,
                    showAdornment: false,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    isDisabled: isEditable
                },
                {
                    name: 'type_of_reference',
                    label: 'Type of Reference',
                    type: 'CustomAutocomplete',
                    options: [
                        { value: 'Invoice', label: 'Invoice' },
                        { value: 'Returnable Challan', label: 'Returnable Challan' },
                        { value: 'Delivery Challan', label: 'Delivery Challan' }
                    ],
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    showAdornment: false,
                    isDisabled: isEditable
                },
                {
                    name: 'material_description',
                    label: 'Material Description',
                    type: 'text',
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx,
                    isDisabled: isEditable
                },
                {
                    name: 'document_number',
                    label: 'Document Number',
                    type: formik.values?.document_type === 'Non-ASN' ? 'text' : 'CustomAutocomplete', // because when page rerenders tabsFields[0].fields[1].type is not updating are also rendering thats thats why we have updated tabsFields
                    required: true,
                    options: documentNumbers || [],
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx,
                    showAdornment: false,
                    isDisabled: !formik.values?.document_type || isEditable,
                    isOptionEqualToValue: (option, value) => option?.value === (value?.value || value),
                    loading: !!documentDropDownLKey
                },
                {
                    name: 'vendor_name',
                    label: 'Vendor Name',
                    type: formik.values?.document_type === 'Non-ASN' ? 'CustomAutocomplete' : 'text',
                    options: formik.values?.document_type === 'Non-ASN' ? vendorOptions : [],
                    required: true,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx: {
                        ...customSx,
                        '& .MuiInputBase-root':
                            formik.values?.document_type !== 'Non-ASN'
                                ? {
                                      backgroundColor: '#f0f0f0bf !important'
                                  }
                                : {}
                    },
                    isDisabled: formik.values?.document_type !== 'Non-ASN',
                    isOptionEqualToValue: (option, selectedValue) =>
                        option.value === (selectedValue?.value || selectedValue),
                    endAdornment: <SuccessCheckmark />,
                    onInputChange: handleVendorSearch,
                    loading: !!getVendorDropDownLKey
                },
                {
                    name: 'material_type',
                    label: 'Material Type',
                    type: 'CustomAutocomplete',
                    options: [
                        { value: 'Finished goods', label: 'Finished goods' },
                        { value: 'Raw Material', label: 'Raw Material' }
                    ],
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx,
                    showAdornment: false,
                    // isOptionEqualToValue: (option, value) => option?.value === (value?.value || value),
                    isDisabled: isEditable,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue)
                }
            ]
        },
        {
            label: 'Invoice Details',
            icon: {
                outlined: <ReceiptOutlined />,
                filled: <Receipt />
            },
            fields: [
                {
                    name: 'invoice_no',
                    label: 'Invoice No.*',
                    type: 'text',
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'invoice_value',
                    label: 'Invoice Value*',
                    type: 'currency',
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'invoice_quantity',
                    label: 'Invoice Quantity*',
                    type: 'number',
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'invoice_date',
                    label: 'Invoice Date*',
                    type: 'date',
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: { ...customSx }
                },
                {
                    name: 'no_of_cases',
                    label: 'No. of Cases*',
                    type: 'number',
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: isEditable
                }
                // {
                //     name: 'timestamp',
                //     label: 'Timestamp',
                //     type: 'time',
                //     grid: { xs: 12, sm: 6, md: 3 },
                //     size: 'small',
                //     customSx: { minHeight: '70px', ...customSx }
                // }
            ]
        },
        {
            label: 'Transporter Details',
            icon: {
                outlined: <LocalShippingOutlined />,
                filled: <LocalShipping />
            },
            fields: [
                {
                    name: 'transporter_name',
                    label: 'Transporter Name*',
                    type: isEditable ? 'text' : 'CustomAutocomplete',
                    options: transporterOptions || [],
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx,
                    isOptionEqualToValue: (option, selectedValue) =>
                        option.value === (selectedValue?.value || selectedValue),
                    isDisabled: isEditable,
                    onInputChange: handleTransporterSearch,
                    loading: !!getTransporterDropDownLKey
                },
                {
                    name: 'transport_method',
                    label: 'Mode of Transport*',
                    type: 'CustomAutocomplete',
                    options: [
                        { value: 'COURIER', label: 'Courier' },
                        { value: 'ROAD', label: 'Road' },
                        { value: 'AIR', label: 'Air' },
                        { value: 'RAIL', label: 'Rail' },
                        { value: 'SHIP', label: 'Ship' }
                    ],
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx,
                    showAdornment: false,
                    isDisabled: isEditable,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue)
                },
                {
                    name: 'docket_no',
                    label: 'Dock No.',
                    type: 'text',
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx,
                    isDisabled: isEditable
                },
                {
                    name: 'driver_name',
                    label: 'Driver Name',
                    type: 'text',
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: isEditable
                },
                {
                    name: 'driver_mobile_no',
                    label: 'Driver Mobile No.',
                    type: 'phone',
                    placeholder: '+91 83374-92382',
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: isEditable
                },
                {
                    name: 'e_way_bill',
                    label: 'E-Way Bill No.',
                    type: 'text',
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: isEditable
                },
                {
                    name: 'lr_no',
                    label: 'LR No.',
                    type: 'text',
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: isEditable
                },
                {
                    name: 'remarks',
                    label: 'Remarks',
                    type: 'textarea',
                    placeholder: 'Enter your remarks here',
                    grid: { xs: 12, sm: 12 },
                    size: 'small',
                    customSx,
                    rows: 1
                }
            ]
        },
        {
            label: 'File & Others',
            icon: {
                outlined: <InsertDriveFileOutlined />,
                filled: <InsertDriveFile />
            },
            fields: [
                {
                    name: 'lrDoc',
                    label: 'LR Copy',
                    type: 'file',
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx,
                    isEdit: isEditable,
                    isDisabled: isEditable,
                    onChange: handleFileChange
                },
                {
                    name: 'poNo',
                    label: 'PO Copy',
                    type: 'file',
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx,
                    isEdit: isEditable,
                    isDisabled: isEditable,
                    onChange: handleFileChange
                },
                {
                    name: 'invoiceDoc',
                    label: 'Invoice Copy',
                    type: 'file',
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx,
                    isEdit: isEditable,
                    isDisabled: isEditable,
                    onChange: handleFileChange
                },
                {
                    name: 'ewayBill',
                    label: 'E-way Bill Copy',
                    type: 'file',
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx,
                    isEdit: isEditable,
                    isDisabled: isEditable,
                    onChange: handleFileChange
                }
            ]
        }
    ]

    // this useEffect handles edit data
    useEffect(() => {
        const path = window.location.pathname
        if (!formId && !path.includes('create') && !objectLength(editData)) navigate(-1) // never happening
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editData])

    const identityCardData = [
        { label: 'Document Type', value: formik.values?.document_type ?? 'N/A' }, // From Document Details
        { label: 'Document Number', value: formik.values?.document_number?.label ?? 'N/A' }, // From Document Details
        { label: 'Invoice No.', value: formik.values?.invoice_no ?? 'N/A' }, // From Invoice Details
        {
            label: 'Transporter Name',
            value: formik.values?.transporter_name?.label || formik.values?.transporter_name || 'N/A'
        }, // From Transport Details
        { label: 'Driver Mobile No.', value: formik.values?.driver_mobile_no ?? 'N/A' } // From Transport Details
    ]

    // Updated notes
    const notes = [
        {
            id: 'n1',
            text: 'Select the Document Type (required) from the dropdown menu. Note that the selection may affect other required fields like Vendor Name.'
        },
        {
            id: 'n2',
            text: 'Enter the Document Number (required). For "Non-ASN" Document Type, it must be entered manually and should not be left blank.'
        },
        {
            id: 'n3',
            text: 'Enter the Invoice No. (required) for tracking and financial records. Ensure it is accurate.'
        },
        {
            id: 'n4',
            text: 'Select the Transporter Name from the dropdown options (required). Ensure the selection aligns with transport details.'
        },
        {
            id: 'n5',
            text: 'Enter the Driver Mobile No. Ensure the format is valid and adheres to the required number format if applicable.'
        },
        {
            id: 'n6',
            text: 'Ensure all required fields (marked with *) are completed before submission to avoid form rejection.'
        },
        {
            id: 'n7',
            text: 'If applicable, double-check the entered details, such as Invoice Value and Number of Cases, to ensure accuracy and avoid delays.'
        },
        {
            id: 'n8',
            text: 'Maintain a record of required documents such as LR Copy, Invoice Doc, or PO Copy for future reference and auditing purposes.'
        },
        {
            id: 'n9',
            text: 'If unsure about the Document Type selection, consult your supervisor or relevant guidelines to avoid data mismatches.'
        },
        {
            id: 'n10',
            text: 'Input valid and accurate details such as Vendor Name and Mobile Number to facilitate seamless processing and transport operations.'
        },
        {
            id: 'n11',
            text: 'For fields like E-Way Bill and LR No., provide only valid and approved details to ensure compliance with transport regulations.'
        },
        {
            id: 'n12',
            text: 'Utilize the remarks section to provide any additional information or special instructions relevant to the form.'
        },
        {
            id: 'n13',
            text: 'For optional fields, leave them blank if not applicable, unless otherwise instructed to provide specific data.'
        }
    ]

    // eslint-disable-next-line no-shadow
    const handleCustomChange = (e, formik) => {
        const { name, value, files } = e.target
        const filesInputs = ['lrDoc', 'invoiceDoc', 'poNo', 'ewayBill']
        if (filesInputs.includes(name)) {
            if (files.length > 0) {
                formik.setFieldValue(name, files[0])
            } else {
                formik.setFieldValue(name, null)
            }
            return
        }

        if (name === 'no_of_cases') {
            const newValue = parseInt(value, 10)

            if (newValue > 500 && !allowCases) {
                setPreviousNoOfCases(formik.values.no_of_cases)
                dispatch(openModal({ type: 'confirm_modal' }))
                return
            }

            formik.setFieldValue(name, newValue)
            return
        }

        if (name === 'document_type') {
            const documentType = value?.value
            // Reset form fields
            formik.setValues({
                ...formik.values,
                document_type: documentType,
                document_number: '',
                ext_document_no: '',
                vendor_name: '',
                vendor_id: '',
                transporter_name: '',
                invoice_no: '',
                invoice_value: '',
                invoice_date: '',
                invoice_quantity: '',
                no_of_cases: '',
                docket_no: '',
                driver_name: '',
                driver_mobile_no: '',
                transport_method: ''
            })

            // Fetch document numbers for ASN or PO
            if (documentType && ['ASN', 'PO'].includes(documentType)) {
                fetchDocumentNumbers(documentType)
            } else if (documentType === 'Non-ASN') {
                setDocumentNumbers([])
                getVendorOptions()
            }

            formik.setFieldValue(name, documentType)
            return
        }

        if (name === 'ext_document_no' && formik.values.document_type === 'Non-ASN') {
            formik.setFieldValue(name, value)
            return
        }

        if (name === 'document_number') {
            // For ASN/PO, handle selection from options
            const selectedDocument = value
            if (selectedDocument && formik.values.document_type !== 'Non-ASN') {
                formik.setFieldValue('vendor_name', selectedDocument.vendor_name || '')

                if (formik.values.document_type === 'ASN' && selectedDocument.transporter_name) {
                    formik.setFieldValue('transporter_name', selectedDocument.transporter_name)
                    formik.setFieldValue('transporter_id', selectedDocument.transporter_id)
                    formik.setFieldValue('invoice_no', selectedDocument.invoice_no || '')
                    formik.setFieldValue('invoice_value', selectedDocument.invoice_value || '')
                    formik.setFieldValue('invoice_date', selectedDocument.invoice_date || '')
                    formik.setFieldValue('invoice_quantity', selectedDocument.invoice_quantity || '')
                    formik.setFieldValue('no_of_cases', selectedDocument.no_of_cases || '')

                    // Transporter Details

                    formik.setFieldValue('docket_no', selectedDocument.docket_no || '')
                    formik.setFieldValue('driver_name', selectedDocument.driver_name || '')
                    formik.setFieldValue('driver_mobile_no', selectedDocument.driver_mobile_no || '')
                    formik.setFieldValue('transport_method', selectedDocument.transport_method || '')
                }
            }
        }

        // Handle general cases: for specific fields, assign their values
        if (['document_type', 'material_type', 'transport_method', 'type_of_reference'].includes(name)) {
            e.target.value = e.target?.value?.value
        }
        if (e.target.name === 'invoice_no') {
            // Allow alphanumeric values and special characters "/" and "-"
            let formattedInvoiceNo = e.target.value.replace(/[^A-Za-z0-9/-]/g, '') // Remove unwanted characters

            // Convert the entire string to uppercase
            formattedInvoiceNo = formattedInvoiceNo.toUpperCase()

            // Set the formatted invoice number in Formik
            formik.setFieldValue(e.target.name, formattedInvoiceNo)
            return
        }

        // if (name === 'document_number' && !value) formik.handleChange({ ...e, target: { ...e.target, value: '' } })
        // Call Formik's handleChange to ensure all other behaviors are preserved
        formik.handleChange(e)
    }

    return (
        <MainCard sx={{ py: '1px' }} contentSX={{ px: '2px', py: 1.5 }}>
            <Grid
                container
                gap={4}
                sx={{
                    border: '1px solid #d0d0d0',
                    px: 1.5,
                    py: 2,
                    borderRadius: '8px'
                }}
            >
                <Grid container xs={12} md={3.6} spacing={2}>
                    <Grid item xs={12} md={6} lg={12} sx={{ marginBottom: 2 }}>
                        <IdentityCard data={identityCardData} />
                    </Grid>
                </Grid>
                <Grid md={8.3} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
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

                        <Box sx={{ padding: 2 }}>
                            <FormComponent
                                fields={tabsFields[activeTab].fields}
                                formik={formik}
                                handleCustomChange={handleCustomChange}
                                submitting={submitGateEntryLKey || updateGateEntryLKey}
                                customStyle={{
                                    backgroundColor: 'none'
                                }}
                                submitButtonSx={{
                                    textAlign: 'right',
                                    marginTop: 1
                                }}
                                showSeparaterBorder={false}
                                /* eslint-disable */
                                submitButtonText={
                                    isEditable
                                        ? activeTab === tabsFields?.length - 1
                                            ? 'Update'
                                            : activeTab === 0
                                              ? 'Next'
                                              : 'Save & Next'
                                        : activeTab === tabsFields?.length - 1
                                          ? 'Submit'
                                          : activeTab === 0
                                            ? 'Save & Next'
                                            : 'Save & Next'
                                }
                            />
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
                    <NotesInstructions notes={notes} customFontSize='14px' />
                </Grid>
            </Grid>

            <ConfirmModal
                title='Confirmation'
                message={`Are you sure you want to enter more than 500 cases?`}
                icon='warning'
                confirmText='Yes'
                customStyle={{ width: { xs: '300px', sm: '456px' } }}
                onConfirm={() => {
                    setAllowCases(true)
                    dispatch(closeModal())
                    formik.setFieldValue('no_of_cases', formik.values.no_of_cases)
                }}
                onCancel={() => {
                    dispatch(closeModal())
                    formik.setFieldValue('no_of_cases', previousNoOfCases)
                }}
            />
        </MainCard>
    )
}

export default GateEntryForm
