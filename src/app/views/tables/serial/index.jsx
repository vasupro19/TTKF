import { useEffect, useState, useRef } from 'react'

import { IconButton, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Edit, FilterAltOff, QrCode, ShoppingBasket, Shuffle } from '@mui/icons-material'

import { CSVLink } from 'react-csv'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import { CSVExport } from '@core/components/extended/CreateCSV'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import CustomModal from '@core/components/extended/CustomModal'
import ToggleColumns from '@core/components/ToggleColumns'
import DropdownMenu from '@/core/components/DropdownMenu'
import StatusBadge from '@/core/components/StatusBadge'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'
import MobileTableToolbar from '@/core/components/MobileTableToolbar'

// ** import utils
// import { getObjectKeys, toCapitalizedWords } from '@/utilities'
import { isExcelQuery, TOGGLE_ALL } from '@/constants'
// ** import from redux
import { openModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { serialDataTable } from '@/app/store/slices/api/serialSlice'

import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'

// ** import sub-components
import CreateSerialModal from './CreateSerialModal'
import CreateRandomModal from './CreateRandomModal'
import CreatePOGenerateSerialModal from './CreatePOGenerateSerialModal'
import EditSerialGenerateModal from './EditSerialGenerateModal'

// ** import dummy data
// import { locations } from './helper'

import { headers, STATUS_TYPE } from './helper'

function MasterSerialTable() {
    const hasCreateAccess = useUiAccess('create')
    const [refetch, setRefetch] = useState(false)
    const [columns, setColumns] = useState([...headers])
    const [rows, setRows] = useState([])
    const [records, setRecords] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)
    const [csvHeaders, setCsvHeaders] = useState([])
    const [csvData, setCsvData] = useState([])
    const csvLinkRef = useRef(null)

    const loading = useSelector(state => state.loading)
    const { open: isOpen } = useSelector(state => state.modal)
    const dispatch = useDispatch()
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)

    const queryHandler = async query => {
        const { data: response } = await dispatch(serialDataTable.initiate(query, false))
        if (isExcelQuery(query)) return
        const transformedData =
            response?.data.map(item => ({
                ...item,
                mapping_status: (
                    <StatusBadge
                        type={STATUS_TYPE[item.mapping_status].color}
                        label={STATUS_TYPE[item.mapping_status].label}
                    />
                ),
                original_grn_status: item.grn_status,
                grn_status: (
                    <StatusBadge type={STATUS_TYPE[item.grn_status].color} label={STATUS_TYPE[item.grn_status].label} />
                )
            })) || []

        setRows(transformedData)
        setRecords(response?.recordsTotal || 0)
    }

    const handleExportAllExcel = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const handleCurrentView = () => {
        if (!rows.length) return

        const visibleHeaders = headers.filter(
            header => header.visible && header.label !== 'Sr. No.' && header.label !== 'Account Name'
        )

        const dynamicHeaders = visibleHeaders.map(header => ({
            label: header.label,
            key: header.key
        }))

        const exportData = rows.map(item => {
            const row = {}

            visibleHeaders.forEach(header => {
                if (header.key === 'uid') {
                    row[header.key] = item[header.key] || ''
                } else if (header.key === 'mapping_status') {
                    row[header.key] = item[header.key]?.props?.label || ''
                } else if (header.key === 'grn_status') {
                    row[header.key] = item[header.key]?.props?.label || ''
                } else if (header.key === 'created_at') {
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

    // open add new modal
    const handleAdd = (action, isEdit, editId) => {
        dispatch(
            openModal({
                content:
                    // eslint-disable-next-line no-nested-ternary
                    action === 'random' ? (
                        <CreateRandomModal />
                    ) : // eslint-disable-next-line no-nested-ternary
                    action === 'PO_SERIAL_GENERATION' ? (
                        <CreatePOGenerateSerialModal />
                    ) : action === 'Edit' ? (
                        <EditSerialGenerateModal uid={editId} />
                    ) : (
                        <CreateSerialModal isEdit={isEdit} editId={editId} />
                    ),
                closeOnBackdropClick: false,
                customStyles: action === 'PO_SERIAL_GENERATION' ? { paddingTop: 3, paddingBottom: '8px' } : {}
            })
        )
    }
    const editHandler = (id, row) => handleAdd('Edit', true, row.uid)

    const dropdownOptions = [
        { label: 'Random', action: 'random', icon: <Shuffle /> },
        { label: 'For UPC/EAN', action: 'UPC_EAN', icon: <QrCode /> },
        { label: 'PO Serial Generation', action: 'PO_SERIAL_GENERATION', icon: <ShoppingBasket /> }
    ]

    // Define context menu options
    const menuOptions = [
        {
            label: 'Edit',
            icon: <Edit fontSize='small' />,
            onClick: row => editHandler(row.id, row),
            condition: row => row?.grn_status?.props?.label === '# N/A'
        }
    ]

    useEffect(() => {
        setRefetch(true)
        setTimeout(() => setRefetch(false), 500)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    // use keyboard shortcut
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) {
            handleAdd('random')
        }
    })

    return (
        <ContextMenuProvider>
            <MainCard content={false}>
                <Box sx={{ paddingY: 2, paddingX: { xs: 1.5, sm: 1 }, paddingTop: '2px' }}>
                    <Box
                        sx={{
                            display: { xs: 'none', md: 'flex' },

                            gap: 2,
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <Box>
                            <Typography variant='h3'>All Serial IDs</Typography>
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
                            <CSVExport handleExcelClick={handleCurrentView} exportAllFunc={handleExportAllExcel} />
                            <DropdownMenu
                                buttonText='Generate'
                                options={dropdownOptions}
                                onOptionClick={action => {
                                    handleAdd(action)
                                }}
                            />
                            <ToggleColumns columns={columns} handler={handleCheckToggle} />
                        </Stack>
                    </Box>
                    <MobileTableToolbar
                        title='All Serial IDs'
                        isShowClearButton={isShowClearButton}
                        handleCurrentView={handleCurrentView}
                        handleExportAllExcel={handleExportAllExcel}
                        setClearAllFilters={setClearAllFilters}
                        handleAdd={handleAdd}
                    />
                    <DataTable
                        data={rows}
                        columns={columns}
                        reqKey='getSerialLKey'
                        refetch={refetch}
                        queryHandler={queryHandler}
                        isCheckbox={false}
                        addExcelQuery={excelHandler}
                        totalRecords={records}
                        renderAction={row => (
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-around',
                                    alignItems: 'center'
                                }}
                            >
                                {row?.grn_status?.props?.label === '# N/A' ? (
                                    <IconButton
                                        sx={{
                                            color: 'success.main',
                                            '&.Mui-disabled': {
                                                opacity: 0.3
                                            }
                                        }}
                                        size='small'
                                        aria-label='edit row'
                                        onClick={() => editHandler(row.id, row)}
                                        disabled={row.original_grn_status === 1}
                                    >
                                        <Tooltip title={row.original_grn_status === 1 ? '' : 'Edit'}>
                                            <Edit fontSize='8px' sx={{ fill: '#60498a' }} />
                                        </Tooltip>
                                    </IconButton>
                                ) : (
                                    <IconButton
                                        size='small'
                                        sx={{ cursor: 'default' }}
                                        disableFocusRipple
                                        disableRipple
                                    >
                                        <Tooltip title='GRN Completed'>
                                            <Edit fontSize='8px' />
                                        </Tooltip>
                                    </IconButton>
                                )}
                            </Box>
                        )}
                        setIsShowClearButton={setIsShowClearButton}
                        clearAllFilters={clearAllFilters}
                        isLoading={loading.getSerialLKey}
                        enableContextMenu
                    />
                    <PopperContextMenu options={menuOptions} />
                </Box>
                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename='UIDs_Export.csv'
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
                <CustomModal />
            </MainCard>
        </ContextMenuProvider>
    )
}

export default MasterSerialTable
