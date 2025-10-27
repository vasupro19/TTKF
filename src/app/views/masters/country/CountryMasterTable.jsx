import { useCallback, useMemo, useRef, useState } from 'react'

import { Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Delete from '@mui/icons-material/Delete'
// import { Add } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import DataTable from '@core/components/extended/table/Table'
// import CustomModal from '@core/components/extended/CustomModal'
import ToggleColumns from '@core/components/ToggleColumns'
import { openSnackbar } from '@app/store/slices/snackbar'
import { CSVExport } from '@/core/components/extended/CreateCSV'

// ** import utils
import { TOGGLE_ALL, isExcelQuery } from '@/constants'

// ** import from redux
// import { openModal, closeModal } from '@app/store/slices/modalSlice'
// import { useDispatch, useSelector } from 'react-redux'
import { useDispatch, useSelector } from 'react-redux'

// ** import api
import { getCountry, deactivateCountry } from '@app/store/slices/api/geoSlice'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import { closeModal, openModal } from '@/app/store/slices/modalSlice'
import { FilterAltOff } from '@mui/icons-material'
import CustomButton from '@/core/components/extended/CustomButton'
import { CSVLink } from 'react-csv'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'
import useUiAccess from '@/hooks/useUiAccess'
import useTemporaryToggle from '@/hooks/useTemporaryToggle'
import { headers } from './helper'

// import CountryMaster from '../../forms/countryMaster'
function CountryMasterTable() {
    const hasEditAccess = useUiAccess('edit')

    const [columns, setColumns] = useState([...headers])
    const [excelHandler, setExcelHandler] = useState(false)
    const [rows, setRows] = useState([])
    const [removeId, setRemoveId] = useState(null)
    const [recordsCount, setRecordsCount] = useState(0)

    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const [refetch, setRefetch] = useTemporaryToggle(false)
    const csvLinkRef = useRef(null)
    const { getCountryLKey, deactivateCountryLKey } = useSelector(state => state.loading)

    const dispatch = useDispatch()
    // const isOpen = useSelector(state => state.modal.open)

    const queryHandler = async queryString => {
        const { data } = await dispatch(getCountry.initiate(queryString))
        if (isExcelQuery(queryString)) return
        setRows(data?.data || [])
        setRecordsCount(data?.recordsTotal || 0)
    }

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
                } else if (header.key === 'updated_at') {
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

    const deleteHandler = useCallback(async id => {
        setRemoveId(id)
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const deleteActionHandler = async () => {
        try {
            await dispatch(deactivateCountry.initiate(removeId))
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'deactivated country successfully!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            setRefetch() // ? toggle state used to trigger data refetch in dataTable
        } catch (reqError) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Unable to deactivate country!',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } finally {
            dispatch(closeModal())
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
    const menuOptions = useMemo(
        () => [
            {
                label: 'Delete',
                icon: <Delete fontSize='small' sx={{ color: 'error.main' }} />,
                onClick: row => deleteHandler(row.id, row),
                condition: row => hasEditAccess
            }
        ],
        [deleteHandler, hasEditAccess]
    )
    return (
        <ContextMenuProvider>
            <MainCard content={false}>
                <Box sx={{ paddingY: 2, paddingX: 2, paddingTop: '2px' }}>
                    {/* Add your dummy buttons here */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant='h3'>All Countries</Typography>
                        </Box>
                        <Stack direction='row' spacing={2} alignItems='center' paddingY='12px'>
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
                            <UiAccessGuard>
                                <CSVExport handleExcelClick={handleCurrentView} exportAllFunc={handleExportAllExcel} />
                            </UiAccessGuard>
                            {/* render action column can be made dynamic based on user authorization  */}
                            <ToggleColumns columns={columns} handler={handleCheckToggle} />
                        </Stack>
                    </Box>
                    <DataTable
                        reqKey='getCountryLKey'
                        data={rows}
                        refetch={refetch}
                        columns={columns}
                        queryHandler={queryHandler}
                        totalRecords={recordsCount}
                        addExcelQuery={excelHandler}
                        renderAction={row => (
                            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                {/* <IconButton
                                sx={{ color: 'success.main' }}
                                size='small'
                                aria-label='edit row'
                                onClick={() => editHandler(row.id, row)}
                            >
                                <Tooltip title='Edit'>
                                    <Edit fontSize='8px' />
                                </Tooltip>
                            </IconButton> */}
                                <UiAccessGuard type='edit'>
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
                                </UiAccessGuard>
                            </Box>
                        )}
                        isCheckbox={false}
                        setIsShowClearButton={setIsShowClearButton}
                        clearAllFilters={clearAllFilters}
                        enableContextMenu
                        isLoading={getCountryLKey}
                    />
                    <PopperContextMenu options={menuOptions} />
                </Box>
                <ConfirmModal
                    title='Deactivate Country'
                    message={
                        <>
                            Are you sure you want to deactivate this country:{' '}
                            <strong>
                                {rows?.find(country => country?.id === removeId)?.country_name || 'Unknown'}
                            </strong>
                            ?
                        </>
                    }
                    icon='warning'
                    confirmText='Yes, Deactivate'
                    customStyle={{ width: { xs: '300px', sm: '456px' } }}
                    onConfirm={deleteActionHandler}
                    isLoading={deactivateCountryLKey}
                />
                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename='Country_Master_Export.csv'
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}

export default CountryMasterTable
