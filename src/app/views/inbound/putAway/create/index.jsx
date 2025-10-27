import React, { useRef, useState } from 'react'
import { Table, TableBody, TableCell, TableContainer, TableRow, Box, Grid, Divider, Typography } from '@mui/material'
import MainCard from '@core/components/extended/MainCard'

// Importing Form Component
import PiecePutAwayForm from '@/app/views/forms/putAway/PiecePutAwayForm'
import FullBinPutAwayForm from '@/app/views/forms/putAway/FullBinPutAwayForm'

import { useDispatch } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'
import IdCardContainer from '@/core/components/IdCardContainer'
import ChoosePutAwayTypeModal from './ChoosePutAwayTypeModal'
import TabsComponent from './TabsComponent'

function Index() {
    const mode = 'Freehand' // Freehand Job
    const techniques = 'Manual' // Manual Suggested Directed
    const dispatch = useDispatch()
    const grnInputRef = useRef(null)
    const [activeTab, setActiveTab] = useState(0)
    const [selectedView, setSelectedView] = React.useState(
        techniques === 'Suggested' || techniques === 'Directed' ? 1 : 0
    )
    const [isModalOpen, setIsModalOpen] = useState(true)
    const [GRNBinId, setGRNBinId] = useState('')
    const [formValues, setFormValues] = useState({
        scanBin: '',
        storageLocation: '',
        ...((activeTab === 1 && {
            itemId: ''
        }) ||
            {})
    })
    const [scanMultiple, setScanMultiple] = useState(false)
    const [selectedOptions, setSelectedOptions] = useState([])

    const rows = [
        { label: 'Number of Bins', text: 192 },
        { label: 'Total Assigned Qty', text: 212 },
        { label: 'Pending Qty', text: 66 }
    ]

    // Tab change handling
    const handleTabChange = newValue => {
        setActiveTab(newValue)
    }

    const handleSubmit = async (values, actions) => {
        await actions.validateForm() // Ensure validation runs before clearing errors

        actions.setFieldValue('itemId', '') // Reset itemId
        actions.setFieldTouched('itemId', false)
        actions.setErrors({}) // Clear all validation errors properly

        dispatch(
            openSnackbar({
                open: true,
                message: 'Put away successful!',
                variant: 'alert',
                alert: { color: 'success' },
                anchorOrigin: { vertical: 'top', horizontal: 'right' },
                autoHideDuration: 1000
            })
        )

        actions.setSubmitting(false) // Reset Formik submitting state
    }

    const handleFullBinSubmit = async (values, actions, locationType, clearInput) => {
        await actions.validateForm() // Ensure validation runs before clearing errors
        if (clearInput) {
            actions.setFieldValue(clearInput, '') // Reset scanBin
            actions.setFieldTouched(clearInput, false)
            actions.setErrors({}) // Clear all validation errors properly
        }
        if (locationType === 'bin') {
            actions.resetForm()
        }
        dispatch(
            openSnackbar({
                open: true,
                message: 'Put away successful!',
                variant: 'alert',
                alert: { color: 'success' },
                anchorOrigin: { vertical: 'top', horizontal: 'right' },
                autoHideDuration: 1000
            })
        )

        actions.setSubmitting(false) // Reset Formik submitting state
    }

    const handleChoosePutAwayModal = val => {
        setGRNBinId('')
        setIsModalOpen(val)
        // setActiveTab(1)
    }

    return (
        <MainCard sx={{ py: '1px' }} contentSX={{ px: '2px', py: 1.5 }}>
            <Box>
                <Typography variant='h3'>
                    {activeTab ? 'Full Bin Put Away' : 'Piece Put Away'}
                    <Typography variant='h4' component='span' sx={{ color: 'grey.500', marginLeft: 1 }}>
                        {`( ${mode}-${techniques} )`}
                    </Typography>
                </Typography>
                <Divider
                    sx={{
                        marginTop: '0.2rem',
                        borderColor: '#BCC1CA',
                        borderWidth: '1px'
                    }}
                />
            </Box>
            <Grid
                container
                gap={4}
                sx={{
                    px: 1.5,
                    py: 2
                }}
            >
                {mode !== 'Freehand' && (
                    <Grid container xs={12} md={3} spacing={2}>
                        <Grid item xs={12} md={6} lg={12} sx={{ marginBottom: 2 }}>
                            <IdCardContainer>
                                {(GRNBinId || mode === 'Job') && !isModalOpen ? (
                                    <>
                                        <Typography variant='h5' sx={{ wordBreak: 'break-word', fontWeight: 'bold' }}>
                                            Job Details (Job-1929)
                                        </Typography>
                                        <Divider sx={{ borderColor: 'primary.main', marginTop: 0.5 }} />

                                        <TableContainer style={{ maxWidth: 300, margin: 'auto' }}>
                                            <Table size='small' aria-label='compact quantity table'>
                                                <TableBody>
                                                    {rows.map((row, index) => (
                                                        // eslint-disable-next-line react/no-array-index-key
                                                        <TableRow key={index}>
                                                            <TableCell sx={{ padding: '4px' }}>{row.label}</TableCell>
                                                            <TableCell sx={{ padding: '4px' }}>{row.text}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </>
                                ) : (
                                    <Typography variant='caption' textAlign='center' width='100%'>
                                        No Data
                                    </Typography>
                                )}
                            </IdCardContainer>
                        </Grid>
                    </Grid>
                )}
                <Grid md={mode === 'Freehand' ? 12 : 8.8} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        {/* Conditionally Render Forms Based on Active Tab */}
                        {activeTab === 0 ? (
                            <PiecePutAwayForm
                                onSubmit={handleSubmit}
                                GRNBinId={GRNBinId}
                                setFormValues={setFormValues}
                                techniques={techniques}
                                mode={mode}
                                setSelectedView={setSelectedView}
                            />
                        ) : (
                            <FullBinPutAwayForm
                                onSubmit={handleFullBinSubmit}
                                GRNBinId={GRNBinId}
                                setFormValues={setFormValues}
                                techniques={techniques}
                                mode={mode}
                                activeTab={activeTab}
                                scanMultiple={scanMultiple}
                                handleChoosePutAwayModal={handleChoosePutAwayModal}
                            />
                        )}
                    </Box>
                </Grid>

                {!(activeTab && mode === 'Freehand' && techniques === 'Manual') && (
                    <Grid item xs={12} md={6} lg={12}>
                        <Divider
                            sx={{
                                marginTop: '-2rem',
                                borderColor: '#BCC1CA',
                                marginBottom: '1rem',
                                boxShadow: '1px 1px 4px #00000054'
                            }}
                        />
                        <TabsComponent
                            GRNBinId={GRNBinId}
                            formValues={formValues}
                            activeTab={activeTab}
                            techniques={techniques}
                            mode={mode}
                            isModalOpen={isModalOpen}
                            selectedView={selectedView}
                            setSelectedView={setSelectedView}
                        />
                    </Grid>
                )}
            </Grid>
            <ChoosePutAwayTypeModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                setGRNBinId={setGRNBinId}
                grnInputRef={grnInputRef}
                handleTabChange={handleTabChange}
                techniques={techniques}
                mode={mode}
                scanMultiple={scanMultiple}
                setScanMultiple={setScanMultiple}
                selectedOptions={selectedOptions}
                setSelectedOptions={setSelectedOptions}
            />
        </MainCard>
    )
}

export default Index
