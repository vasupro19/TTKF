/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react'
import { z } from 'zod'
import { Field, Form, Formik, useFormik } from 'formik'

// router
import { useParams, useNavigate } from 'react-router-dom'

// theme components
import { Box, Divider, Grid, TextField, Button, useMediaQuery } from '@mui/material'

// components
import MainCard from '@core/components/extended/MainCard'
import NotesInstructions from '@/core/components/NotesInstructions'
import MyTabs from '@/core/components/CapsuleTabs'

// redux imports
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import { TextFields, Upload } from '@mui/icons-material'
import CustomFormInput from '@/core/components/extended/CustomFormInput'
import ImportFileModal from '@/core/components/modals/ImportFileModal'
import ProductDetails from '@/core/components/ProductDetails'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import { closeModal, openModal } from '@/app/store/slices/modalSlice'

function MapPalletStorageLoc() {
    const navigate = useNavigate()
    const modalType = useSelector(state => state.modal.type)
    const isMobile = useMediaQuery('(max-width:500px)') // Adjust the breakpoint as needed
    const [activeTab, setActiveTab] = useState(0)
    const [tabsEnabled, setTabsEnabled] = useState([true, true])
    const [highlightBinInput, setHighlightBinInput] = useState(false)
    const [isUpdate, setIsUpdate] = useState(false)
    const [readOnly, setReadOnly] = useState(true)
    const [focusTarget, setFocusTarget] = useState(null)

    const dispatch = useDispatch()
    const tabLabels = ['form', 'upload']

    const tabsFields = [
        { label: 'Form', icon: <TextFields /> },
        { label: 'Upload', icon: <Upload /> }
    ]

    // Initial form values
    const initialValues = {
        palletCode: '',
        locationCode: ''
    }

    // Validation schema
    const validationSchema = z.object({
        palletCode: z.string().nonempty('Pallet Code is required'),
        locationCode: z.string().nonempty('Location Code is required')
    })

    const validate = values => {
        try {
            validationSchema.parse(values)
            return {}
        } catch (error) {
            const formikErrors = {}
            error.errors.forEach(err => {
                formikErrors[err.path[0]] = err.message
            })
            return formikErrors
        }
    }

    // Refs for managing input focus
    const palletInputRef = useRef(null)
    const locationInputRef = useRef(null)

    // Ensure the first input is focused on page load
    useEffect(() => {
        if (palletInputRef.current && activeTab === 0) {
            palletInputRef.current.focus()
        }
    }, [activeTab])

    const enableTabsAfterValidation = upToIndex => {
        const updatedTabs = tabsEnabled.map((enabled, index) => index <= upToIndex)
        setTabsEnabled(updatedTabs)
    }

    // Tab change handling
    const handleTabChange = (event, newValue) => {
        if (tabsEnabled[newValue]) {
            setActiveTab(newValue)
        }
    }

    const binDetailsData = [
        { label: 'Status', value: '#Available' },
        { label: 'Type', value: 'Storage' },
        { label: 'Created BY', value: 'Michael Scott' },
        { label: 'Location Code', value: isUpdate ? 'LOC123' : 'N/A' }
    ]

    const notes = [
        {
            id: 'n1',
            text: 'Ensure the QR/Bar code scanner is properly connected and working before starting the scanning process.'
        },
        {
            id: 'n2',
            text: 'Scan the Pallet Code first (required). The scanned value will automatically appear in the first input field.'
        },
        {
            id: 'n3',
            text: 'After scanning the Pallet Code, proceed to scan the Location Code (required) in one step.'
        },
        {
            id: 'n4',
            text: 'After scanning the Location Code and pressing "Enter", the form will be automatically submitted if all required fields are filled correctly.'
        },
        {
            id: 'n5',
            text: 'Once the form is submitted successfully, the focus will return to the Pallet Code input field, indicating readiness for the next scan.'
        },
        {
            id: 'n6',
            text: 'In case of any errors (e.g., missing or incorrect values), verify the scanned QR codes and try again.'
        }
    ]

    // handling setting focus using useEffect
    const handleConfirm = () => {
        setFocusTarget('locationCode')
        dispatch(closeModal())
    }

    useEffect(() => {
        if (focusTarget === 'locationCode') {
            locationInputRef.current.focus()
            setFocusTarget(null) // Reset after focusing
        }
    }, [focusTarget])

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
                    minHeight: '86vh'
                }}
            >
                <Grid container xs={12} md={3.6} spacing={2}>
                    <Grid item xs={12} md={6} lg={12} sx={{ marginBottom: 2 }}>
                        <ProductDetails data={binDetailsData} productName={'Pallet Code: PAL-001'} showNoData={activeTab===1} />
                    </Grid>
                </Grid>
                <Grid md={8.3} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <MyTabs activeTab={activeTab} handleTabChange={handleTabChange} tabsFields={tabsFields} 
                            tabsEnabled={tabsEnabled}
                        
                        />
                        {activeTab === 0 ? (
                            <Box sx={{ padding: 2 }}>
                                <Formik
                                    initialValues={initialValues}
                                    validate={validate}
                                    onSubmit={(values, { resetForm }) => {
                                        console.log('values', values)
                                        dispatch(
                                            openSnackbar({
                                                open: true,
                                                message: isUpdate ? 'Updated Successfully' : 'Mapped Successfully',
                                                variant: 'alert',
                                                alert: { color: 'success' },
                                                anchorOrigin: { vertical: 'top', horizontal: 'center' }
                                            })
                                        )
                                        setIsUpdate(false)
                                        resetForm({ values: initialValues })
                                        palletInputRef.current?.focus()
                                    }}
                                    validateOnBlur={false}
                                    validateOnChange={false}
                                >
                                    {formik => (
                                        <Form>
                                            <Grid container spacing={1} alignItems='center'>
                                                <Grid item xs={12} md={6}>
                                                    <CustomFormInput
                                                        name='palletCode'
                                                        label='Pallet Code*'
                                                        placeholder='Enter Pallet Code'
                                                        formik={formik}
                                                        inputProps={{
                                                            inputRef: palletInputRef,
                                                            onKeyPress: e => {
                                                                //**
                                                                //  TODO:: Validate code with API if not ok refocus and clear the value use highlightBinInput to show success or error for the input
                                                                // await validateFunction(formik)
                                                                // also include below code (which is just example case: when mapping already exists) in validatePalletCode, because we need to validate and open confirmation modal every time if mapping already exist also in onBlur.
                                                                // */
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault()
                                                                    if (e.target.value === '8903144876765') {
                                                                        setIsUpdate(true)
                                                                        dispatch(
                                                                            openModal({
                                                                                type: 'confirm_modal'
                                                                            })
                                                                        )
                                                                    } else {
                                                                        locationInputRef.current?.focus()
                                                                        setIsUpdate(false)
                                                                    }
                                                                }
                                                            },
                                                            onChange: e => {
                                                                formik.setFieldValue('palletCode', e.target.value)
                                                            },
                                                            onBlur: e => {
                                                                if (
                                                                    e.target.value === '8903144876765' &&
                                                                    e.key === 'Enter'
                                                                ) {
                                                                    setIsUpdate(true)
                                                                    dispatch(
                                                                        openModal({
                                                                            type: 'confirm_modal'
                                                                        })
                                                                    )
                                                                }
                                                            },
                                                            readOnly: isMobile,
                                                            onClick: () => {
                                                                if (isMobile) {
                                                                    palletInputRef.current.readOnly = false
                                                                }
                                                            }
                                                        }}
                                                        customSx={{
                                                            minHeight: '70px'
                                                        }}
                                                        color={highlightBinInput ? 'success' : null}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <CustomFormInput
                                                        name='locationCode'
                                                        label='Location Code*'
                                                        placeholder='Enter Location Code'
                                                        formik={formik}
                                                        inputProps={{
                                                            inputRef: locationInputRef,
                                                            onKeyPress: e => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault()
                                                                    const currentValue = e.target.value
                                                                    formik.setFieldValue('locationCode', currentValue)
                                                                    setTimeout(() => {
                                                                        if (formik.values.palletCode) {
                                                                            formik.handleSubmit()
                                                                        } else {
                                                                            palletInputRef.current.focus()
                                                                        }
                                                                    }, 700)
                                                                }
                                                            },
                                                            onChange: e => {
                                                                formik.setFieldValue('locationCode', e.target.value)
                                                            }
                                                        }}
                                                        customSx={{
                                                            minHeight: '70px'
                                                        }}
                                                        disabled={!formik?.values?.palletCode}
                                                    />
                                                </Grid>

                                                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                    <Button
                                                        type='submit'
                                                        variant='contained'
                                                        color='primary'
                                                        disabled={
                                                            !(formik.values.palletCode && formik.values.locationCode)
                                                        }
                                                    >
                                                        {isUpdate ? 'Update' : 'Submit'}
                                                    </Button>
                                                </Grid>
                                                {modalType === 'confirm_modal' && (
                                                    <ConfirmModal
                                                        title='Mapping Already Exists'
                                                        message={`Are you sure you still want to map this pallet (#PL-102)`}
                                                        icon='info'
                                                        confirmText='Yes'
                                                        customStyle={{ width: { xs: '300px', sm: '456px' } }}
                                                        onConfirm={handleConfirm}
                                                    />
                                                )}
                                            </Grid>
                                        </Form>
                                    )}
                                </Formik>
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}
                            >
                                <ImportFileModal
                                    handleFileSubmission={file => {
                                        console.log('file uploaded', file)
                                    }}
                                    sampleFilePath='/csv/master/mapPalletStorageLoc.csv'
                                />
                            </Box>
                        )}
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
        </MainCard>
    )
}

export default MapPalletStorageLoc
