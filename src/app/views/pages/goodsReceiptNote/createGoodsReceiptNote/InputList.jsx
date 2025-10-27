/* eslint-disable react/prop-types */
import { useEffect, useRef, useState, useMemo } from 'react'
import { Grid, TextField, FormControl, FormControlLabel, Radio, RadioGroup, Typography, Box } from '@mui/material'
import { debounce } from '@mui/material/utils'
import { styled } from '@mui/system'
import { useSelector, useDispatch } from 'react-redux'
import { currentOptions } from '@store/slices/grnSetupOption'
import {
    setBoxIdData,
    setSkuData,
    setUidData,
    setBinData,
    setGrnData,
    removeSkuData,
    removeUidData,
    removeData,
    removeBinData,
    setRefetchGateEntries
} from '@store/slices/grn'
import { getRejectReason } from '@/app/store/slices/api/commonSlice'
import { Form, Formik } from 'formik'
import z from 'zod'
// import { QrCodeScanner } from '@mui/icons-material'
import CustomNewFormInput from '@/core/components/extended/CustomNewFormInput'
import CustomAutocomplete from '@/core/components/extended/CustomAutocomplete'
import CustomButton from '@/core/components/extended/CustomButton'
import {
    scanBoxIdGateEntryId,
    scanAndValidateEAN,
    useScanAndValidateUIDMutation,
    useScanAndValidateBINMutation,
    useScanGrnItemMutation,
    useGenerateUIDMutation,
    scanAndValidateRFID
} from '@/app/store/slices/api/grnSlice'
import { openSnackbar } from '@/app/store/slices/snackbar'
import { useLocalStorage, LOCAL_STORAGE_KEYS } from '@/hooks/useLocalStorage'
import { strToArray } from '@/constants'

// Define common width for labels and inputs
// const labelWidth = '100px'

// Styled components
const CustomTextField = styled(TextField)({
    '& input': {
        backgroundColor: '#fff',
        padding: '6px 8px',
        height: '12px' // Decrease input height
    },
    flexGrow: 1,
    width: '100%'
})

// const CustomSelect = styled(Select)({
//     '& .MuiSelect-select': {
//         padding: '6px 14px !important', // Adjust padding for a shorter height
//         height: '20px !important', // Force a consistent height
//         display: 'flex',
//         alignItems: 'center',
//         lineHeight: '25px', // Ensure the text is centered vertically
//         fontSize: '14px' // Adjust font size if necessary
//     },
//     flexGrow: 1,
//     width: 'auto' // Additional styles can go here.
// })

const Label = styled(Typography)({
    // width: labelWidth,
    textAlign: 'right',
    marginRight: '8px',
    whiteSpace: 'nowrap',
    fontWeight: 'bold'
})

const customSelectSx = {
    '& input': {
        backgroundColor: '#fff',
        padding: '6px 8px',
        height: '12px'
    },
    '& .MuiInputBase-root.MuiOutlinedInput-root': {
        backgroundColor: 'white'
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'gray'
    },
    flexGrow: 1,
    display: 'flex',
    width: '100%'
}

const customSelectInputProp = {
    height: 30,
    width: '100%'
}
const customSelectInputSx = {
    width: '100%'
}

const getInputStyles = boxID =>
    boxID
        ? {
              flexGrow: 1,
              width: 'auto',
              '& input': { padding: '6px 8px' },
              '& .MuiInputBase-root.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'secondary.dark'
              },
              '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'secondary.dark',
                  borderWidth: '2px',
                  '&:hover': {
                      borderColor: 'secondary.dark',
                      borderWidth: '2px'
                  }
              },
              '& .Mui-disabled .MuiOutlinedInput-notchedOutline': { borderColor: 'secondary.dark' }
          }
        : {}

