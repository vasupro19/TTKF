import { useCallback } from 'react'
import { Box, IconButton, Tooltip } from '@mui/material'
import { Edit } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import ListPage from '@core/listing/ListPage'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { getSuppliers } from '@/app/store/slices/api/supplierSlice'
import { headers } from './helper'

const TYPES = [
    { value: 'Hotel', label: 'Hotels' },
    { value: 'Taxi', label: 'Taxis' }
]
const FILTERS = [{ key: 'type', label: 'Type', options: TYPES }]

// ? the hotels and transporters the agency books with
function MasterSupplierTable() {
    const navigate = useNavigate()
    const hasCreateAccess = useUiAccess('create')
    const add = useCallback(() => navigate('/master/supplier/add'), [navigate])
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) add()
    })

    return (
        <ListPage
            title='Suppliers'
            subtitle='The hotels and transporters you book with.'
            noun='suppliers'
            searchPlaceholder='Search name, contact, city, phone or email'
            headers={headers}
            endpoint={getSuppliers}
            reqKey='getSuppliersListKey'
            filters={FILTERS}
            csvName='suppliers'
            canAdd
            addLabel='Add Supplier'
            onAdd={add}
            emptyText='Add the hotels and transporters you work with, then pick them when you confirm a booking.'
            renderAction={row => (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <UiAccessGuard type='edit'>
                        <Tooltip title='Edit'>
                            <IconButton
                                size='small'
                                aria-label={`Edit ${row.businessname}`}
                                onClick={() => navigate(`/master/supplier/edit/${row.id}`)}
                            >
                                <Edit fontSize='small' sx={{ fill: '#60498a' }} />
                            </IconButton>
                        </Tooltip>
                    </UiAccessGuard>
                </Box>
            )}
        />
    )
}

export default MasterSupplierTable
