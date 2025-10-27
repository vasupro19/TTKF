import { useEffect, useState } from 'react'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'

import { Box, Grid, Menu, MenuItem, Typography } from '@mui/material'
import { ArrowDropDown } from '@mui/icons-material'
import { useGetGrnDataMutation } from '@/app/store/slices/api/grnSlice'
import { setGrnList } from '@/app/store/slices/grn'
// import { setCurrentOptions } from '@/app/store/slices/grnSetupOption'
import { useDispatch, useSelector } from '@/app/store'
import { LOCAL_STORAGE_KEYS, useLocalStorage } from '@/hooks/useLocalStorage'
import InputList from './InputList'
import InputModal from './InputModal'
import ItemDetails from './ItemDetails'
import DropdownMenu from './DropdownMenu'

function CreateGoodsReceiptNote() {
    const dispatch = useDispatch()
    const [getGrnData] = useGetGrnDataMutation()

    const { refetchGateEntries } = useSelector(state => state.grn)

    // const { baseDoc, processConfig, additionalConfig } = useSelector(state => state.grnSetupOption.currentOptions)
    const [modalOpen, setModalOpen] = useState(true)
    // const [inputValue, setInputValue] = useState('')
    const [tableId, setTableId] = useLocalStorage(LOCAL_STORAGE_KEYS.tableId, null)

    const handleValueChange = e => {
        setTableId(e.target.value)
    }

    const handleModalClose = () => setModalOpen(false)

    const handleConfirm = () => {
        // Handle confirmation logic here
        handleModalClose()
    }

    const [anchorEl, setAnchorEl] = useState(null)
    const [selectedOption, setSelectedOption] = useState('OK')
    const open = Boolean(anchorEl)

    const handleClick = event => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleOptionClick = option => {
        setSelectedOption(option)
        handleClose()
    }

    const getGrnDataReq = async () => {
        try {
            const response = await getGrnData().unwrap()
            dispatch(setGrnList(response?.data?.geList || []))
            // TODO: set config state based on this api's response
            // dispatch(setCurrentOptions(response?.data?.currentOptions || { baseDoc, processConfig, additionalConfig } ))
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('error ', error)
        }
    }

    useEffect(() => {
        console.log('refetch Grn Data 📊')
        if (refetchGateEntries) getGrnDataReq()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refetchGateEntries])

    useEffect(() => {
        getGrnDataReq()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        setModalOpen(true) // Show modal when the page loads
    }, [])

    return (
        <MainCard content={false} sx={{ marginTop: 2, borderRadius: 1 }}>
            <Box
                sx={{
                    // backgroundColor: '#e3e3e93d',
                    // backgroundColor: '#f0f8ff',
                    borderRadius: 2,
                    padding: 2,
                    height: 'auto',
                    border: '1.5px solid #e3e3e3'
                }}
            >
                <Grid
                    container
                    spacing={1}
                    sx={{
                        borderRadius: 1
                    }}
                >
                    {/* Left Column */}
                    <Grid item xs={12} md={4}>
                        {/* Only display dropdown in this section on mobile */}
                        <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Typography variant='h4' sx={{ display: 'block' }}>
                                    Table ID:
                                </Typography>
                                <Typography variant='h5' sx={{ display: 'block' }}>
                                    {tableId}
                                </Typography>
                            </Box>
                            <DropdownMenu />
                        </Box>
                        <InputList tableId={tableId} />
                    </Grid>

                    {/* Center Column */}
                    <Grid item xs={12} md={5} sx={{ paddingLeft: { sm: '3rem !important', xs: '0px' } }}>
                        <ItemDetails />
                    </Grid>

                    {/* Right Column */}
                    <Grid item xs={12} md={3}>
                        {/* Hide dropdown here on mobile */}
                        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, justifyContent: 'flex-end' }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Typography variant='h4' sx={{ display: 'block' }}>
                                    Table ID:
                                </Typography>
                                <Typography variant='h5' sx={{ display: 'block' }}>
                                    {tableId}
                                </Typography>
                            </Box>
                            <DropdownMenu />
                        </Box>
                    </Grid>
                </Grid>

                <InputModal
                    open={modalOpen}
                    onClose={handleModalClose}
                    value={tableId}
                    onValueChange={handleValueChange}
                    onConfirm={handleConfirm}
                />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, marginY: '2rem' }}>
                <CustomButton>Generate Bin</CustomButton>
                <Box>
                    <CustomButton variant='outlined' onClick={handleClick} endIcon={<ArrowDropDown />}>
                        {selectedOption}
                    </CustomButton>
                    <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                        <MenuItem onClick={() => handleOptionClick('OK')}>OK</MenuItem>
                        <MenuItem onClick={() => handleOptionClick('Reject')}>Reject</MenuItem>
                    </Menu>
                </Box>
            </Box>
        </MainCard>
    )
}

export default CreateGoodsReceiptNote
