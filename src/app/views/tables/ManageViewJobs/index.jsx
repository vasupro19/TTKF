/* eslint-disable */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { FormControlLabel, IconButton, TextField, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Add, AllInbox, Cancel, Edit, FilterAltOff, Search, TextFields, Upload } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import { CSVExport } from '@core/components/extended/CreateCSV'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import CustomModal from '@core/components/extended/CustomModal'
import ToggleColumns from '@core/components/ToggleColumns'
import CustomSwitch from '@core/components/extended/CustomSwitch'
import StatusBadge from '@core/components/StatusBadge'
import DropdownMenu from '@/core/components/DropdownMenu'
import ImportFileModal from '@/core/components/modals/ImportFileModal'

// import permission guard
import UiAccessGuard from '@/app/guards/UiPermissionGuard'

// ** import utils
import { TOGGLE_ALL, isExcelQuery } from '@/constants'

// ** import from redux
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { storageZoneDataTable, useDeactivateStorageZoneMutation } from '@/app/store/slices/api/storageLocationSlice'

// ** import sub-components
import { openSnackbar } from '@/app/store/slices/snackbar'

// ** import helper
import { headers, locations, STATUS_TYPE } from './helper'
import CustomLink from '@/core/components/extended/CustomLink'
import ArrowButton from '@/core/components/arrowbutton/ArrowButton'
import AlignedText from '@/core/components/alignedText'
import { getStatusVariant } from './helper'

function ManageViewJobTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const modalType = useSelector(state => state.modal.type)
    const isOpen = useSelector(state => state.modal.open)
    const [deactivateStorageZone] = useDeactivateStorageZoneMutation()
    const [rows, setRows] = useState([])
    const [columns, setColumns] = useState([...headers])
    const [records, setRecords] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)
    const [staticQuery, setStaticQuery] = useState('?start=0&length=10')
    const [activePopup, setActivePopup] = useState(null)
    const [inputVal, setInputVal] = useState('')
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)

    const handleClearInput = () => {
        setInputVal('')
    }

    const handleInputChange = e => {
        setInputVal(e.target.value)
    }

    const queryHandler = async query => {
        // setStaticQuery(query)
        // const { data: response } = await dispatch(storageZoneDataTable.initiate(query))
        // if (isExcelQuery(query)) return

        setRows(
            locations.map(loc => ({
                id: loc?.id,
                user_name: loc?.user_name ?? '-',
                item_id: (
                    <Tooltip title={loc?.item_id} placement='bottom' unselectable='on' arrow>
                        <Typography
                            sx={{
                                fontSize: '12px',
                                userSelect: 'none', // Prevent text selection
                                cursor: 'default' // Avoid text cursor appearance
                            }}
                        >
                            {`${loc?.item_id.slice(0, 2)}****${loc?.item_id.slice(-2)}`}
                        </Typography>
                    </Tooltip>
                ),
                EAN: loc?.EAN ?? '-',
                bin_id: loc?.bin_id ?? '-',
                location: loc?.location ?? '-',
                job_status: (
                    <ArrowButton
                        label={
                            <Typography variant='h6' sx={{ color: '#fff', fontSize: '12px' }}>
                                {loc.job_status}
                            </Typography>
                        }
                        variant={getStatusVariant(loc?.job_status)}
                        nonClickable={true}
                        customStyles={{ width: '100%' }}
                    />
                ),
                started_at: loc?.started_at ?? '-',
                completed_at: loc?.completed_at ?? '-'
            })) || []
        )

        setRecords(locations?.length || 0)
        // setRecords(response?.recordsTotal || 0)
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

    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    useEffect(() => {
        if (!isOpen) queryHandler(staticQuery)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    return (
        <MainCard content={false}>
            <Box sx={{ paddingTop: '2px' }}>
                {/* Add your dummy buttons here */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
                    {/* <Box>
                        <Typography variant='h3'>Put Away Details</Typography>
                    </Box> */}
                    <Stack direction='row' spacing={2} alignItems='center' paddingY='4px'>
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
                            <CSVExport handleExcelClick={handleExcelClick} />
                        </UiAccessGuard>

                        {/* render action column can be made dynamic based on user authorization  */}
                        <ToggleColumns columns={columns} handler={handleCheckToggle} />
                    </Stack>
                </Box>
                <DataTable
                    data={rows}
                    columns={columns}
                    queryHandler={queryHandler}
                    excelHandler={excelHandler}
                    totalRecords={records}
                    isCheckbox={false}
                    setIsShowClearButton={setIsShowClearButton}
                    clearAllFilters={clearAllFilters}
                />
            </Box>
        </MainCard>
    )
}

export default ManageViewJobTable
