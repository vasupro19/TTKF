import { useEffect, useState } from 'react'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import { Box, Divider, Typography, useMediaQuery } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useParams } from 'react-router-dom'
import { setBoxId, setCurrentStep, setScannedOrderId, setTableId } from '@/app/store/slices/b2bPackingSlice'
import { Edit } from '@mui/icons-material'
import InputModal from '../InputModal'
import ScanOrderId from './ScanOrderId'
import B2BPackingMain from './B2BPackingMain'
import ScanBoxID from './ScanBoxID'

function B2BPacking() {
    const { boxId: boxIdVal, packId } = useParams()
    const { pathname } = useLocation()
    const isEditPage = pathname.includes('/edit/')
    const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm')) // Mobile check
    const dispatch = useDispatch()
    const { currentStep, tableId } = useSelector(state => state.b2bPacking)

    const [modalOpen, setModalOpen] = useState(true)

    const handleModalClose = () => setModalOpen(false)

    const renderStepContent = () => {
        if (!tableId) return null

        switch (currentStep) {
            case 'SCAN_ORDER':
                return <ScanOrderId />
            case 'SCAN_BOX_ID':
                return <ScanBoxID />
            case 'PACKING':
                return <B2BPackingMain />
            default:
                return null
        }
    }

    useEffect(() => {
        if (!boxIdVal) return
        if (isEditPage) {
            dispatch(setBoxId(boxIdVal))
            dispatch(setScannedOrderId('VYP048830')) // TODO: replace this hardcoded value with the actual scanned order ID from the API response
        }
        // eslint-disable-next-line consistent-return
        return () => {
            dispatch(setTableId('')) // whenever the component unmounts, reset the tableId update if needed
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onConfirm = (values, { resetForm }) => {
        if (values?.tableId && values?.tableId.trim() !== '') {
            if (isEditPage) {
                dispatch(setTableId(values.tableId))
                dispatch(setCurrentStep('PACKING'))
                resetForm()
                handleModalClose()
                return
            }
            dispatch(setTableId(values.tableId))
            dispatch(setCurrentStep('SCAN_ORDER'))
            resetForm()
            handleModalClose()
        }
    }

    useEffect(() => {
        if (!tableId) {
            setModalOpen(true)
        }
    }, [tableId])

    return (
        <MainCard content={false} sx={{ marginTop: 1, borderRadius: 1 }}>
            <Box
                sx={{
                    borderRadius: 2,
                    padding: 1,
                    height: 'auto',
                    border: '1.5px solid #e3e3e3',
                    minHeight: '88vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Box>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            position: 'relative'
                        }}
                    >
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Typography
                                variant='h4'
                                sx={{ display: { xs: 'none', sm: 'block' }, color: 'primary.800' }}
                            >
                                Order Type:
                            </Typography>
                            <Typography variant='h4' sx={{ display: 'block' }}>
                                B2B
                            </Typography>
                        </Box>
                        {isEditPage && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 1,
                                    alignItems: 'center',
                                    color: 'blue.main',
                                    position: { sm: 'absolute' },
                                    left: { sm: '50%' },
                                    transform: { sm: 'translateX(-50%)' },
                                    bottom: '1px'
                                }}
                            >
                                <Edit />
                                <Typography variant='h4' sx={{ display: 'block', color: 'blue.main' }}>
                                    Editing {!isMobile && 'Pack ID:'} {packId}
                                </Typography>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Typography variant='h4' sx={{ display: 'block', color: 'primary.800' }}>
                                Table {!isMobile && 'ID'}:
                            </Typography>
                            <Typography variant='h4' sx={{ display: 'block' }}>
                                {tableId ?? ''}
                            </Typography>
                        </Box>
                    </Box>
                    <Divider
                        sx={{
                            marginTop: '0.2rem',
                            borderColor: '#BCC1CA',
                            borderWidth: '1px'
                        }}
                    />
                </Box>

                {tableId && (
                    <Box
                        sx={{
                            height: '100%',
                            flexGrow: 1,
                            padding: { xs: 0.5, sm: 1 },
                            display: 'flex',
                            ...(currentStep === 'PACKING'
                                ? {}
                                : { justifyContent: 'center', maxHeight: '200px', marginTop: '6%' })
                        }}
                    >
                        {renderStepContent()}
                    </Box>
                )}

                {!tableId && <InputModal open={modalOpen} onClose={handleModalClose} onSubmit={onConfirm} />}
            </Box>
        </MainCard>
    )
}

export default B2BPacking