// ProductInfoForm sub-component for commonly repeated input groups.
// We now accept an extra prop (formik) and a batchRef so that the Batch input uses CustomNewFormInput.
function ProductInfoForm({ formik, batchRef, isVerified, setIsVerified, scanGrnItemReq, isOkToScan }) {
    const { skuData } = useSelector(state => state.grn)
    const { processConfig, additionalConfig } = useSelector(currentOptions)

    return (
        <Grid container spacing={2}>
            {/* Batch Field using CustomNewFormInput */}
            {skuData?.lot_reqd && (
                <Grid item xs={12}>
                    <Grid container alignItems='center'>
                        {/* <Label sx={{ textAlign: 'left' }}>Batch:</Label> */}
                        {skuData.geSkuDetail?.lot_no && skuData.geSkuDetail?.lot_no.length ? (
                            <Grid item xs={12}>
                                <Grid container>
                                    <Grid item md={3} xs={3}>
                                        <Label sx={{ textAlign: 'left' }}>Batch:</Label>
                                    </Grid>
                                    <Grid item md={9} xs={9}>
                                        <CustomAutocomplete
                                            name='batch'
                                            options={skuData.geSkuDetail?.lot_no || []}
                                            value={formik?.values?.batch}
                                            onChange={(_, value) => {
                                                formik?.setFieldValue('batch', value || '')
                                                // if (
                                                //     additionalConfig?.includes('defaultQC') &&
                                                //     processConfig === 'uidOnly' &&
                                                //     isOkToScan({ batch: value || '' })
                                                // )
                                                //     scanGrnItemReq()
                                            }}
                                            onBlur={() => formik?.setFieldTouched('batch', true)}
                                            touched={formik?.touched.batch}
                                            setFieldValue={formik?.setFieldValue}
                                            setFieldTouched={formik?.setFieldTouched}
                                            showAdornment
                                            placeholder='Select a Batch No.'
                                            innerLabel={false}
                                            inputRef={batchRef}
                                            customSx={customSelectSx}
                                            customInputProp={customSelectInputProp}
                                            customInputSx={customSelectInputSx}
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>
                        ) : (
                            <CustomNewFormInput
                                name='batch'
                                label='Batch:'
                                placeholder='Scan Batch...'
                                formik={formik}
                                inputProps={{
                                    inputRef: batchRef,
                                    onKeyPress: e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            if (setIsVerified) {
                                                setIsVerified(prev => ({ ...prev, batch: true }))
                                            }
                                            batchRef?.current?.blur()
                                        }
                                    },
                                    onChange: e => {
                                        formik.setFieldValue('batch', e.target.value)
                                        // if (
                                        //     additionalConfig?.includes('defaultQC') &&
                                        //     processConfig === 'uidOnly' &&
                                        //     isOkToScan({ batch: e.target.value || '' })
                                        // )
                                        //     scanGrnItemReq()
                                    },
                                    sx: { '&.Mui-focused .MuiInputAdornment-root svg': { color: 'primary.main' } }
                                }}
                                customSx={getInputStyles(isVerified?.batch)}
                                autoComplete='off'
                                disabled={isVerified?.batch}
                            />
                        )}
                    </Grid>
                </Grid>
            )}
            {/* MFG Date Field */}
            {skuData?.manufacturing_reqd && (
                <Grid item xs={12}>
                    {skuData.geSkuDetail?.mfd_date && skuData.geSkuDetail?.mfd_date.length ? (
                        <Grid item xs={12}>
                            <Grid container>
                                <Grid item md={3} xs={3}>
                                    <Label sx={{ textAlign: 'left' }}>MFG:</Label>
                                </Grid>
                                <Grid item md={9} xs={9}>
                                    <CustomAutocomplete
                                        name='mfg'
                                        options={skuData.geSkuDetail?.mfd_date || []}
                                        value={formik?.values?.mfg}
                                        onChange={(_, value) => {
                                            formik?.setFieldValue('mfg', value || '')
                                            // if (
                                            //     additionalConfig?.includes('defaultQC') &&
                                            //     processConfig === 'uidOnly' &&
                                            //     isOkToScan({ mfg: value || '' })
                                            // )
                                            //     scanGrnItemReq()
                                        }}
                                        onBlur={() => formik?.setFieldTouched('mfg', true)}
                                        touched={formik?.touched.batch}
                                        setFieldValue={formik?.setFieldValue}
                                        setFieldTouched={formik?.setFieldTouched}
                                        showAdornment
                                        placeholder='Select a manufacturing date...'
                                        innerLabel={false}
                                        customSx={customSelectSx}
                                        customInputProp={customSelectInputProp}
                                        customInputSx={customSelectInputSx}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    ) : (
                        <Grid container>
                            <Grid item md={3} xs={3}>
                                <Label sx={{ textAlign: 'left' }}>MFG:</Label>
                            </Grid>
                            <Grid item md={9} xs={9}>
                                <CustomTextField
                                    name='mfg'
                                    variant='outlined'
                                    type='date'
                                    size='small'
                                    value={formik?.values?.mfg || ''}
                                    fullWidth
                                    inputProps={{ max: new Date().toISOString().split('T')[0] }}
                                    onChange={e => {
                                        formik.handleChange(e)
                                        // if (
                                        //     additionalConfig?.includes('defaultQC') &&
                                        //     processConfig === 'uidOnly' &&
                                        //     isOkToScan({ mfg: e.target.value || '' })
                                        // )
                                        //     scanGrnItemReq()
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>
                    )}
                </Grid>
            )}
            {/* Expiry Date Field */}
            {skuData?.expiry_reqd && (
                <Grid item xs={12}>
                    {skuData.geSkuDetail?.expiry_date && skuData.geSkuDetail?.expiry_date.length ? (
                        <Grid item xs={12}>
                            <Grid container>
                                <Grid item md={3} xs={3}>
                                    <Label sx={{ textAlign: 'left' }}>Expiry Date:</Label>
                                </Grid>
                                <Grid item md={9} xs={9}>
                                    <CustomAutocomplete
                                        name='expiryDate'
                                        options={skuData.geSkuDetail?.expiry_date || []}
                                        value={formik?.values?.expiryDate || ''}
                                        onChange={(_, value) => {
                                            formik?.setFieldValue('expiryDate', value || '')
                                            if (
                                                additionalConfig?.includes('defaultQC') &&
                                                processConfig === 'uidOnly' &&
                                                isOkToScan({ expiryDate: value || '' })
                                            )
                                                scanGrnItemReq()
                                        }}
                                        onBlur={() => formik?.setFieldTouched('expiryDate', true)}
                                        touched={formik?.touched.batch}
                                        setFieldValue={formik?.setFieldValue}
                                        setFieldTouched={formik?.setFieldTouched}
                                        showAdornment
                                        placeholder='Select a expiry date...'
                                        innerLabel={false}
                                        customSx={customSelectSx}
                                        customInputProp={customSelectInputProp}
                                        customInputSx={customSelectInputSx}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    ) : (
                        <Grid container>
                            <Grid item md={3} xs={3}>
                                <Label sx={{ textAlign: 'left' }}>Expiry Date:</Label>
                            </Grid>
                            <Grid item md={9} xs={9}>
                                <CustomTextField
                                    name='expiryDate'
                                    variant='outlined'
                                    type='date'
                                    size='small'
                                    value={formik?.values?.expiryDate || ''}
                                    fullWidth
                                    inputProps={{
                                        min: new Date(new Date().setDate(new Date().getDate() + 1))
                                            .toISOString()
                                            .split('T')[0]
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                    onChange={e => {
                                        formik.handleChange(e)
                                        if (
                                            additionalConfig?.includes('defaultQC') &&
                                            processConfig === 'uidOnly' &&
                                            isOkToScan({ expiryDate: e.target.value || '' })
                                        )
                                            scanGrnItemReq()
                                    }}
                                />
                            </Grid>
                        </Grid>
                    )}
                </Grid>
            )}
            {/* MRP Field */}
            {skuData?.dual_mrp && (
                <Grid item xs={12}>
                    <Grid container>
                        <Grid item md={3} xs={3}>
                            <Label sx={{ textAlign: 'left' }}>MRP:</Label>
                        </Grid>
                        {skuData.geSkuDetail?.mrp && skuData.geSkuDetail?.mrp.length ? (
                            <Grid item md={9} xs={9}>
                                <CustomAutocomplete
                                    name='mrp'
                                    options={skuData.geSkuDetail?.mrp || []}
                                    value={formik?.values?.mrp}
                                    onChange={(_, value) => {
                                        formik?.setFieldValue('mrp', value || '')
                                        // if (
                                        //     additionalConfig?.includes('defaultQC') &&
                                        //     processConfig === 'uidOnly' &&
                                        //     isOkToScan({ mrp: value || '' })
                                        // )
                                        //     scanGrnItemReq()
                                    }}
                                    onBlur={() => formik?.setFieldTouched('mrp', true)}
                                    touched={formik?.touched.selectedSection}
                                    setFieldValue={formik?.setFieldValue}
                                    setFieldTouched={formik?.setFieldTouched}
                                    showAdornment
                                    placeholder='Select a MRP'
                                    innerLabel={false}
                                    customSx={customSelectSx}
                                    customInputProp={customSelectInputProp}
                                    customInputSx={customSelectInputSx}
                                />
                            </Grid>
                        ) : (
                            <Grid item md={9} xs={9}>
                                <CustomTextField
                                    name='mrp'
                                    variant='outlined'
                                    type='number'
                                    size='small'
                                    fullWidth
                                    value={formik.values.mrp || null}
                                    InputLabelProps={{ shrink: true }}
                                    onChange={e => {
                                        formik.handleChange(e)
                                        // if (
                                        //     additionalConfig?.includes('defaultQC') &&
                                        //     processConfig === 'uidOnly' &&
                                        //     isOkToScan({ mrp: e.target.value || '' })
                                        // )
                                        //     scanGrnItemReq()
                                    }}
                                />
                            </Grid>
                        )}
                    </Grid>
                </Grid>
            )}
        </Grid>
    )
}

export default function InputList() {
    const dispatch = useDispatch()
    // Create refs for all text type inputs
    const formikRef = useRef()
    const boxIDRef = useRef()
    const binIdRef = useRef()
    const eanRef = useRef()
    const batchRef = useRef()
    const uidRef = useRef()
    const rfidRef = useRef()
    const genUidRef = useRef()
    const gateEntryRef = useRef()

    const [scanAndValidateBIN] = useScanAndValidateBINMutation()
    const {
        getGrnDataLKey,
        scanAndValidateEANLKey,
        scanAndValidateUIDLKey,
        scanAndValidateBINLKey,
        scanAndValidateRFIDLKey,
        generateUIDLKey
    } = useSelector(state => state.loading)
    const [scanAndValidateUID] = useScanAndValidateUIDMutation()
    const [scanGrnItem] = useScanGrnItemMutation()
    const [generateUID] = useGenerateUIDMutation()
    const [tableId] = useLocalStorage(LOCAL_STORAGE_KEYS.tableId, null)
    // values destructured from redux slice we are using to conditionally render all inputs
    const { baseDoc, processConfig, additionalConfig } = useSelector(currentOptions)
    const { grnList, skuData, boxIdData, uidData, binData, grnData, shouldRemoveGrn } = useSelector(state => state.grn)
    const [qualityCheck, setQualityCheck] = useState('ok')
    const handleQualityCheckChange = event => {
        setQualityCheck(event.target.value)
    }

    const [isVerified, setIsVerified] = useState({
        boxID: false,
        ean: false,
        batch: false,
        uid: false,
        binId: false,
        rfid: false
    })

    const [rejectReason, setRejectReason] = useState([])

    // Updated initialValues with optional text inputs
    const initialValues = {
        boxID: '',
        ean: '',
        uid: '',
        binId: '',
        rfid: '',
        batch: '',
        mfg: '',
        expiryDate: '',
        mrp: '',
        qualityCheckReason: '',
        qcStatus: 'ok'
    }

    // Updated validation schema: all text fields as optional.
    const validationSchema = z.object({
        boxID: z.string().optional(),
        ean: z.string().optional(),
        batch: z.string().optional(),
        uid: z.string().optional(),
        binId: z.string().optional(),
        rfid: z.string().optional()
    })

    const validate = values => {
        try {
            validationSchema.parse(values)
            return {}
        } catch (error) {
            const errors = {}
            error.errors.forEach(err => {
                errors[err.path[0]] = err.message
            })
            return errors
        }
    }

    const isOkToScan = (value = {}) => {
        if (additionalConfig?.includes('defaultQC') && processConfig === 'uidOnly') {
            let lastField
            if (skuData?.lot_reqd) lastField = 'batch'
            if (skuData?.manufacturing_reqd) lastField = 'mfg'
            if (skuData?.expiry_reqd) lastField = 'expiryDate'
            if (skuData?.dual_mrp) lastField = 'mrp'

            if (
                lastField &&
                !(value[lastField] || formikRef?.current.values[lastField]) &&
                !additionalConfig?.includes('RFID')
            )
                return false
            if (
                lastField &&
                (value[lastField] || formikRef?.current.values[lastField]) &&
                !additionalConfig?.includes('RFID')
            )
                return true

            if (additionalConfig?.includes('RFID') && isVerified?.rfid && !additionalConfig?.includes('defaultQC'))
                return true
            // if ((uidData?.uid || uidData?.external_uid) && isVerified?.uid) return true
        }

        if (
            additionalConfig?.includes('defaultQC') &&
            processConfig === 'normalConfig' &&
            additionalConfig?.includes('RFID')
        ) {
            // if (isVerified?.rfid) return true  //TODO: find a way to check when this state
            if (formikRef?.current.values.rfid) return true
            return false
        }
        if (
            additionalConfig?.includes('defaultQC') &&
            additionalConfig?.includes('RFID') &&
            processConfig === 'uidOnly' &&
            processConfig !== 'normalConfig'
        ) {
            if (formikRef?.current.values.rfid && binIdRef?.current.value) return true
            return false
        }
        return true
    }

    const removeGRNData = () => {
        if (formikRef) {
            formikRef.current.setFieldValue('ean', '')
            formikRef.current.setFieldValue('batch', '')
            formikRef.current.setFieldValue('mrp', '')
            formikRef.current.setFieldValue('mfg', '')
            formikRef.current.setFieldValue('expiryDate', '')
            formikRef.current.setFieldValue('qualityCheckReason', null)
            formikRef.current.setFieldValue('qcStatus', 'ok')
            formikRef.current.setFieldValue('rfid', '')
            formikRef.current.setFieldValue('binId', '')
        }

        if (eanRef && eanRef.current) eanRef.current.value = ''
        if (batchRef && batchRef.current) batchRef.current.value = ''
        if (boxIDRef && boxIDRef.current) boxIDRef.current.value = ''

        setIsVerified({
            boxID: false,
            ean: false,
            batch: false,
            uid: false,
            binId: false,
            rfid: false
        })
        dispatch(removeData())
    }

    const resetRefField = (scannedRef, field) => {
        if (scannedRef && scannedRef.current) {
            scannedRef.current.value = ''
            formikRef.current.setFieldValue(field, '')
        }
        if (field) setIsVerified(prev => ({ ...prev, [field]: false }))
    }

    const scanGrnItemReq = async (scannedRef, field) => {
        try {
            // ! validation for LMEM
            if (skuData?.lot_reqd && !formikRef.current.values?.batch) {
                resetRefField(scannedRef, field)
                batchRef.current.focus()
                throw new Error('please select or add a valid Batch No!')
            } else if (skuData?.manufacturing_reqd && !formikRef.current.values?.mfg) {
                resetRefField(scannedRef, field)
                throw new Error('please enter or select a valid manufacturing date!')
            } else if (skuData?.expiry_reqd && !formikRef.current.values?.expiryDate) {
                resetRefField(scannedRef, field)
                throw new Error('please enter or select a valid expiry date!')
            } else if (skuData?.dual_mrp && !formikRef.current.values?.mrp) {
                resetRefField(scannedRef, field)
                throw new Error('please enter or select a valid mrp!')
            } else if (!skuData.no_2) {
                resetRefField(scannedRef, field)
                if (processConfig === 'uidOnly') uidRef?.current.focus()
                else {
                    eanRef?.current.focus()
                }
                throw new Error('please scan EAN or UID first!')
            } else if (!binData.bin_no) {
                resetRefField(scannedRef, field)
                binIdRef?.current.focus()
                formikRef.current.setFieldValue('binId', '')
                throw new Error('please scan BIN first!')
            } else if (!boxIdData.gate_entry_id) {
                resetRefField(scannedRef, field)
                if (baseDoc === 'boxId') {
                    boxIDRef?.current.focus()
                    boxIDRef.current.value = ''
                } else {
                    gateEntryRef?.current.focus()
                    gateEntryRef.current.value = ''
                    formikRef?.current.setFieldValue('gateEntry', '')
                }
                throw new Error(`please ${baseDoc === 'boxId' ? 'scan box id' : 'select a valid gate entry'} first!`)
            }

            const payload = {
                id: null,
                table_id: tableId,
                gate_entry_id: boxIdData.gate_entry_id,
                item: {
                    item_no: skuData.no_2,
                    item_id: skuData.id,
                    uid: uidData.uid,
                    external_uid: uidData.external_uid,
                    qc_status: formikRef.current.values?.qcStatus || binData.qc_status,
                    reason_id: formikRef.current.values?.qualityCheckReason?.value || null,
                    reject_reason: formikRef.current.values?.qualityCheckReason?.label || null,
                    lot_no: formikRef.current.values?.batch,
                    mfd_date: formikRef.current.values?.mfg,
                    expiry_date: formikRef.current.values?.expiryDate,
                    mrp: formikRef.current.values?.mrp,
                    bin_no: binData.bin_no || formikRef.current.values?.binId,
                    bin_id: binData.bin_id
                }
            }
            const { data: response } = await scanGrnItem({ ...payload }).unwrap()

            if (response?.closeGrn) {
                // ? grn completed
                removeGRNData()
                if (baseDoc !== 'boxId') {
                    dispatch(setRefetchGateEntries(true))
                    setTimeout(() => {
                        dispatch(setRefetchGateEntries(false))
                    }, 300)
                    formikRef?.current.setFieldValue('gateEntry', '')
                }
            } else if (!additionalConfig?.includes('bulkOperation')) {
                formikRef.current.setFieldValue('ean', '')
                formikRef.current.setFieldValue('batch', '')
                formikRef.current.setFieldValue('mrp', '')
                formikRef.current.setFieldValue('mfg', '')
                formikRef.current.setFieldValue('expiryDate', '')
                formikRef.current.setFieldValue('qualityCheckReason', null)
                formikRef.current.setFieldValue('qcStatus', 'ok')
                formikRef.current.setFieldValue('rfid', '')
                dispatch(removeSkuData())
                setIsVerified(() => ({
                    boxID: false,
                    ean: false,
                    batch: false,
                    uid: false,
                    binId: false,
                    rfid: false
                }))

                if (processConfig === 'normalConfig') {
                    eanRef.current.focus()
                }
            } else if (additionalConfig?.includes('bulkOperation')) {
                formikRef.current.setFieldValue('rfid', '')
                binIdRef.current.focus()
                setIsVerified(prev => ({
                    ...prev,
                    uid: false,
                    binId: false,
                    rfid: false,
                    batch: false
                }))
            } else if (processConfig === 'uidOnly' && additionalConfig?.includes('defaultQC')) {
                formikRef.current.setFieldValue('binId', '')
                dispatch(removeBinData())
            } else {
                uidRef.current.focus()
                setIsVerified(prev => ({
                    ...prev,
                    ean: true,
                    uid: false,
                    binId: false
                }))
                formikRef.current.setFieldValue('uid', '')
            }
            if (processConfig === 'uidOnly') {
                uidRef.current.focus()
                formikRef.current.setFieldValue('uid', '')
                formikRef.current.setFieldValue('binId', '')
            }

            formikRef.current.setFieldValue('uid', '')
            // formikRef.current.setFieldValue('binId', '')
            setIsVerified(prev => ({
                ...prev,
                binId: false
            }))

            // boxIDRef.current.value = ''
            // formikRef.current.setFieldValue('boxId', '')

            dispatch(setGrnData(response.grnDetail))
            dispatch(removeUidData())

            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Item scanned successfully!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } catch (error) {
            setIsVerified(prev => ({
                ...prev,
                binId: false
            }))
            dispatch(
                openSnackbar({
                    open: true,
                    message:
                        error?.data?.message || error?.message || 'An error occurred while item scan, please try again',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        }
    }

    const scanIds = async (callback, boxId, gateEntryId = null) => {
        try {
            if (!boxId && !gateEntryId) throw new Error('invalid data scanned ')

            if (additionalConfig?.includes('defaultQC')) {
                binIdRef.current?.focus()
            } else if (processConfig !== 'uidOnly') {
                eanRef.current?.focus()
            } else {
                uidRef.current?.focus()
            }
            const { data: response, error: scanIdsError } = await dispatch(
                scanBoxIdGateEntryId.initiate(`?box_id=${boxId || ''}&gate_entry_id=${gateEntryId || ''}`, {
                    meta: { disableLoader: true }
                })
            )

            if (boxId) setIsVerified(prev => ({ ...prev, boxID: true }))
            if (scanIdsError) {
                throw new Error(`${boxId ? 'BoxId' : 'Gate Entry Id'} ${scanIdsError.data.message}`)
            }

            callback(response?.data || [])
            dispatch(setGrnData({ no: response.data?.no, id: response.data?.id }))
        } catch (error) {
            if (boxId) {
                boxIDRef.current.focus()
                boxIDRef.current.value = ''
                formikRef.current.setFieldValue('boxID', null)
                setIsVerified(prev => ({ ...prev, boxID: false }))
            }
            if (eanRef.current) eanRef.current.value = ''
            if (uidRef.current) uidRef.current.value = ''
            formikRef.current.setFieldValue('ean', null)
            formikRef.current.setFieldValue('uid', null)

            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || error?.message || 'An error occurred, please try again',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }
    const setLMEM = geSkuDetail => {
        if (!geSkuDetail) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'invalid sku scanned, sku not available in po/asn',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            return
        }
        // TODO: can be replaced ?
        if (strToArray(geSkuDetail?.mrp, ',').length === 1)
            formikRef.current.setFieldValue('mrp', strToArray(geSkuDetail.mrp, ',')[0])
        if (strToArray(geSkuDetail?.expiry_date, ',').length === 1)
            formikRef.current.setFieldValue('expiryDate', strToArray(geSkuDetail.expiry_date, ',')[0])
        if (strToArray(geSkuDetail?.mfd_date, ',').length === 1)
            formikRef.current.setFieldValue('mfg', strToArray(geSkuDetail.mfd_date, ',')[0])
        if (strToArray(geSkuDetail?.lot_no, ',').length === 1)
            formikRef.current.setFieldValue('batch', strToArray(geSkuDetail.lot_no, ',')[0])
    }
    const scanEAN = async ({ gateEntryId = null, itemNo = null, documentId = null, documentType = null } = {}) => {
        try {
            batchRef.current?.focus()
            const { data: response, error: errorRes } = await dispatch(
                scanAndValidateEAN.initiate(
                    `?gate_entry_id=${gateEntryId || ''}&item_no=${itemNo || ''}&document_id=${documentId || ''}&document_type=${documentType || ''}`,
                    { meta: { disableLoader: false } }
                )
            )

            if (errorRes)
                throw new Error(
                    errorRes?.message ||
                        errorRes?.data?.message ||
                        'unable to validate the given EAN at the moment please try again'
                )

            if (response?.data) {
                setIsVerified(prev => ({ ...prev, ean: true }))
                dispatch(setSkuData(response.data))

                setLMEM(
                    response.data.dual_mrp
                        ? response.data.geSkuDetail
                        : { ...response.data.geSkuDetail, mrp: response.data.mrp_price }
                )
            }
        } catch (error) {
            eanRef.current.focus()
            eanRef.current.value = ''
            formikRef.current.setFieldValue('ean', null)
            formikRef.current.setFieldValue('batch', null)
            setIsVerified(prev => ({ ...prev, ean: false }))
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.message || 'An error occurred while validation, please try again',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        }
    }

    const scanUID = async (uid = null, gateEntryId = null, documentType = null, itemNo = null) => {
        try {
            if (processConfig === 'uidOnly' && !documentType) {
                throw new Error('please scan Box Id field to proceed further!')
            } else if (processConfig !== 'uidOnly' && !itemNo) {
                throw new Error('please scan EAN field to proceed further!')
            } else if (!uid) {
                throw new Error('invalid uid scanned!')
            } else if (!gateEntryId || !documentType) {
                if (baseDoc === 'boxId') {
                    throw new Error('invalid box id data, please scan box id again')
                }
                throw new Error('invalid gate entry data data, please select gate entry again')
            }

            // next focus: if RFID is included then move to RFID, else:
            if (additionalConfig?.includes('RFID')) {
                rfidRef.current?.focus()
            } else if (processConfig === 'uidOnly') {
                batchRef.current?.focus()
            }
            // If defaultQC is not included then BIN ID might be rendered at the bottom.
            else if (!additionalConfig?.includes('defaultQC') && processConfig !== 'uidOnly') {
                binIdRef.current?.focus()
                binIdRef.current.value = ''
                setIsVerified(prev => ({ ...prev, binId: false }))
            }

            const { data: response } = await scanAndValidateUID(
                `?gate_entry_id=${gateEntryId || ''}&item_no=${itemNo || ''}&document_type=${documentType || ''}&uid=${uid}`
            ).unwrap()

            setIsVerified(prev => ({ ...prev, uid: true }))
            dispatch(setUidData({ uid: response?.uid, external_uid: response?.external_uid }))
            if (processConfig === 'uidOnly') {
                dispatch(setSkuData(response))
                setLMEM(response.geSkuDetail)
            }
        } catch (error) {
            if (additionalConfig?.includes('RFID')) {
                if (rfidRef && rfidRef.current) rfidRef.current.value = ''
                setIsVerified(prev => ({ ...prev, rfid: false }))
            } else if (processConfig === 'uidOnly') {
                if (batchRef && batchRef.current) batchRef.current.value = ''
                setIsVerified(prev => ({ ...prev, batch: false }))
            }

            if (processConfig === 'uidOnly' && !documentType) {
                uidRef.current.focus()
                uidRef.current.value = ''
            } else if (processConfig !== 'uidOnly' && !itemNo) {
                if (eanRef && eanRef.current) eanRef.current.focus()
                if (eanRef && eanRef.current) formikRef?.current.setFieldValue('ean', '')
            } else if (!uid) {
                uidRef.current.focus()
                uidRef.current.value = ''
                formikRef?.current.setFieldValue('uid', '')
            } else if (!gateEntryId || !documentType) {
                if (baseDoc === 'boxId') {
                    boxIDRef.current.focus()
                    formikRef?.current.setFieldValue('boxID', '')
                    boxIDRef.current.value = ''
                } else gateEntryRef.current.focus()
            } else {
                uidRef?.current.focus()
            }
            formikRef?.current.setFieldValue('uid', '')
            uidRef.current.value = ''
            dispatch(
                openSnackbar({
                    open: true,
                    message:
                        error?.data?.message ||
                        error?.message ||
                        'An error occurred while validation, please try again',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        }
    }

    const scanBIN = async binNo => {
        try {
            const { data: response } = await scanAndValidateBIN(
                `?bin_no=${binNo || ''}&no=${grnData.no || ''}`
            ).unwrap()

            dispatch(setBinData(response))

            if (processConfig === 'uidOnly') {
                uidRef.current?.focus()
            } else if (additionalConfig?.includes('defaultQC')) {
                eanRef?.current.focus()
            }
            setIsVerified(prev => ({ ...prev, binId: true }))
        } catch (error) {
            if (processConfig === 'uidOnly') {
                uidRef.current.value = ''
            } else if (additionalConfig?.includes('defaultQC')) {
                setIsVerified(prev => ({ ...prev, ean: false }))
                eanRef.current.value = ''
            }

            binIdRef.current.value = ''
            binIdRef?.current.focus()
            formikRef.current.setFieldValue('binId', null)
            dispatch(
                openSnackbar({
                    open: true,
                    message:
                        error?.data?.message ||
                        error?.message ||
                        'An error occurred while validation, please try again',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        }
    }

    const generateUIDReq = async quantity => {
        try {
            await generateUID({ item_id: skuData.id, quantity }).unwrap()
            uidRef.current?.focus()
        } catch (error) {
            genUidRef.current.focus()
            dispatch(
                openSnackbar({
                    open: true,
                    message:
                        error?.data?.message ||
                        error?.message ||
                        'An error occurred while uid generation, please try again',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        }
    }

    const getRejectReasonReq = useMemo(
        () =>
            debounce(async (callback, request = `?term=&limit=40&page=1`) => {
                try {
                    const { data: response } = await dispatch(
                        getRejectReason.initiate(request, { meta: { disableLoader: false } })
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

    const scanAndValidateRfidReq = async id => {
        try {
            const { error: errorRes } = await dispatch(
                scanAndValidateRFID.initiate(`?rfid=${id || ''}`, { meta: { disableLoader: false } })
            )
            if (errorRes)
                throw new Error(
                    errorRes?.message ||
                        errorRes?.data?.message ||
                        'unable to validate the given RFID at the moment please try again'
                )

            if (processConfig === 'uidOnly') {
                batchRef.current?.focus()
            } else if (!additionalConfig?.includes('defaultQC')) {
                binIdRef.current?.focus()
            }
            setIsVerified(prev => ({ ...prev, rfid: true })) // setting true at start to avoid check failure in itemScanReq
            if (
                additionalConfig?.includes('defaultQC') &&
                // (processConfig === 'uidOnly' || processConfig === 'normalConfig') &&
                isOkToScan({ ...formikRef.current.values, rfid: id || '' })
            ) {
                scanGrnItemReq(rfidRef, 'rfid')
            }
        } catch (error) {
            rfidRef.current.focus()
            rfidRef.current.value = ''
            formikRef.current.setFieldValue('rfid', null)
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.message || 'An error occurred while validation, please try again',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        }
    }

    const handleAutoCompleteSearch = search => {
        getRejectReasonReq(data => setRejectReason(data), `?term=${search?.value || ''}&limit=40&page=1`)
    }

    useEffect(() => {
        if (shouldRemoveGrn) removeGRNData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldRemoveGrn])

    useEffect(() => {
        boxIDRef.current?.focus()
        getRejectReasonReq(data => setRejectReason(data))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (
            binData.bin_no &&
            (!additionalConfig?.includes('defaultQC') ||
                (additionalConfig?.includes('defaultQC') && processConfig === 'uidOnly')) &&
            isOkToScan()
        ) {
            scanGrnItemReq()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [binData])

    useEffect(() => {
        if (
            (uidData?.uid || uidData?.external_uid) &&
            additionalConfig?.includes('defaultQC') &&
            processConfig !== 'uidOnly' &&
            !additionalConfig?.includes('RFID') &&
            isOkToScan()
        ) {
            scanGrnItemReq()
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uidData])

    return (
        <Formik
            initialValues={initialValues}
            validate={validate}
            validateOnBlur={false}
            validateOnChange={false}
            innerRef={formikRef}
        >
            {formik => (
                <Form>
                    <Grid container spacing={2} style={{ padding: 1, borderRadius: 1, marginTop: 0.5 }}>
                        {baseDoc === 'boxId' ? (
                            <Grid item xs={12}>
                                <CustomNewFormInput
                                    name='boxID'
                                    label='Box ID :'
                                    placeholder='Scan Box ID...'
                                    formik={formik}
                                    inputProps={{
                                        inputRef: boxIDRef,
                                        onKeyPress: e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                scanIds(
                                                    resData => dispatch(setBoxIdData(resData)),
                                                    e.target.value,
                                                    null
                                                )
                                            }
                                        },
                                        onChange: e => {
                                            formik.setFieldValue('boxID', e.target.value)
                                        },
                                        sx: {
                                            '&.Mui-focused .MuiInputAdornment-root svg': { color: 'primary.main' }
                                        }
                                    }}
                                    customSx={getInputStyles(isVerified?.boxID)}
                                    autoComplete='off'
                                    disabled={isVerified?.boxID}
                                />
                            </Grid>
                        ) : (
                            // if not scanning by boxID then show Gate Entry select
                            <Grid item xs={12}>
                                <Grid container>
                                    <Grid item md={3} xs={3}>
                                        <Label sx={{ textAlign: 'left' }}>Gate Entry:</Label>
                                    </Grid>
                                    <Grid item md={9} xs={9}>
                                        <CustomAutocomplete
                                            name='gateEntry'
                                            options={grnList || []}
                                            value={formik?.values?.gateEntry}
                                            onChange={(_, value) => {
                                                formik?.setFieldValue('gateEntry', value || '')
                                                scanIds(resData => dispatch(setBoxIdData(resData)), null, value.value)
                                            }}
                                            onBlur={() => formik?.setFieldTouched('gateEntry', true)}
                                            touched={formik?.touched.gateEntry}
                                            setFieldValue={formik?.setFieldValue}
                                            setFieldTouched={formik?.setFieldTouched}
                                            showAdornment
                                            placeholder='Select a gate entry'
                                            innerLabel={false}
                                            customSx={customSelectSx}
                                            loading={!!getGrnDataLKey}
                                            customInputProp={customSelectInputProp}
                                            customInputSx={customSelectInputSx}
                                            inputRef={gateEntryRef}
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>
                        )}

                        {/* Quality Check Block */}
                        {additionalConfig?.includes?.('defaultQC') && (
                            <Grid item xs={12}>
                                <Grid container alignItems='center'>
                                    <Typography
                                        sx={{
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Quality Check:
                                    </Typography>
                                    <FormControl component='fieldset' sx={{ ml: '10px' }}>
                                        <RadioGroup
                                            row
                                            name='qcStatus'
                                            value={qualityCheck}
                                            onChange={handleQualityCheckChange}
                                        >
                                            <FormControlLabel
                                                value='ok'
                                                control={
                                                    <Radio
                                                        sx={{ transform: 'scale(0.8)', paddingY: '2px' }}
                                                        size='small'
                                                    />
                                                }
                                                label={<Typography sx={{ fontSize: '0.8rem' }}>OK</Typography>}
                                            />
                                            <FormControlLabel
                                                value='reject'
                                                control={
                                                    <Radio
                                                        sx={{ transform: 'scale(0.8)', paddingY: '2px' }}
                                                        size='small'
                                                    />
                                                }
                                                label={<Typography sx={{ fontSize: '0.8rem' }}>REJECT</Typography>}
                                            />
                                        </RadioGroup>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        )}

                        {/* Conditionally Render Reject Reason */}
                        {qualityCheck === 'reject' && additionalConfig?.includes?.('defaultQC') && (
                            <Grid item xs={12}>
                                <Grid container>
                                    <Grid item md={3} xs={3}>
                                        <Label sx={{ textAlign: 'left' }}>Reject Reason:</Label>
                                    </Grid>
                                    <Grid item md={9} xs={9}>
                                        <CustomAutocomplete
                                            name='qualityCheckReason'
                                            options={rejectReason || []}
                                            value={formik?.values?.qualityCheckReason}
                                            onChange={(_, value) => {
                                                formik?.setFieldValue('qualityCheckReason', value || '')
                                            }}
                                            onBlur={() => formik?.setFieldTouched('qualityCheckReason', true)}
                                            touched={formik?.touched.gateEntry}
                                            setFieldValue={formik?.setFieldValue}
                                            setFieldTouched={formik?.setFieldTouched}
                                            showAdornment
                                            placeholder='Select Reason'
                                            innerLabel={false}
                                            customSx={customSelectSx}
                                            customInputProp={customSelectInputProp}
                                            customInputSx={customSelectInputSx}
                                            onInputChange={e => handleAutoCompleteSearch(e.value)}
                                            // inputRef={}
                                        />
                                    </Grid>

                                    {/* <CustomSelect variant='outlined' size='small' fullWidth>
                                        <MenuItem value=''>
                                            <em>Select</em>
                                        </MenuItem>
                                        <MenuItem value='reason1'>Reason 1</MenuItem>
                                        <MenuItem value='reason2'>Reason 2</MenuItem>
                                    </CustomSelect> */}
                                </Grid>
                            </Grid>
                        )}

                        {/* BIN ID Field when defaultQC is included */}
                        {additionalConfig?.includes('defaultQC') && processConfig !== 'uidOnly' && (
                            <Grid item xs={12}>
                                <Grid container alignItems='center' spacing={1}>
                                    <Grid item style={{ width: '108px' }}>
                                        <Typography variant='body1' sx={{ textAlign: 'left', fontWeight: 'bold' }}>
                                            BIN ID:
                                        </Typography>
                                    </Grid>
                                    <Grid item xs>
                                        <CustomNewFormInput
                                            name='binId'
                                            // label='BIN ID:'
                                            placeholder='Enter BIN ID...'
                                            formik={formik}
                                            inputProps={{
                                                inputRef: binIdRef,
                                                onKeyPress: e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        scanBIN(e.target.value)
                                                    }
                                                },
                                                onChange: e => {
                                                    formik.setFieldValue('binId', e.target.value)
                                                },
                                                sx: {
                                                    '&.Mui-focused .MuiInputAdornment-root svg': {
                                                        color: 'primary.main'
                                                    }
                                                }
                                            }}
                                            customSx={getInputStyles(isVerified?.binId)}
                                            autoComplete='off'
                                            disabled={isVerified?.binId}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <Typography variant='h4'>{binData.quantity}</Typography>
                                    </Grid>
                                </Grid>
                            </Grid>
                        )}

                        {/* EAN Field if processConfig is not uidOnly */}
                        {processConfig !== 'uidOnly' && (
                            <Grid item xs={12}>
                                <Grid container alignItems='center'>
                                    {/* <Label sx={{ textAlign: 'left' }}>EAN:</Label> */}
                                    <CustomNewFormInput
                                        name='ean'
                                        label='EAN:'
                                        placeholder='Scan EAN...'
                                        formik={formik}
                                        inputProps={{
                                            inputRef: eanRef,
                                            onKeyPress: e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    scanEAN({
                                                        gateEntryId: boxIdData.gate_entry_id,
                                                        documentId: boxIdData.document_no,
                                                        itemNo: e.target.value,
                                                        documentType: boxIdData.document_type
                                                    })
                                                }
                                            },
                                            onChange: e => {
                                                formik.setFieldValue('ean', e.target.value)
                                            },
                                            sx: {
                                                '&.Mui-focused .MuiInputAdornment-root svg': {
                                                    color: 'primary.main'
                                                }
                                            }
                                        }}
                                        loading={!!scanAndValidateEANLKey}
                                        customSx={getInputStyles(isVerified?.ean)}
                                        autoComplete='off'
                                        disabled={isVerified?.boxId && isVerified?.ean}
                                    />
                                </Grid>
                            </Grid>
                        )}

                        {/* Product Info */}
                        {processConfig !== 'uidOnly' && (
                            <Grid item xs={12}>
                                <ProductInfoForm
                                    formik={formik}
                                    batchRef={batchRef}
                                    isVerified={isVerified}
                                    setIsVerified={setIsVerified}
                                    scanGrnItemReq={scanGrnItemReq}
                                    isOkToScan={isOkToScan}
                                />
                            </Grid>
                        )}

                        {/* Quantity Field for bulkOperation (left as number input; not a text type) */}
                        {additionalConfig?.includes('bulkOperation') && processConfig === 'normalConfig' && (
                            <Grid item xs={12}>
                                <Grid container>
                                    <Grid md={3} xs={3}>
                                        <Label sx={{ textAlign: 'left' }}>Quantity:</Label>
                                    </Grid>
                                    <Grid md={9} xs={9}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CustomTextField
                                                required
                                                variant='outlined'
                                                size='small'
                                                type='number'
                                                placeholder='Enter Quantity'
                                                fullWidth
                                                inputRef={genUidRef}
                                                // onKeyPress={e => {
                                                //     if (e.key === 'Enter') {
                                                //         e.preventDefault()
                                                //         generateUIDReq(e.target.value)
                                                //     }
                                                // }}
                                                onChange={e => {
                                                    formik.setFieldValue('quantity', e.target.value)
                                                }}
                                            />
                                            <CustomButton
                                                variant='clickable'
                                                loading={generateUIDLKey}
                                                onClick={() => generateUIDReq(formik.values?.quantity)}
                                                customStyles={{ padding: '2px', fontSize: '12px', height: '30px' }}
                                            >
                                                {!generateUIDLKey && 'Generate'}
                                            </CustomButton>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Grid>
                        )}

                        {/* UID Field */}
                        <Grid item xs={12}>
                            <Grid container alignItems='center'>
                                {/* <Label sx={{ textAlign: 'left' }}>UID:</Label> */}
                                <CustomNewFormInput
                                    name='uid'
                                    label='UID:'
                                    placeholder='Scan UID...'
                                    formik={formik}
                                    inputProps={{
                                        inputRef: uidRef,
                                        onKeyPress: e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                scanUID(
                                                    e.target.value,
                                                    boxIdData.gate_entry_id,
                                                    boxIdData.document_type,
                                                    formik.values.ean
                                                )
                                            }
                                        },
                                        onChange: e => {
                                            formik.setFieldValue('uid', e.target.value)
                                        },
                                        sx: {
                                            '&.Mui-focused .MuiInputAdornment-root svg': { color: 'primary.main' }
                                        }
                                    }}
                                    customSx={getInputStyles(isVerified?.uid)}
                                    autoComplete='off'
                                    loading={!!scanAndValidateUIDLKey}
                                    disabled={isVerified?.uid}
                                />
                            </Grid>
                        </Grid>

                        {/* RFID Field */}
                        {additionalConfig?.includes('RFID') && (
                            <Grid item xs={12}>
                                <Grid container alignItems='center'>
                                    {/* <Label sx={{ textAlign: 'left' }}>RFID:</Label> */}
                                    <CustomNewFormInput
                                        name='rfid'
                                        label='RFID:'
                                        placeholder='Scan RFID...'
                                        formik={formik}
                                        inputProps={{
                                            inputRef: rfidRef,
                                            onKeyPress: e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    // for non defaultQC, BIN ID is rendered later; if defaultQC is already rendered then no further field.
                                                    scanAndValidateRfidReq(e.target.value)
                                                }
                                            },
                                            onChange: e => {
                                                formik.setFieldValue('rfid', e.target.value)
                                            },
                                            sx: {
                                                '&.Mui-focused .MuiInputAdornment-root svg': {
                                                    color: 'primary.main'
                                                }
                                            }
                                        }}
                                        customSx={getInputStyles(isVerified?.rfid)}
                                        autoComplete='off'
                                        loading={!!scanAndValidateRFIDLKey}
                                        disabled={isVerified?.rfid}
                                    />
                                </Grid>
                            </Grid>
                        )}

                        {/* In case processConfig is uidOnly, render Product Info */}
                        {processConfig === 'uidOnly' && (
                            <Grid item xs={12}>
                                <ProductInfoForm
                                    formik={formik}
                                    batchRef={batchRef}
                                    uidRef={uidRef}
                                    isVerified={isVerified}
                                    setIsVerified={setIsVerified}
                                    scanGrnItemReq={scanGrnItemReq}
                                    isOkToScan={isOkToScan}
                                />
                            </Grid>
                        )}

                        {/* BIN ID Field when defaultQC is NOT included */}
                        {(!additionalConfig?.includes('defaultQC') ||
                            (additionalConfig?.includes('defaultQC') && processConfig === 'uidOnly')) && (
                            <Grid item xs={12}>
                                <Grid container alignItems='center' spacing={1}>
                                    <Grid item xs={3}>
                                        <Typography variant='body1' sx={{ textAlign: 'left', fontWeight: 'bold' }}>
                                            BIN ID:
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={7}>
                                        <CustomNewFormInput
                                            name='binId'
                                            // label="BIN ID:"
                                            placeholder='Scan BIN ID...'
                                            formik={formik}
                                            inputProps={{
                                                inputRef: binIdRef,
                                                onKeyPress: e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        scanBIN(e.target.value)
                                                        // Last text input, no next focus.
                                                        // setIsVerified(prev => ({ ...prev, binId: true }))
                                                    }
                                                },
                                                onChange: e => {
                                                    formik.setFieldValue('binId', e.target.value)
                                                },
                                                sx: {
                                                    '&.Mui-focused .MuiInputAdornment-root svg': {
                                                        color: 'primary.main'
                                                    }
                                                }
                                            }}
                                            customSx={getInputStyles(isVerified?.binId)}
                                            autoComplete='off'
                                            loading={!!scanAndValidateBINLKey}
                                            disabled={isVerified?.binId}
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <Typography variant='h4'>{binData.quantity}</Typography>
                                    </Grid>
                                </Grid>
                            </Grid>
                        )}
                    </Grid>
                </Form>
            )}
        </Formik>
    )
}
