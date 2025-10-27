/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'

import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { FilterAltOff } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import { CSVExport } from '@core/components/extended/CreateCSV'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'

// import permission guard
import UiAccessGuard from '@/app/guards/UiPermissionGuard'

// ** import utils
import { TOGGLE_ALL, isExcelQuery } from '@/constants'

// ** import from redux
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'

// ** import sub-components
import { openSnackbar } from '@/app/store/slices/snackbar'

// ** import helper

import ConfirmModal from '@/core/components/modals/ConfirmModal'
import CustomImage from '@/core/components/CustomImage'
import TruncatedText from '@/core/components/TruncatedText'
import { packItemDataTable } from '@/app/store/slices/api/packSlice'
import { headers, locations } from './helper'

// eslint-disable-next-line react/prop-types
function ViewB2CPackTable({ renderToolBarElement }) {
    const dispatch = useDispatch()
    const location = useLocation()
    const { id: packId } = useParams()

    const { pickListStatus } = location.state || {}
    const { packItemDataTableLKey } = useSelector(state => state.loading)

    const modalType = useSelector(state => state.modal.type)
    const isOpen = useSelector(state => state.modal.open)
    const [rows, setRows] = useState([])
    const [columns, setColumns] = useState([...headers])
    const [records, setRecords] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)
    const [refetch, setRefetch] = useState(false)
    const [inputVal, setInputVal] = useState('')
    const [tabVal, setTabVal] = useState(0)
    const [activeModal, setActiveModal] = useState(null)
    const [removeId, setRemoveId] = useState(null)
    const [isShowClearButton, setIsShowClearButton] = useState(false)

    const [clearAllFilters, setClearAllFilters] = useState(false)

    // const rowKeys = ['id', 'style_code', 'description', 'ean', 'qty_tab_A', 'brand', 'colour', 'size', 'mrp', 'image']
    const queryHandler = async queryString => {
        if (!queryString || !packId) return
        const query = queryString.replace('?', `?id=${packId}&`)
        const { data } = await dispatch(packItemDataTable.initiate(query, false))
        if (isExcelQuery(queryString)) return
        setRows(
            data?.data.map(item => ({
                ...item,
                description_2: <TruncatedText text={item?.description_2} />,
                mrp_price: item?.mrp_price ? `₹ ${item?.mrp_price}` : '-',
                image: (
                    <Box
                        sx={{
                            display: 'flex',
                            padding: '2px',
                            justifyContent: 'center'
                        }}
                    >
                        <CustomImage
                            src={item?.image.length > 3 ? JSON.parse(item?.image)[0] : ''}
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
    }
    // const queryHandler = async query => {
    //     // Map each location to only include the keys defined in rowKeys
    //     const newRows = locations.map(loc =>
    //         rowKeys.reduce((acc, key) => {
    //             if (key === 'image') {
    //                 acc[key] = (
    //                     <Box
    //                         sx={{
    //                             display: 'flex',
    //                             padding: '2px',
    //                             justifyContent: 'center'
    //                         }}
    //                     >
    //                         <CustomImage
    //                             src={loc?.image}
    //                             alt='product image'
    //                             styles={{
    //                                 width: '3rem',
    //                                 height: '3rem',
    //                                 border: '1px solid',
    //                                 borderRadius: '8px'
    //                             }}
    //                         />
    //                     </Box>
    //                 )
    //             } else if (key === 'description') {
    //                 acc[key] = <TruncatedText text={loc?.description} />
    //             } else {
    //                 acc[key] = loc?.[key] ?? (['qty', 'mrp'].includes(key) ? '0' : '-')
    //             }
    //             return acc
    //         }, {})
    //     )

    //     // Filter headers based on the same keys
    //     const filteredColumns = headers.filter(header => rowKeys.includes(header.key))

    //     // Update the rows, columns and record count
    //     setRows(newRows)
    //     setColumns(filteredColumns)
    //     setRecords(locations?.length || 0)
    // }

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

    const handleTabChange = (event, newValue) => {
        setTabVal(newValue)
    }

    const deleteHandler = id => {
        setRemoveId(id)
        setActiveModal('deleteBox')
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
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
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        marginBottom: 0.5,
                        width: '100%'
                    }}
                >
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
                        {renderToolBarElement}
                        <UiAccessGuard>
                            <CSVExport handleExcelClick={handleExcelClick} />
                        </UiAccessGuard>

                        {/* render action column can be made dynamic based on user authorization  */}
                        <ToggleColumns columns={columns} handler={handleCheckToggle} />
                    </Stack>
                </Box>

                <DataTable
                    data={(pickListStatus === 'Open' || pickListStatus === 'Pendency') && tabVal === 1 ? [] : rows}
                    columns={columns}
                    queryHandler={queryHandler}
                    excelHandler={excelHandler}
                    totalRecords={records}
                    isCheckbox={false}
                    setIsShowClearButton={setIsShowClearButton}
                    clearAllFilters={clearAllFilters}
                    tableContainerSX={{
                        maxHeight: 'max-content'
                    }}
                />
                {modalType === 'confirm_modal' &&
                    (activeModal === 'deleteBox' ? (
                        <ConfirmModal
                            title='Delete Box'
                            message={`Are you sure you want to delete box (${removeId}) ?`}
                            icon='warning'
                            cancelText='Go Back'
                            confirmText='Yes, delete'
                            customStyle={{ width: { xs: '320px', sm: '480px' } }}
                            onConfirm={() => {
                                dispatch(
                                    openSnackbar({
                                        open: true,
                                        message: 'Deleted successfully!',
                                        variant: 'alert',
                                        alert: { color: 'info', icon: 'info' },
                                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                                    })
                                )
                                setActiveModal(null)
                                dispatch(closeModal())
                            }}
                            btnContainerSx={{
                                flexDirection: 'row-reverse',
                                gap: 1,
                                justifyContent: 'end'
                            }}
                        />
                    ) : null)}
            </Box>
        </MainCard>
    )
}

export default ViewB2CPackTable
