import { useState, useEffect, useCallback } from 'react'

import { Card, Typography, TextField, IconButton, CircularProgress } from '@mui/material'
import Box from '@mui/material/Box'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomImage from '@core/components/CustomImage'
import SearchIcon from '@mui/icons-material/Search'
import CancelIcon from '@mui/icons-material/Cancel'
import BusinessIcon from '@mui/icons-material/Business'
import { useNavigate } from 'react-router-dom'
import { ExitToApp } from '@mui/icons-material'
import { getClientAccounts, useChangeClientAccountMutation } from '@/app/store/slices/api/authApiSlice'

import { useDispatch, useSelector } from 'react-redux'
import { setLocation } from '@/app/store/slices/auth'
import { openSnackbar } from '@/app/store/slices/snackbar'
import cerebrumLogo from '@assets/images/auth/Cerebrum_logo_final_white.png'
import { useLocalStorage, LOCAL_STORAGE_KEYS } from '@/hooks/useLocalStorage'
import { objectLength, getObjectKeys, getCustomSx } from '@/utilities'
import WarehouseLocationIcon from '@/assets/icons/WarehouseLocationIcon'
import CustomButton from '@/core/components/extended/CustomButton'
import { RightArrowAnimIcon } from '@/assets/icons/RightArrowAnimIcon'

const inputCustomSx = getCustomSx()

