/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState, useRef } from 'react'

import { Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { FilterAltOff } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import TruncatedText from '@/core/components/TruncatedText'
import CustomImage from '@/core/components/CustomImage'

import { isExcelQuery, TOGGLE_ALL } from '@/constants'

import { DeleteAnimIcon } from '@/assets/icons/DeleteAnimIcon'
import { closeModal, openModal } from '@/app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'
import { packItemDataTable } from '@/app/store/slices/api/packSlice'

import PropTypes from 'prop-types'
// ** import dummy data
import { headers } from './helper'

// const staticQuery =
function B2BPackItemTable({ RenderToolBarElement, refetchItems, orderId }) {
    const removeItemIdRef = useRef(null)
    const dispatch = useDispatch()
    const isOpen = useSelector(state => state.modal.open)
    const { packItemDataTableLKey } = useSelector(state => state.loading)

    // eslint-disable-next-line no-unused-vars
    const [config, setConfig] = useState({
        markClose: 0,
        markRelease: 0,
        vehicleReleaseDate: '',
        geCreatedAt: ''
    })
    const [columns, setColumns] = useState([...headers])
    // eslint-disable-next-line no-unused-vars
    const [excelHandler, setExcelHandler] = useState(false)

    const [gEData, setGeData] = useState([])
    // eslint-disable-next-line no-unused-vars
    const [recordCount, setRecordCount] = useState(0)
    const clearSelectionRef = useRef(null)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    // eslint-disable-next-line no-unused-vars
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [activeModal, setActiveModal] = useState(null)
    const [selectedRow, setSelectedRow] = useState([])
    const [refetch, setRefetch] = useState(false)

    // query handler
    const queryHandler = async queryString => {
        if (!queryString || !orderId) return
        const query = queryString.replace('?', `?id=${orderId}&`)
        const { data } = await dispatch(packItemDataTable.initiate(query, false))
        if (isExcelQuery(queryString)) return
        setGeData(
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
        setRecordCount(data?.recordsTotal || 0)
    }

    useEffect(() => {
        if (refetchItems && parseInt(orderId, 10)) {
            setRefetch(true)
            setTimeout(() => setRefetch(false), 500)
        } else if (gEData.length && !refetchItems && !parseInt(orderId, 10)) {
            setGeData([])
            setRecordCount(0)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refetchItems])

    // useEffect(() => {
    //     // TODO: once API is integrated, remove this block completely
    //     /* eslint-disable */
    //     const updatedDummyData = locations?.map(loc => ({
    //         id: loc?.id,
    //         styleCode: loc?.styleCode,
    //         description: <TruncatedText text={loc?.description} />,
    //         ean: loc?.ean ?? '',
    //         qty: loc?.qty ?? '',
    //         brand: loc?.brand ?? '',
    //         colour: loc?.colour ?? '',
    //         size: loc?.size ?? '',
    //         mrp: loc?.mrp ? `₹ ${loc?.mrp}` : '-',
    //         productImg: (
    //             <Box
    //                 sx={{
    //                     display: 'flex',
    //                     padding: '2px',
    //                     justifyContent: 'center'
    //                 }}
    //             >
    //                 <CustomImage
    //                     src={loc?.productImg}
    //                     alt='product image'
    //                     styles={{
    //                         width: '3rem',
    //                         height: '3rem',
    //                         border: '1px solid',
    //                         borderRadius: '8px',
    //                         objectFit: 'cover'
    //                     }}
    //                 />
    //             </Box>
    //         )
    //     }))

    //     setGeData(updatedDummyData ?? [])
    // }, [])

    // column toggler
    // const handleCheckToggle = key => {
    //     setColumns([
    //         ...columns.map(item => {
    //             if (key === TOGGLE_ALL) return { ...item, visible: true }
    //             if (key === item.key) return { ...item, visible: !item.visible }
    //             return item
    //         })
    //     ])
    // }

    const handleBulkConfirm = () => {
        if (clearSelectionRef?.current) {
            clearSelectionRef.current()
        }
        setSelectedRow([])
        dispatch(
            openSnackbar({
                open: true,
                message: 'Removed successfully',
                variant: 'alert',
                alert: { color: 'info', icon: 'info' },
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            })
        )
        dispatch(closeModal())
    }

    useEffect(() => {
        if (!isOpen) {
            setActiveModal(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    useEffect(() => {
        if (activeModal === 'removeItem') {
            setTimeout(() => {
                removeItemIdRef.current?.focus()
            }, 100)
        }
    }, [activeModal, isModalOpen])

    return (
        <MainCard content={false}>
            <Box>
                {/* Add your dummy buttons here */}
                <Box
                    sx={{
                        display: 'flex',
                        gap: { xs: 0, sm: 2 },
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexDirection: { xs: 'column', sm: 'row' }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, paddingTop: { xs: 2, sm: 0 }, flex: 1 }}>
                        <Typography variant='h3'>All Items</Typography>
                    </Box>
                    <Stack
                        direction='row'
                        flexWrap='wrap'
                        alignItems='center'
                        paddingTop='4px'
                        paddingBottom='8px'
                        spacing={1}
                        sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap', flex: 1, justifyContent: 'flex-end' } }}
                    >
                        {isShowClearButton && (
                            <CustomButton
                                variant='text'
                                customStyles={{
                                    height: '2rem',
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
                        {selectedRow?.length > 0 && (
                            <CustomButton
                                variant='outlined'
                                startIcon={<DeleteAnimIcon fontSize='small' stroke='currentColor' />}
                                shouldAnimate
                                onClick={() => {
                                    setActiveModal('bulkRemove')
                                    dispatch(
                                        openModal({
                                            type: 'confirm_modal'
                                        })
                                    )
                                }}
                                customStyles={{
                                    color: 'error.main',
                                    height: '2rem'
                                }}
                            >
                                Remove
                            </CustomButton>
                        )}
                        {RenderToolBarElement && <RenderToolBarElement />}

                        {/* <CSVExport handleExcelClick={handleCurrentView} exportAllFunc={handleExportAll} /> */}
                        {/* render action column can be made dynamic based on user authorization  */}
                        {/* <ToggleColumns columns={columns} handler={handleCheckToggle} /> */}
                    </Stack>
                </Box>
                <DataTable
                    reqKey='packItemDataTableLKey'
                    data={gEData}
                    columns={columns}
                    addExcelQuery={excelHandler}
                    queryHandler={queryHandler}
                    totalRecords={recordCount}
                    setIsShowClearButton={setIsShowClearButton}
                    isLoading={packItemDataTableLKey}
                    clearAllFilters={clearAllFilters}
                    refetch={refetch}
                />
            </Box>
        </MainCard>
    )
}

B2BPackItemTable.propTypes = {
    RenderToolBarElement: PropTypes.node,
    refetchItems: PropTypes.bool,
    orderId: PropTypes.number
}

export default React.memo(B2BPackItemTable)
