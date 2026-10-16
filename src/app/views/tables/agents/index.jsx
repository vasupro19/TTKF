import { useCallback, useMemo } from 'react'
import { Box, IconButton, Tooltip } from '@mui/material'
import { Edit } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import ListPage from '@core/listing/ListPage'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { getAgents, useGetAgentOptionsQuery } from '@/app/store/slices/api/agentSlice'
import { headers } from './helper'
import { filtersFor } from './agentFacts'

// ? the agents (other travel agencies) you work with
function MasterAgentTable() {
    const navigate = useNavigate()
    const hasCreateAccess = useUiAccess('create')
    // ? the dropdowns list the cities and states that exist, not a made-up list
    const { data: optionsResponse } = useGetAgentOptionsQuery()

    const filters = useMemo(() => filtersFor(optionsResponse?.data), [optionsResponse])
    const add = useCallback(() => navigate('/master/agent/add'), [navigate])
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) add()
    })

    return (
        <ListPage
            title='Agents'
            subtitle='The travel agents you work with.'
            noun='agents'
            searchPlaceholder='Search name, city, state, email or phone'
            headers={headers}
            endpoint={getAgents}
            reqKey='getAgentMasterLKey'
            filters={filters}
            csvName='agents'
            canAdd
            addLabel='Add Agent'
            onAdd={add}
            emptyText='Add the agents you work with, then pick them when you create a booking.'
            renderAction={row => (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <UiAccessGuard type='edit'>
                        <Tooltip title='Edit'>
                            <IconButton
                                size='small'
                                aria-label={`Edit ${row.name}`}
                                onClick={() => navigate(`/master/agent/edit/${row.id}`)}
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

export default MasterAgentTable
