import { useEffect, useMemo, useRef, useState } from 'react'

import { Typography, FormControlLabel, CircularProgress } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Edit from '@mui/icons-material/Edit'
// import Delete from '@mui/icons-material/Delete'
import { Add, FilterAltOff } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import CustomModal from '@core/components/extended/CustomModal'
import ToggleColumns from '@core/components/ToggleColumns'
import { openSnackbar } from '@app/store/slices/snackbar'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'
import CustomSwitch from '@core/components/extended/CustomSwitch'
import MobileTableToolbar from '@/core/components/MobileTableToolbar'

// ** import utils
import { TOGGLE_ALL, isExcelQuery } from '@/constants'

// ** import from redux
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { getCity, deactivateCity } from '@app/store/slices/api/geoSlice'

// ** import sub-components
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { CSVLink } from 'react-csv'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import useTemporaryToggle from '@/hooks/useTemporaryToggle'
import ImportCities from './ImportCities'
import { headers } from './helper'

function CityMasterTable() {
    const dispatch = useDispatch()
    const hasCreateAccess = useUiAccess('create')
    const hasEditAccess = useUiAccess('edit')

    // app state
    const loading = useSelector(state => state.loading)
    const isOpen = useSelector(state => state.modal.open)
    const [columns, setColumns] = useState([...headers])
    const [excelHandler, setExcelHandler] = useState(false)
    const [rows, setRows] = useState([])
    const [recordsCount, setRecordsCount] = useState(0)

    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const [refetch, setRefetch] = useTemporaryToggle(false)
    const csvLinkRef = useRef(null)

    const queryHandler = async queryString => {
        if (!queryString) return
        const { data } = await dispatch(getCity.initiate(queryString, false))
        if (isExcelQuery(queryString)) return
        setRows(data?.data || [])
        setRecordsCount(data?.recordsFiltered || data?.recordsTotal || 0)
    }
    const deleteHandler = async id => {
        let message = 'Unable to deactivate city'
        let isError = false
        try {
            const response = await dispatch(deactivateCity.initiate(id))
            if (response?.error) throw Error(response?.error?.data?.message || message)
            message = 'deactivated city successfully!'
        } catch (error) {
            isError = true
            message = error?.data?.message || error?.message || message
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )

            setRefetch()
        }
    }

    // column toggler
    const handleCheckToggle = key => {
        setColumns([
            ...columns.map(item => {
                if (key === TOGGLE_ALL) return { ...item, visible: true }
                if (key === item.key) return { ...item, visible: !item.visible }
                return item
            })
        ])
    }

    // open add new pinCode modal
    const handleAdd = (id = null) => {
        dispatch(
            openModal({
                content: <ImportCities formId={id} />,
                title: <Typography variant='h3'>Add Cities</Typography>
            })
        )
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const editHandler = id => handleAdd(id)

    const handleExportAllExcel = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const handleCurrentView = () => {
        if (!rows.length) return

        const visibleHeaders = headers.filter(header => header.visible && header.label !== 'Sr.No.')

        const dynamicHeaders = visibleHeaders.map(header => ({
            label: header.label,
            key: header.key
        }))

        const exportData = rows.map(item => {
            const row = {}

            visibleHeaders.forEach(header => {
                if (header.key === 'created_at') {
                    row[header.key] = item[header.key] ? new Date(item[header.key]).toLocaleString() : ''
                } else if (header.key === 'modified_at') {
                    row[header.key] = item[header.key] ? new Date(item[header.key]).toLocaleString() : ''
                } else {
                    row[header.key] = item[header.key] || ''
                }
            })

            return row
        })

        setCsvHeaders(dynamicHeaders)
        setCsvData(exportData)

        setTimeout(() => {
            if (csvLinkRef.current) {
                csvLinkRef.current.link.click()
            }
        }, 500)
    }

    const menuOptions = useMemo(
        () => [
            {
                label: 'Edit',
                icon: <Edit fontSize='small' sx={{ fill: '#60498a' }} />,
                onClick: row => editHandler(row.id, row),
                // eslint-disable-next-line no-unused-vars
                condition: row => hasEditAccess
            }
        ],
        [editHandler, hasEditAccess]
    )

    useEffect(() => {
        if (!isOpen) {
            setRefetch()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    // use keyboard shortcut
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) {
            handleAdd()
        }
    })

    return (
        <ContextMenuProvider>
            <MainCard content={false}>
                <Box sx={{ paddingY: 2, paddingX: { xs: 1.5, sm: 1 }, paddingTop: '2px', position: 'relative' }}>
                    <Box
                        sx={{
                            display: { xs: 'none', md: 'flex' },

                            gap: 2,
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <Box>
                            <Typography variant='h3'>All Cities</Typography>
                        </Box>
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
                            <UiAccessGuard>
                                <CSVExport handleExcelClick={handleCurrentView} exportAllFunc={handleExportAllExcel} />
                            </UiAccessGuard>
                            <UiAccessGuard type='create'>
                                <CustomButton variant='clickable' color='primary' onClick={handleAdd}>
                                    Add New
                                    <Add sx={{ marginLeft: '0.2rem', fontSize: '18px' }} />
                                </CustomButton>
                            </UiAccessGuard>

                            {/* render action column can be made dynamic based on user authorization  */}
                            <ToggleColumns columns={columns} handler={handleCheckToggle} />
                        </Stack>
                    </Box>
                    <MobileTableToolbar
                        title='All Cities'
                        isShowClearButton={isShowClearButton}
                        handleCurrentView={handleCurrentView}
                        handleExportAllExcel={handleExportAllExcel}
                        setClearAllFilters={setClearAllFilters}
                        handleAdd={handleAdd}
                    />
                    <DataTable
                        reqKey='getCityLKey'
                        data={rows}
                        columns={columns}
                        refetch={refetch}
                        queryHandler={queryHandler}
                        totalRecords={recordsCount}
                        addExcelQuery={excelHandler}
                        renderAction={row => (
                            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                <UiAccessGuard type='edit'>
                                    <IconButton
                                        sx={{ color: 'success.main' }}
                                        size='small'
                                        aria-label='edit row'
                                        onClick={() => editHandler(row.id, row)}
                                    >
                                        <Tooltip title='Edit'>
                                            <Edit fontSize='8px' sx={{ fill: '#60498a' }} />
                                        </Tooltip>
                                    </IconButton>
                                </UiAccessGuard>

                                {/* <IconButton
                                sx={{ color: row.active ? 'success.main' : 'error.main' }}
                                size='small'
                                aria-label='delete row'
                                onClick={() => deleteHandler(row.id, row)}
                            >
                                <Tooltip title={row.active ? 'Deactivate' : 'Activate'}>
                                    <Delete fontSize='8px' />
                                </Tooltip>
                            </IconButton> */}
                                <UiAccessGuard type='edit'>
                                    <Tooltip title={row.active ? 'Deactivate' : 'Activate'}>
                                        {loading[`deactivateCityDL${row?.id}`] ? (
                                            <CircularProgress size='14px' color='success' sx={{ ml: 2 }} />
                                        ) : (
                                            <FormControlLabel
                                                sx={{ margin: '0px' }}
                                                control={
                                                    <CustomSwitch
                                                        // isChecked={row?.status === 'Active'}
                                                        isChecked={row.active}
                                                        handleChange={() => {
                                                            deleteHandler(row.id)
                                                        }}
                                                    />
                                                }
                                            />
                                        )}
                                    </Tooltip>
                                </UiAccessGuard>
                            </Box>
                        )}
                        isCheckbox={false}
                        setIsShowClearButton={setIsShowClearButton}
                        clearAllFilters={clearAllFilters}
                        isLoading={loading.getCityLKey}
                        enableContextMenu
                    />
                    <PopperContextMenu options={menuOptions} />
                </Box>
                <CustomModal open={isOpen} handleClose={() => dispatch(closeModal())} />
                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename='City_Export.csv'
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}

export default CityMasterTable
