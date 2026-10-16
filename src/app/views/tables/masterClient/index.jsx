import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Box, IconButton, Tooltip } from '@mui/material'
import { Edit } from '@mui/icons-material'
import SettingsIcon from '@mui/icons-material/Settings'
import KeyIcon from '@mui/icons-material/Key'
import MailOutlineIcon from '@mui/icons-material/MailOutline'

import ListPage from '@core/listing/ListPage'
import CustomSwitch from '@core/components/extended/CustomSwitch'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { openSnackbar } from '@app/store/slices/snackbar'
import { getClient, removeClient } from '@app/store/slices/api/clientSlice'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { headers, clientRows } from './helper'
import AiKeysDialog from './AiKeysDialog'
import MailSettingsDialog from './MailSettingsDialog'

const FILTERS = [
    {
        key: 'status',
        label: 'Status',
        options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
        ]
    }
]

// ? the platform's list of travel agencies (super admin only)
function MasterClientTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const hasCreateAccess = useUiAccess('create')
    // ? the client whose AI keys / email settings are open
    const [aiClient, setAiClient] = useState(null)
    const [mailClient, setMailClient] = useState(null)
    const [reloadSignal, setReloadSignal] = useState(0)

    const handleAdd = useCallback(() => navigate('/master/client/create'), [navigate])
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) handleAdd()
    })

    const handleUpdateStatus = async row => {
        try {
            const newStatus = !row.isActive
            await dispatch(removeClient.initiate({ removeId: row.id, isActive: newStatus })).unwrap()
            dispatch(
                openSnackbar({
                    open: true,
                    message: `Client ${newStatus ? 'Activated' : 'Deactivated'} successfully!`,
                    variant: 'alert',
                    alert: { color: 'success' }
                })
            )
            setReloadSignal(signal => signal + 1)
        } catch (err) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Failed to update status',
                    variant: 'alert',
                    alert: { color: 'error' }
                })
            )
        }
    }

    return (
        <>
            <ListPage
                title='Clients'
                subtitle='The travel agencies on the platform.'
                noun='clients'
                searchPlaceholder='Search name, email, phone, address or code'
                headers={headers}
                endpoint={getClient}
                reqKey='getClientLKey'
                filters={FILTERS}
                rowsOf={clientRows}
                csvName='clients'
                canAdd
                addLabel='Add Client'
                onAdd={handleAdd}
                emptyText='Add your first travel agency to give it a workspace and a login.'
                reloadSignal={reloadSignal}
                renderAction={row => (
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                        <UiAccessGuard type='edit'>
                            <IconButton
                                sx={{ color: 'success.main' }}
                                size='small'
                                aria-label='edit row'
                                onClick={() => navigate(`/master/client/edit/${row.id}`)}
                            >
                                <Tooltip title='Edit'>
                                    <Edit fontSize='small' sx={{ fill: '#60498a' }} />
                                </Tooltip>
                            </IconButton>
                        </UiAccessGuard>
                        {/* the client's own AI keys */}
                        <UiAccessGuard type='edit'>
                            <IconButton
                                sx={{ color: 'primary.main' }}
                                size='small'
                                aria-label={`AI keys for ${row.name || 'this client'}`}
                                onClick={() => setAiClient({ id: Number(row.id), name: row.name })}
                            >
                                <Tooltip title='AI keys'>
                                    <KeyIcon fontSize='small' />
                                </Tooltip>
                            </IconButton>
                        </UiAccessGuard>
                        {/* the client's mail server and mailboxes */}
                        <UiAccessGuard type='edit'>
                            <IconButton
                                sx={{ color: 'primary.main' }}
                                size='small'
                                aria-label={`Email settings for ${row.name || 'this client'}`}
                                onClick={() => setMailClient({ id: Number(row.id), name: row.name })}
                            >
                                <Tooltip title='Email settings'>
                                    <MailOutlineIcon fontSize='small' />
                                </Tooltip>
                            </IconButton>
                        </UiAccessGuard>
                        <UiAccessGuard type='edit'>
                            <IconButton
                                sx={{ color: 'primary.main' }}
                                size='small'
                                aria-label='settings row'
                                onClick={() =>
                                    navigate(`/master/client/permissions/${row.id}/${row.email}`, {
                                        state: { name: row.name }
                                    })
                                }
                            >
                                <Tooltip title='Settings'>
                                    <SettingsIcon width={18} height={18} />
                                </Tooltip>
                            </IconButton>
                        </UiAccessGuard>
                        <UiAccessGuard type='edit'>
                            <Tooltip title={row.isActive ? 'Deactivate' : 'Activate'}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CustomSwitch
                                        isChecked={Boolean(row.isActive)}
                                        handleChange={() => handleUpdateStatus(row)}
                                    />
                                </Box>
                            </Tooltip>
                        </UiAccessGuard>
                    </Box>
                )}
            />
            <AiKeysDialog open={Boolean(aiClient)} client={aiClient} onClose={() => setAiClient(null)} />
            <MailSettingsDialog open={Boolean(mailClient)} client={mailClient} onClose={() => setMailClient(null)} />
        </>
    )
}

export default MasterClientTable