function ClientLocationTable() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [inputVal, setInputVal] = useState('')
    const [clientAccounts, setClientAccounts] = useState([])
    const [clientLocation, setClientLocation] = useLocalStorage(LOCAL_STORAGE_KEYS.clientLocation, null, true)
    const { user } = useSelector(state => state.auth)
    const { getClientLKey, changeClientAccountLKey } = useSelector(state => state.loading)

    const [changeClientAccount] = useChangeClientAccountMutation()

    const getClients = useCallback(async () => {
        const { data } = await dispatch(getClientAccounts.initiate('', { meta: { disableLoader: true } }))
        if (!data?.data) return
        setClientAccounts(data?.data || [])
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const isClientAlreadySelected = currentLocId => {
        if (
            user &&
            user?.id &&
            clientLocation &&
            user.id in clientLocation &&
            'id' in clientLocation[user.id].current &&
            clientLocation[user.id].current.id === currentLocId
        )
            return true

        return false
    }

    const handleSelectLocation = useCallback(async (data, userData) => {
        let isError = false
        let message
        try {
            let clientObj = {}
            let prevObj = {}
            const response = await changeClientAccount({ client_id: data.id }).unwrap()
            message = response.message
            dispatch(setLocation(data.id))
            // ! same code is in NavBar.jsx component please modify that too
            // TODO: make it a fn and use it in both components (here and NavBar.jsx)
            if (clientLocation && typeof clientLocation === 'object') {
                if (objectLength(clientObj) >= 2) {
                    delete clientLocation[getObjectKeys(clientLocation)[objectLength(clientLocation) - 1]] // ? optimization
                } else if (userData.id in clientLocation) {
                    if (data.id in clientLocation[userData.id].current) return // if the user is selecting same client again
                    prevObj = { previous: clientLocation[userData.id]?.current || {} }
                }
            }
            if (isClientAlreadySelected(data?.id)) {
                message = 'Back to workspace'
            }
            // FIXME:: check should we include prevObj in clientObj in case of isClientAlreadySelected(data?.id)
            clientObj = {
                [userData.id]: {
                    ...prevObj,
                    current: {
                        id: data.id,
                        name: data.name,
                        master_client_name: data.master_client_name,
                        code: data.code
                    }
                }
            }
            setClientLocation(clientObj)
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error)
            isError = true
            message = error?.data?.message || error?.message || ''
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            if (!isError) navigate('/dashboard')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleClearInput = () => {
        setInputVal('')
    }

    const handleInputChange = e => {
        setInputVal(e.target.value)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        getClients()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return (
        <MainCard
            content={false}
            sx={{
                borderRadius: 'unset !important',
                minHeight: { xs: '100dvh', sm: '100vh' },
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                gap: 1,
                background: 'radial-gradient(circle, rgba(248, 250, 252, 0.72) 50%, rgba(225, 240, 245, 1) 100%)',
                paddingTop: 1
            }}
        >
            <CustomImage
                src={cerebrumLogo}
                alt='Cerebrum Logo'
                styles={{
                    width: '14rem',
                    backgroundColor: 'primary.main',
                    border: '1px solid',
                    borderColor: 'grey.borderLight',
                    boxShadow: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px'
                }}
            />
            <Typography variant='h2' sx={{ color: 'text.primary' }}>
                Select Client Location
            </Typography>

            <Box sx={{ paddingY: 2, paddingX: 2, paddingTop: '2px', width: { xs: '100%', sm: '70%' } }}>
                {/* Add your dummy buttons here */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: 'grey.borderLight',
                        boxShadow: 'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px',
                        paddingY: '12px',
                        paddingX: 3,
                        backgroundImage: `url('/assets/svg/waveBackground.svg')`, // Adjust the path based on your folder structure
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <WarehouseLocationIcon />
                        <Typography
                            sx={{
                                fontSize: '14px'
                            }}
                        >
                            Choose client location to continue
                        </Typography>
                    </Box>
                    <TextField
                        value={inputVal}
                        onChange={handleInputChange}
                        placeholder='Search Client Location...'
                        size='small'
                        fullWidth
                        sx={{ ...inputCustomSx, width: { xs: '100%', sm: 'auto' } }}
                        InputProps={{
                            sx: { height: 40 },
                            endAdornment: inputVal ? (
                                <IconButton onClick={handleClearInput} edge='end'>
                                    <CancelIcon sx={{ color: 'primary.main' }} />
                                </IconButton>
                            ) : (
                                <SearchIcon />
                            )
                        }}
                        autoComplete='off'
                    />
                </Box>

                <Box
                    sx={{
                        padding: { xs: '16px 0px', sm: 2 },
                        borderRadius: '8px',
                        maxHeight: { xs: '24.5rem', sm: '24.375rem' },
                        overflowY: 'hidden'
                    }}
                >
                    {/* Header Row */}
                    <Card
                        sx={{
                            display: { xs: 'none', sm: 'flex' },
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: 'primary.main',
                            padding: 1,
                            borderRadius: '12px', // Only round the top corners
                            color: '#fff',
                            fontWeight: 'bold',
                            textAlign: 'start',
                            position: 'sticky',
                            top: 0, // Fixes the header to the top of the container
                            zIndex: 1
                        }}
                    >
                        <Typography sx={{ flex: 1 }}>Master Client Name</Typography>
                        <Typography sx={{ flex: 1 }}>Warehouse Name</Typography>
                        <Typography sx={{ flex: 1 }}>Zone</Typography>
                        <Typography sx={{ flex: 0.5 }}>Action</Typography>
                    </Card>

                    {/* Cards */}
                    {getClientLKey ? (
                        <Box
                            sx={{
                                width: '100%',
                                height: '350px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <CircularProgress color='secondary' size={30} />
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                overflowY: 'auto',
                                maxHeight: { xs: '380px', sm: '340px' }
                            }}
                        >
                            {clientAccounts &&
                                !!clientAccounts.length &&
                                clientAccounts.map(warehouse => (
                                    <Card
                                        key={warehouse.id}
                                        sx={{
                                            display: 'flex',
                                            flexDirection: { xs: 'column', sm: 'row' },
                                            alignItems: { sm: 'center' },
                                            justifyContent: { sm: 'space-between' },
                                            backgroundColor: '#fff',
                                            border: '1px solid',
                                            borderColor: 'grey.borderLight',
                                            borderRadius: '12px',
                                            marginTop: 0.4,
                                            padding: 0.8,
                                            color: 'text.primary',
                                            textAlign: 'start',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s',
                                            '&:hover': {
                                                backgroundColor: '#e0e0e0'
                                            },
                                            ...(isClientAlreadySelected(warehouse.id)
                                                ? {
                                                      border: '2px solid',
                                                      borderColor: 'success.main',
                                                      backgroundColor: 'grey.bgLight',
                                                      '&:hover': {
                                                          border: '2px solid',
                                                          borderColor: 'success.dark',
                                                          backgroundColor: '#e0e0e0'
                                                      }
                                                  }
                                                : '')
                                        }}
                                        onClick={() => handleSelectLocation(warehouse, user)}
                                    >
                                        {/* Left Section with Logo */}
                                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <BusinessIcon fontSize='large' />
                                            <Typography sx={{ fontWeight: { xs: 'bold' } }}>
                                                {warehouse?.master_client_name || ''}
                                            </Typography>
                                        </Box>

                                        {/* Center Section */}
                                        <Typography
                                            sx={{ flex: 1 }}
                                        >{`${warehouse?.name} (${warehouse?.code})`}</Typography>

                                        {/* Right Section */}
                                        <Typography sx={{ flex: 1, display: { xs: 'none', sm: 'unset' } }}>
                                            {warehouse?.zone}
                                        </Typography>
                                        <Box sx={{ flex: 0.5, display: { xs: 'none', sm: 'unset' } }}>
                                            {changeClientAccountLKey ? (
                                                <CircularProgress color='success' size={24} />
                                            ) : (
                                                <CustomButton
                                                    variant='contained'
                                                    customStyles={{
                                                        borderRadius: '20px',
                                                        fontWeight: 'bold'
                                                    }}
                                                    shouldAnimate
                                                    endIcon={
                                                        isClientAlreadySelected(warehouse.id) ? (
                                                            <RightArrowAnimIcon />
                                                        ) : (
                                                            <ExitToApp />
                                                        )
                                                    }
                                                    onClick={() => handleSelectLocation(warehouse, user)}
                                                >
                                                    {isClientAlreadySelected(warehouse.id) ? 'Continue' : 'Sign in'}
                                                </CustomButton>
                                            )}
                                        </Box>
                                        {/* Action Button */}
                                        <Box sx={{ flex: 1, display: { xs: 'flex', sm: 'none' } }}>
                                            <Typography sx={{ flex: 1 }}>{warehouse.Zone}</Typography>
                                            <CustomButton
                                                variant='contained'
                                                customStyles={{
                                                    borderRadius: '20px',
                                                    fontWeight: 'bold'
                                                }}
                                                shouldAnimate
                                                endIcon={
                                                    isClientAlreadySelected(warehouse.id) ? (
                                                        <RightArrowAnimIcon />
                                                    ) : (
                                                        <ExitToApp />
                                                    )
                                                }
                                                onClick={() => handleSelectLocation(warehouse, user)}
                                            >
                                                {isClientAlreadySelected(warehouse.id) ? 'Continue' : 'Sign in'}
                                            </CustomButton>
                                        </Box>
                                    </Card>
                                ))}
                        </Box>
                    )}
                </Box>
            </Box>
        </MainCard>
    )
}

export default ClientLocationTable
