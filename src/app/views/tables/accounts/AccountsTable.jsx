import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import { Add, Delete, Edit, FilterAltOff } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'

// ** import utils
import { getObjectKeys, toCapitalizedWords } from '@/utilities'

// ** import from redux
import { useGetUsersQuery } from '@app/store/slices/api/usersSlice'

// ** import hooks
import { useKeyboardShortcut } from '../../../../hooks/useKeyboardShortcut'

// ** import dummy data
import { usersDummyData } from './userDummyData'

function AccountsTable() {
    const navigate = useNavigate()
    const { data: users } = useGetUsersQuery()

    const [columns, setColumns] = useState([])
    const [excelHandler, setExcelHandler] = useState(false)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)

    // eslint-disable-next-line no-unused-vars
    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }
    const queryHandler = (key, value) => ({ key, value })

    const editHandler = (id, row) => ({ id, row })
    const deleteHandler = (id, row) => ({
        id,
        row
    })

    // this can be done by making headers and columns array
    useEffect(() => {
        let ObjectKeys = []
        if (users && users.length) {
            users.map((user, index) => {
                if (index === 0) {
                    ObjectKeys = getObjectKeys(user)
                    setColumns(
                        ObjectKeys.map((key, keyIndex) => ({
                            id: keyIndex,
                            label: toCapitalizedWords(key),
                            align: 'left',
                            search: Math.ceil(Math.random() * 10) >= 5,
                            sort: Math.ceil(Math.random() * 10) >= 5,
                            key,
                            accessKey: key
                        }))
                    )
                }

                return ObjectKeys.map(key => user[key])
            })
        } else {
            // TODO: once api integrated remove this block completely

            usersDummyData.map((user, index) => {
                if (index === 0) {
                    ObjectKeys = getObjectKeys(user)
                    setColumns(
                        ObjectKeys.map((key, keyIndex) => ({
                            id: keyIndex,
                            label: toCapitalizedWords(key),
                            // align: 'left', // use align for specific column because for specific column data types standards has been set
                            search: true,
                            sort: Math.ceil(Math.random() * 10) >= 5,
                            key,
                            accessKey: key,
                            stick: [1, 2, 3].includes(keyIndex), // pass the no. of column need to stick when user try to scroll horizontally
                            visible: key !== 'id', // hide id column
                            minWidth: key === 'status' ? 8.5 : 8, // unit = rem (required)
                            maxWidth: 8 // unit = rem (required)
                        }))
                    )
                }

                return ObjectKeys.map(key => user[key])
            })
        }
    }, [users])

    // use keyboard shortcut
    useKeyboardShortcut('Ctrl+A', () => {
        navigate('/master-client')
    })

    return (
        <MainCard content={false}>
            <Box sx={{ paddingY: 2, paddingX: 2, paddingTop: '2px' }}>
                {/* Add your dummy buttons here */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Stack direction='row' spacing={2} alignItems='center' paddingY='12px'>
                        {/* add your custom filters here */}
                        {isShowClearButton && (
                            <CustomButton
                                variant='text'
                                customStyles={{
                                    color: 'error.main',
                                    '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
                                }}
                                startIcon={<FilterAltOff />}
                                onClick={() => {
                                    setClearAllFilters(prev => !prev)
                                }}
                            >
                                Clear All Filters
                            </CustomButton>
                        )}
                        {/* <CSVExport data={csvData} filename={`accounts ${new Date()}.csv`} headers={csvHeaders} /> */}
                        <CustomButton variant='clickable' color='primary'>
                            Add New
                            <Add sx={{ marginLeft: '0.2rem', fontSize: '18px' }} />
                        </CustomButton>
                    </Stack>
                </Box>
                <DataTable
                    data={users || usersDummyData} // TODO: remove dummy data once api integrated
                    columns={columns}
                    queryHandler={queryHandler}
                    addExcelQuery={excelHandler}
                    renderAction={row => (
                        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                            <IconButton
                                sx={{ color: 'success.main' }}
                                size='small'
                                aria-label='edit row'
                                onClick={() => editHandler(row.id, row)}
                            >
                                <Tooltip title='Edit'>
                                    <Edit fontSize='8px' />
                                </Tooltip>
                            </IconButton>
                            <IconButton
                                sx={{ color: 'error.main' }}
                                size='small'
                                aria-label='delete row'
                                onClick={() => deleteHandler(row.id, row)}
                            >
                                <Tooltip title='Delete'>
                                    <Delete fontSize='8px' />
                                </Tooltip>
                            </IconButton>
                        </Box>
                    )}
                    setIsShowClearButton={setIsShowClearButton}
                    clearAllFilters={clearAllFilters}
                    isCheckbox
                />
            </Box>
        </MainCard>
    )
}

export default AccountsTable
