import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Add, FilterAltOff } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
// ** import core components
import MainCard from '@core/components/extended/MainCard'
import { CSVExport } from '@core/components/extended/CreateCSV'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import StatusBadge from '@core/components/StatusBadge'
import CustomLink from '@core/components/extended/CustomLink'
import MobileTableToolbar from '@/core/components/MobileTableToolbar'
import { CSVLink } from 'react-csv'

import { INBOUND_STATUS, isExcelQuery, TOGGLE_ALL } from '@/constants'
import { grnDataTable } from '@/app/store/slices/api/grnSlice'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { headers } from './createGoodsReceiptNote/locations'

function ViewGoodsReceiptNote() {
    const dispatch = useDispatch()
    const csvLinkRef = useRef(null)
    const hasCreateAccess = useUiAccess('create')

    // eslint-disable-next-line no-unused-vars
    const [columns, setColumns] = useState([...headers])
    const [csvData, setCsvData] = useState([])
    const [csvHeaders, setCsvHeaders] = useState([])
    const { grnDataTableLKey } = useSelector(state => state.loading)

    const [rows, setRows] = useState([])
    const [records, setRecords] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)

    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)

    const navigate = useNavigate()

    const queryHandler = async queryString => {
        const { data } = await dispatch(grnDataTable.initiate(queryString, false))
        if (isExcelQuery(queryString)) return
        setRows(
            data?.data.map(item => {
                const tempItem = { ...item }
                tempItem.original_grn_no = item?.grn_no
                tempItem.grn_no = (
                    <CustomLink href={`/inbound/goodsReceiptNote/view/${item.id}`} icon>
                        <Tooltip title='View Details' placement='bottom' arrow>
                            {item?.grn_no || `GRN-${item?.id}`}
                        </Tooltip>
                    </CustomLink>
                )
                tempItem.original_status = item?.status
                tempItem.status = (
                    <StatusBadge
                        type={INBOUND_STATUS[item?.status]?.color}
                        label={INBOUND_STATUS[item?.status].label}
                    />
                )

                return tempItem
            }) || []
        )
        setRecords(data?.recordsTotal || 0)
    }

    const handleCurrentView = () => {
        if (!rows.length) return

        setCsvHeaders(columns.filter(item => item.key !== 'id' && item.label !== 'Sr.No'))
        setCsvData(
            rows.map((item, index) => {
                const tempItem = {
                    ...item,
                    sr_no: index + 1,
                    grn_no: item?.original_grn_no || `GRN-${item.id}`,
                    status: INBOUND_STATUS[item?.original_status]?.label || item?.original_status || ''
                }
                delete tempItem.id
                return tempItem
            })
        )

        setTimeout(() => {
            if (csvLinkRef.current) {
                csvLinkRef.current.link.click()
            }
        }, 500)
    }

    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const handleCheckToggle = key => {
        setColumns([
            ...columns.map(item => {
                if (key === TOGGLE_ALL) return { ...item, visible: true }
                if (key === item.key) return { ...item, visible: !item.visible }
                return item
            })
        ])
    }

    // open add new pincode modal
    const handleAdd = () => {
        navigate('/inbound/goodsReceiptNote/create')
    }

    // use keyboard shortcut
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) {
            handleAdd()
        }
    })

    return (
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
                        <Typography variant='h3'>Goods Receipt Note</Typography>
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
                        <CSVExport handleExcelClick={handleCurrentView} exportAllFunc={handleExcelClick} />
                        <CustomButton variant='clickable' color='primary' onClick={handleAdd}>
                            Add New
                            <Add sx={{ marginLeft: '0.2rem', fontSize: '18px' }} />
                        </CustomButton>
                        {/* render action column can be made dynamic based on user authorization  */}
                        <ToggleColumns columns={columns} handler={handleCheckToggle} />
                    </Stack>
                </Box>
                <MobileTableToolbar
                    title='Goods Receipt Note'
                    isShowClearButton={isShowClearButton}
                    handleCurrentView={handleCurrentView}
                    handleExportAllExcel={handleExcelClick}
                    setClearAllFilters={setClearAllFilters}
                    handleAdd={handleAdd}
                />
                <DataTable
                    data={rows}
                    columns={columns}
                    queryHandler={queryHandler}
                    reqKey='grnDataTableLKey'
                    totalRecords={records}
                    addExcelQuery={excelHandler}
                    isCheckbox={false}
                    setIsShowClearButton={setIsShowClearButton}
                    isLoading={grnDataTableLKey}
                    clearAllFilters={clearAllFilters}
                />
                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename={`GRN_Export_${new Date()}.csv`}
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
            </Box>
        </MainCard>
    )
}

export default ViewGoodsReceiptNote
