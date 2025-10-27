/* eslint-disable no-nested-ternary */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState, useRef, memo } from 'react'

import { IconButton, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Delete, FilterAltOff } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import TruncatedText from '@/core/components/TruncatedText'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import CustomImage from '@/core/components/CustomImage'

import { isExcelQuery } from '@/constants'

import { DeleteAnimIcon } from '@/assets/icons/DeleteAnimIcon'
import { closeModal, openModal } from '@/app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'
import TitleModalWrapper from '@/core/components/TitleModalWrapper'
import ScannableInputForm from '@/core/components/ScannableInputForm'
import { z } from 'zod'
import PropTypes from 'prop-types'
import { packItemDataTable } from '@/app/store/slices/api/packSlice'

// ** import dummy data
import { headers } from './helper'

// Memoize the ActionCell component to prevent re-renders
const ActionCell = memo(({ row, onRemove }) => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}
    >
        <Tooltip title='Remove'>
            <IconButton
                sx={{
                    '&:hover': {
                        scale: 1.1
                    },
                    color: 'error.main'
                }}
                size='small'
                aria-label='edit row'
                onClick={() => {
                    onRemove(row)
                }}
            >
                <Delete
                    sx={{
                        fontSize: '1rem'
                    }}
                />
            </IconButton>
        </Tooltip>
    </Box>
))

ActionCell.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    row: PropTypes.object,
    onRemove: PropTypes.func
}

// eslint-disable-next-line react/prop-types
function B2CPackItemTable({ packId, refetchItems }) {
    const removeItemIdRef = useRef(null)
    const dispatch = useDispatch()
    const modalType = useSelector(state => state.modal.type)
    const isOpen = useSelector(state => state.modal.open)
    const { packItemDataTableLKey } = useSelector(state => state.loading)

    // eslint-disable-next-line no-unused-vars
    const [config, setConfig] = useState({
        markClose: 0,
        markRelease: 0,
        vehicleReleaseDate: '',
        geCreatedAt: ''
    })
    // eslint-disable-next-line no-unused-vars
    const [columns, setColumns] = useState([...headers])
    // eslint-disable-next-line no-unused-vars
    const [excelHandler, setExcelHandler] = useState(false)

    const [gEData, setGeData] = useState([])
    // eslint-disable-next-line no-unused-vars
    const [recordCount, setRecordCount] = useState(0)
    const clearSelectionRef = useRef(null)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [activeModal, setActiveModal] = useState(null)
    const [selectedRow, setSelectedRow] = useState([]) // selected checkbox
    // eslint-disable-next-line no-unused-vars
    const [itemId, setItemId] = useState(null)
    const [recordsCount, setRecordsCount] = useState(0)
    const [refetch, setRefetch] = useState(false)

    // query handler
    // eslint-disable-next-line no-unused-vars
    const queryHandler = async queryString => {
        if (!queryString || !packId) return
        const query = queryString.replace('?', `?id=${packId}&`)
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
                            src={item?.image}
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
        setRecordsCount(data?.recordsTotal || 0)
    }

    // eslint-disable-next-line no-unused-vars
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

    useEffect(() => {
        if (refetchItems && parseInt(packId, 10)) {
            setRefetch(true)
            setTimeout(() => setRefetch(false), 500)
        } else if (gEData.length && !refetchItems && !parseInt(packId, 10)) {
            setGeData([])
            setRecordCount(0)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [packId, refetchItems])

    return (
        <MainCard content={false}>
            <Box>
                <Box
                    sx={{
                        display: 'flex',
                        gap: { xs: 0, sm: 2 },
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexDirection: { xs: 'column', sm: 'row' }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, paddingY: 1, flex: 1 }}>
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
                    </Stack>
                </Box>
                <DataTable
                    reqKey='packItemDataTableLKey'
                    data={gEData}
                    columns={columns}
                    addExcelQuery={excelHandler}
                    queryHandler={queryHandler}
                    totalRecords={recordsCount}
                    setIsShowClearButton={setIsShowClearButton}
                    clearAllFilters={clearAllFilters}
                    refetch={refetch}
                    isLoading={packItemDataTableLKey}
                    // renderAction={renderAction}
                />
            </Box>
            {modalType === 'confirm_modal' && activeModal === 'singleRemove' ? (
                <ConfirmModal
                    title='Remove Item'
                    message={`Are you sure you want to remove item # ${itemId} from the list?`}
                    icon='warning'
                    confirmText='Yes, Remove'
                    customStyle={{ width: { xs: '320px', sm: '480px' } }}
                    onConfirm={() => {
                        setActiveModal(null)
                        dispatch(
                            openSnackbar({
                                open: true,
                                message: 'Removed successfully',
                                variant: 'alert',
                                alert: { color: 'info', icon: 'info' },
                                anchorOrigin: { vertical: 'top', horizontal: 'center' }
                            })
                        )
                    }}
                    btnContainerSx={{
                        flexDirection: 'row-reverse',
                        gap: 1,
                        justifyContent: 'end'
                    }}
                    onCancel={() => {
                        setActiveModal(null)
                    }}
                />
            ) : activeModal === 'removeItem' ? (
                <TitleModalWrapper
                    title='Scan Item ID To Remove From the Pack'
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    boxContainerSx={{
                        width: { xs: '340px', sm: '400px' }
                    }}
                    onClose={() => {
                        setActiveModal(null)
                        setIsModalOpen(false)
                    }}
                >
                    <ScannableInputForm
                        initialValues={{ itemId: '' }}
                        validationSchema={z.object({
                            itemId: z.string().optional()
                        })}
                        handleSubmit={(values, { resetForm }) => {
                            console.log('Form submitted:', values)
                            setActiveModal(null)
                            setIsModalOpen(false)
                            // Perform any additional actions with the scanned UID here
                            resetForm()
                            dispatch(
                                openSnackbar({
                                    open: true,
                                    message: 'Item removed successfully',
                                    variant: 'alert',
                                    alert: { color: 'info', icon: 'info' },
                                    anchorOrigin: { vertical: 'top', horizontal: 'center' },
                                    autoHideDuration: 1000
                                })
                            )
                        }}
                        fields={[
                            {
                                name: 'itemId',
                                label: 'Item ID*',
                                placeholder: 'scan or enter',
                                ref: removeItemIdRef
                            }
                        ]}
                        scannerEnabled={false}
                        submitButtonText='Confirm'
                        gridProps={{ container: true }}
                    />
                </TitleModalWrapper>
            ) : null}
        </MainCard>
    )
}

export default React.memo(B2CPackItemTable)
