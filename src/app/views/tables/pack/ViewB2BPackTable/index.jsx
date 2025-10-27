/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-props-no-spreading */
import { memo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { IconButton, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Edit, FilterAltOff, Print } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import { CSVExport } from '@core/components/extended/CreateCSV'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import StatusBadge from '@core/components/StatusBadge'
import TruncatedText from '@/core/components/TruncatedText'

// import permission guard
import UiAccessGuard from '@/app/guards/UiPermissionGuard'

// ** import utils
import { OUTBOUND_STATUS, TOGGLE_ALL, isExcelQuery } from '@/constants'

// ** import from redux
import { useDispatch, useSelector } from 'react-redux'

import CustomImage from '@/core/components/CustomImage'
import TabsWithSlide from '@/core/components/TabsWithSlide'
import { openSnackbar } from '@/app/store/slices/snackbar'

// ** import helper
import { packItemDataTable, boxViewDataTable } from '@/app/store/slices/api/packSlice'
import { headers, locations } from './helper'

// eslint-disable-next-line react/prop-types
function ViewB2BPackTable({ isEditPage, packId }) {
    const itemViewColumns = [
        's_no',
        'image',
        'description',
        'item_no',
        'total_quantity',
        'brand',
        'colour',
        'size',
        'mrp_price'
    ]
    const boxViewColumns = [
        's_no',
        'boxid',
        'status',
        'actual_weight',
        'dimensions',
        'quantity_total',
        'table_no',
        'created_by',
        'box_start_at',
        'box_closed_at',
        'modified_by',
        'updated_at'
    ]

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const isOpen = useSelector(state => state.modal.open)
    const [rows, setRows] = useState([])
    const [columns, setColumns] = useState(headers.filter(h => itemViewColumns.includes(h.key)))
    const [records, setRecords] = useState(0)
    const [refetch, setRefetch] = useState(false)
    const [excelHandler, setExcelHandler] = useState(false)
    const [tabVal, setTabVal] = useState(0)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const { packItemDataTableLKey, boxViewDataTableLKey } = useSelector(state => state.loading)

    const [clearAllFilters, setClearAllFilters] = useState(false)
    const currentReqKey = tabVal === 0 ? 'packItemDataTableLKey' : 'boxViewDataTableLKey'

    const queryHandler = async queryString => {
        if (!queryString || !packId) return

        if (tabVal === 0) {
            const query = queryString.replace('?', `?id=${packId}&`)
            const { data } = await dispatch(packItemDataTable.initiate(query, false))

            if (isExcelQuery(queryString)) return

            setRows(
                data?.data.map(item => ({
                    ...item,
                    description: <TruncatedText text={item?.description} />,
                    mrp: item?.mrp ? `₹ ${item?.mrp}` : '-',
                    item_no: item?.item_no || '',
                    image: (
                        <Box sx={{ display: 'flex', padding: '2px', justifyContent: 'center' }}>
                            <CustomImage
                                src={item?.image?.length > 3 ? JSON.parse(item.image)[0] : ''}
                                alt='product image'
                                styles={{
                                    width: '3rem',
                                    height: '3rem',
                                    border: '1px solid',
                                    borderRadius: '8px',
                                    objectFit: 'cover'
                                }}
                            />
                        </Box>
                    )
                })) || []
            )
            setRecords(data?.recordsTotal || 0)
        } else {
            const query = queryString.replace('?', `?id=${packId}&`)
            const { data } = await dispatch(boxViewDataTable.initiate(query, false))

            if (isExcelQuery(queryString)) return

            setRows(
                data?.data.map(item => ({
                    ...item,
                    status: (
                        <StatusBadge
                            type={OUTBOUND_STATUS[item?.status]?.color || 'unknown'}
                            label={OUTBOUND_STATUS[item?.status]?.label || 'unknown'}
                        />
                    ),
                    actual_weight: item?.actual_weight ? `${item?.actual_weight} Kg` : '',
                    dimensions:
                        item.length && item.breadth && item.height
                            ? `${item.length}*${item.breadth}*${item.height} ${item.unit || ''}`
                            : '',
                    statusText: item?.status
                })) || []
            )
            setRecords(data?.recordsTotal || 0)
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

    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    useEffect(() => {
        setRefetch(true)
        setTimeout(() => setRefetch(false), 500) // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tabVal])

    const handleTabChange = (event, newValue) => {
        if (newValue) {
            setColumns(headers.filter(h => boxViewColumns.includes(h.key)))
        } else {
            setColumns(headers.filter(h => itemViewColumns.includes(h.key)))
        }
        setTabVal(newValue)
    }

    useEffect(() => {
        setClearAllFilters(prev => !prev)
    }, [tabVal])

    return (
        <MainCard content={false}>
            <Box sx={{ paddingTop: '2px' }}>
                {/* Add your dummy buttons here */}
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        justifyContent: { xs: 'center', sm: 'flex-end' },
                        alignItems: 'center',
                        marginBottom: 0.5,
                        width: '100%',
                        flexWrap: { xs: 'wrap', sm: 'nowrap' }
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            paddingTop: { xs: 2, sm: 0 },
                            width: { xs: 'auto', sm: '100%' }
                        }}
                    >
                        <TabsWithSlide
                            labels={[`Item View (${records})`, `Box View (${records})`]}
                            tabIndex={tabVal}
                            onTabChange={handleTabChange}
                        />
                    </Box>
                    <Stack
                        direction='row'
                        flexGrow={1}
                        spacing={2}
                        alignItems='center'
                        paddingY='4px'
                        sx={{ width: '100%', justifyContent: 'flex-end' }}
                    >
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
                    reqKey={currentReqKey}
                    queryHandler={queryHandler}
                    refetch={refetch}
                    excelHandler={excelHandler}
                    totalRecords={records}
                    isLoading={tabVal === 0 ? packItemDataTableLKey : boxViewDataTableLKey}
                    isCheckbox={false}
                    {...(tabVal === 1 && {
                        renderAction: row => (
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-around',
                                    alignItems: 'center'
                                }}
                            >
                                {row?.statusText === 0 ? (
                                    <Tooltip title='Edit'>
                                        <IconButton
                                            sx={{
                                                '&:hover': {
                                                    scale: 1.1
                                                }
                                            }}
                                            size='small'
                                            aria-label='edit row'
                                            onClick={() => {
                                                navigate(
                                                    `/outbound/pack/B2B/edit/${packId}/${row?.boxid}?order_detail_id=${row?.order_detail_id}`
                                                )
                                            }}
                                        >
                                            <Edit
                                                sx={{
                                                    fill: '#60498a',
                                                    fontSize: '1rem'
                                                }}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                ) : (
                                    <Tooltip title='Non-editable'>
                                        <IconButton
                                            aria-label='non-editable'
                                            sx={{ cursor: 'default' }}
                                            disableFocusRipple
                                            disableRipple
                                            size='small'
                                        >
                                            <Edit
                                                sx={{
                                                    fontSize: '1rem'
                                                }}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {row?.statusText === 1 ? (
                                    <Tooltip title='Nothing to download'>
                                        <IconButton
                                            aria-label='non-downloadable'
                                            sx={{ cursor: 'default' }}
                                            disableFocusRipple
                                            disableRipple
                                            size='small'
                                        >
                                            <Print
                                                sx={{
                                                    fontSize: '1rem'
                                                }}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                ) : (
                                    <Tooltip title='Reprint Packing Slip'>
                                        <IconButton
                                            sx={{
                                                color: 'primary.main',
                                                '&:hover': {
                                                    scale: 1.1,
                                                    color: 'primary.dark'
                                                }
                                            }}
                                            size='small'
                                            aria-label='print-box-label'
                                            onClick={() => {
                                                dispatch(
                                                    openSnackbar({
                                                        open: true,
                                                        message: (
                                                            <Typography display='flex' alignItems='center'>
                                                                <Print /> &nbsp;&nbsp; Packing Slip reprinted
                                                                successfully
                                                            </Typography>
                                                        ),
                                                        variant: 'alert',
                                                        alert: { color: 'info', icon: 'info' },
                                                        anchorOrigin: { vertical: 'top', horizontal: 'center' },
                                                        autoHideDuration: 3000
                                                    })
                                                )
                                            }}
                                        >
                                            <Print
                                                sx={{
                                                    fontSize: '1rem'
                                                }}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        )
                    })}
                    setIsShowClearButton={setIsShowClearButton}
                    clearAllFilters={clearAllFilters}
                    tableContainerSX={{
                        maxHeight: 'max-content'
                    }}
                    rowKeyField={tabVal === 0 ? 'box_id' : 'boxid'}
                />
            </Box>
        </MainCard>
    )
}

export default memo(ViewB2BPackTable)
