import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import { Add, Edit } from '@mui/icons-material'
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { useGetClientRolesQuery } from '@/app/store/slices/api/roleSlice'
import { dateTimeFormatter } from '@/utilities'
import { headers } from './helper'

function SetupRoleTable() {
    const navigate = useNavigate()
    const { data: response, isLoading, isFetching } = useGetClientRolesQuery()
    const [columns] = useState([...headers])

    const roles = useMemo(() => {
        const allRoles = response?.data || []
        return allRoles.map(role => ({
            ...role,
            createdAt: dateTimeFormatter(role.createdAt),
            updatedAt: dateTimeFormatter(role.updatedAt)
        }))
    }, [response?.data])

    return (
        <MainCard content={false}>
            <Box sx={{ px: 2, py: 2.5 }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                    <Typography variant='h3'>Role Master</Typography>
                    <Stack direction='row' spacing={2} alignItems='center'>
                        <UiAccessGuard type='create'>
                            <CustomButton
                                variant='clickable'
                                color='primary'
                                onClick={() => navigate('/userManagement/role/create')}
                            >
                                Add Role
                                <Add sx={{ ml: 0.5, fontSize: 18 }} />
                            </CustomButton>
                        </UiAccessGuard>
                    </Stack>
                </Box>

                <DataTable
                    data={roles}
                    columns={columns}
                    queryHandler={async () => true}
                    totalRecords={roles.length}
                    isCheckbox={false}
                    isLoading={isLoading || isFetching}
                    renderAction={row => (
                        <UiAccessGuard type='edit'>
                            <Tooltip title='Edit role'>
                                <IconButton size='small' onClick={() => navigate(`/userManagement/role/${row.id}`)}>
                                    <Edit fontSize='small' sx={{ fill: '#60498a' }} />
                                </IconButton>
                            </Tooltip>
                        </UiAccessGuard>
                    )}
                />
            </Box>
        </MainCard>
    )
}

export default SetupRoleTable
