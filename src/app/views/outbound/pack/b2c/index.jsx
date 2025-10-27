import { useEffect, useState } from 'react'

// ** import core components
import MainCard from '@core/components/extended/MainCard'

import { Box, Divider, Typography } from '@mui/material'

import usePrompt from '@/hooks/usePrompt'
import InputModal from '../InputModal'
import B2CPackingMain from './B2CPackingMain'

function B2CPacking() {
    usePrompt()
    const [modalOpen, setModalOpen] = useState(true)
    const [tableId, setTableId] = useState()

    const handleModalClose = () => setModalOpen(false)

    const handleConfirm = (values, { resetForm }) => {
        // Handle confirmation logic here
        setTableId(values.tableId)
        resetForm()
        handleModalClose()
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Typography variant='h4' sx={{ display: 'block', color: 'primary.800' }}>
                                Order Type:
                            </Typography>
                            <Typography variant='h4' sx={{ display: 'block' }}>
                                B2C
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Typography variant='h4' sx={{ display: 'block', color: 'primary.800' }}>
                                Table ID:
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
                {tableId && <B2CPackingMain table={tableId} />}

                <InputModal open={modalOpen} onClose={handleModalClose} onSubmit={handleConfirm} />
            </Box>
        </MainCard>
    )
}

export default B2CPacking
