import { useEffect, useState } from 'react'

import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Edit from '@mui/icons-material/Edit'
import Delete from '@mui/icons-material/Delete'
import TextField from '@mui/material/TextField'

import { useDispatch } from 'react-redux'
// project imports
import MainCard from '@core/components/extended/MainCard'
import { CSVExport } from '@core/components/extended/CreateCSV'
import DataTable from '@core/components/extended/table/Table'

import { useGetClientQuery, getClient } from '@app/store/slices/api/clientSlice'

import { getObjectKeys, toCapitalizedWords } from '@/utilities'
import CustomButton from '@/core/components/extended/CustomButton'
import { FilterAltOff } from '@mui/icons-material'

const slimTextFieldStyle = {
    '& .MuiInputBase-input': {
        fontSize: 12,
        height: 8,
        padding: 1
    }
}

// const headers = ["id", "name", "email"]
// const columns = [
//     { id: 'name', label: 'Name', sort: false,
//         search: false,
//         key: your column key for query string generation },
//     { id: 'code', label: 'ISO\u00a0Code', sort: false,
//         search: false,
//         key: your column key for query string generation },
//     {
//         id: 'population',
//         label: 'Population',
//         minWidth: 170,
//         format: value => value.toLocaleString('en-US'),
//         sort: false,
//         search: false,
//         key: your column key for query string generation
//     },
//     {
//         id: 'size',
//         label: 'Size\u00a0(km\u00b2)',
//         align: 'right',
//         format: value => value.toLocaleString('en-US'),
//         sort: false,
//         search: false,
//         key: your column key for query string generation
//     },
//     {
//         id: 'density',
//         label: 'Density',
//         align: 'right',
//         format: value => typeof value === 'number' && value.toFixed(2),
//         sort: false,
//         search: false,
//         key: your column key for query string generation
//     }
// ]
const staticQuery = '?start=0&length=10'
function DummyTable() {
    const dispatch = useDispatch()
    const { data, error, isLoading } = useGetClientQuery(staticQuery)

    const [columns, setColumns] = useState([])
    const [csvData, setCsvData] = useState([])
    const [csvHeaders, setCsvHeaders] = useState([])
    const [users, setUsers] = useState([])
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)

    const queryHandler = async (key, value) => {
        const result = await dispatch(getClient.initiate(key))
        setUsers(result.data.data)
    }

    const editHandler = (id, row) => {
        console.log('edit id ', id, row)
    }
    const deleteHandler = (id, row) => {
        console.log('delete id ', id, row)
    }

    // this can be done by making headers and columns array
    useEffect(() => {
        let ObjectKeys = []
        if (users && users.length) {
            const tableData = users.map((user, index) => {
                if (index === 0) {
                    ObjectKeys = getObjectKeys(user)
                    setCsvHeaders(ObjectKeys)
                    setColumns(
                        ObjectKeys.map((key, keyIndex) => ({
                            id: keyIndex,
                            label: toCapitalizedWords(key),
                            align: 'left',
                            search: Math.ceil(Math.random() * 10) >= 5,
                            sort: Math.ceil(Math.random() * 10) >= 5,
                            key,
                            accessKey: key,
                            stick: [0, 1, 2, 3].includes(keyIndex), // pass the no. of column need to stick when user try to scroll horizontally
                            visible: key !== 'id', // hide id column
                            minWidth: key === 'status' ? 8.5 : 8, // unit = rem (required)
                            maxWidth: 8 // unit = rem (required)
                        }))
                    )
                }

                return ObjectKeys.map(key => user[key])
            })
            setCsvData(tableData)
        }
    }, [users])

    useEffect(() => {
        if (Array.isArray(data?.data)) setUsers(data.data)
    }, [isLoading, data])

    return (
        <MainCard
            content={false}
            title='Users'
            secondary={
                <Stack direction='row' spacing={2} alignItems='center'>
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
                    {/* add your custom filters here */}
                    <TextField
                        placeholder='from date'
                        size='small'
                        type='date'
                        sx={slimTextFieldStyle}
                        onChange={e => console.log('filter date ', e.target.value)}
                    />
                    <TextField
                        placeholder='To Date'
                        type='date'
                        size='small'
                        sx={slimTextFieldStyle}
                        onChange={e => console.log('filter date ', e.target.value)}
                    />
                    <CSVExport data={csvData} filename={`users ${new Date()}.csv`} headers={csvHeaders} />
                </Stack>
            }
        >
            <DataTable
                data={users || []}
                columns={columns}
                queryHandler={queryHandler}
                renderAction={row => (
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                        <IconButton
                            sx={{ color: 'success.main' }}
                            size='small'
                            aria-label='edit row'
                            onClick={() => editHandler(row.id, row)}
                        >
                            <Tooltip title='Edit'>
                                <Edit />
                            </Tooltip>
                        </IconButton>
                        <IconButton
                            sx={{ color: 'error.main' }}
                            size='small'
                            aria-label='edit row'
                            onClick={() => deleteHandler(row.id, row)}
                        >
                            <Tooltip title='Delete'>
                                <Delete />
                            </Tooltip>
                        </IconButton>
                    </Box>
                )}
                setIsShowClearButton={setIsShowClearButton}
                clearAllFilters={clearAllFilters}
            />
        </MainCard>
    )
}

export default DummyTable
