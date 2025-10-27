/* eslint-disable react/prop-types */
/* eslint-disable no-nested-ternary */
import React, { useEffect, useState, useRef, useCallback, memo } from 'react'
import { IconButton, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Delete, FilterAltOff, QrCodeScanner, TextFields, Upload } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import ConfirmModal from '@core/components/modals/ConfirmModal'
import CustomModal from '@core/components/extended/CustomModal'
import ImportFileModal from '@core/components/modals/ImportFileModal'
import FormComponent from '@/core/components/forms/FormComponent'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import { CSVLink } from 'react-csv'

// ** import from redux
import { closeModal, openModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'
import {
    useCreatePutwallMutation,
    sortingDataTable,
    useRemovePutwallItemMutation,
    useGetGeneratePutwallTemplateMutation,
    useUploadPutwallTemplateMutation
} from '@/app/store/slices/api/sortingSlice'
import StatusBadge from '@/core/components/StatusBadge'
import DropdownMenu from '@/core/components/DropdownMenu'
import TitleModalWrapper from '@/core/components/TitleModalWrapper'
import MobileTableToolbar from '@/core/components/MobileTableToolbar'

import AmazonColorIcon from '@/assets/icons/channel/AmazonColorIcon'
import MyntraColorIcon from '@/assets/icons/channel/MyntraColorIcon'
import ShopifyColorIcon from '@/assets/icons/channel/ShopifyColorIcon'
import flipkartColorIcon from '@/assets/icons/channel/flipkartColorIcon.svg'
import { z } from 'zod'
import { isExcelQuery, TOGGLE_ALL } from '@/constants'
import { useFormik } from 'formik'

// ** import dummy data
import QrCodeModalWrapper from '@/core/components/modals/QrCodeModalWrapper'
import { DeleteAnimIcon } from '@/assets/icons/DeleteAnimIcon'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'
import { objectLength } from '@/utilities'
import { headers } from './helper'

// Memoize static content to prevent unnecessary re-renders
const getChannelIcon = {
    Amazon: <AmazonColorIcon />,
    Myntra: <MyntraColorIcon />,
    Shopify: <ShopifyColorIcon />,
    Flipkart: <img src={flipkartColorIcon} alt='Flipkart' style={{ height: 18, width: 18 }} />
}

// Memoize column options for the dropdown
const dropdownOptions = [
    { label: 'Form', action: 'form', icon: <TextFields /> },
    { label: 'Upload', action: 'upload', icon: <Upload /> }
]

// Memoize the ActionCell component to prevent re-renders
const ActionCell = memo(({ row, onDelete, onViewQrCode }) => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}
    >
        {row?.statusText !== 'Empty' ? (
            <Tooltip title='Non-deletable'>
                <IconButton aria-label='non-deletable' size='small' disabled>
                    <Delete
                        sx={{
                            fontSize: '1rem'
                        }}
                    />
                </IconButton>
            </Tooltip>
        ) : (
            <Tooltip title='Delete'>
                <IconButton
                    sx={{
                        '&:hover': {
                            scale: 1.1
                        },
                        color: 'error.main'
                    }}
                    size='small'
                    aria-label='edit row'
                    onClick={() => onDelete(row?.putwallId)}
                >
                    <Delete
                        sx={{
                            fontSize: '1rem'
                        }}
                    />
                </IconButton>
            </Tooltip>
        )}

        <Tooltip title='Print QR code'>
            <IconButton
                sx={{
                    color: 'info.main',

                    '&:hover': {
                        scale: 1.1
                    }
                }}
                size='small'
                aria-label='edit row'
                onClick={() => {
                    onViewQrCode(row?.putwallId)
                }}
            >
                <QrCodeScanner
                    sx={{
                        fill: '#1976d2', // Blue color
                        fontSize: '1rem'
                    }}
                />
            </IconButton>
        </Tooltip>
    </Box>
))

// Memoize the ChannelCell component
const ChannelCell = memo(({ channel }) => (
    <Box display='flex' alignItems='center' gap={1} justifyContent='center'>
        <>
            {getChannelIcon?.[channel]}
            <Typography
                variant='body2'
                fontWeight={500}
                sx={{
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}
            >
                {channel || '-'}
            </Typography>
        </>
    </Box>
))

// Create a memoized PutwallForm component
// eslint-disable-next-line no-unused-vars
const PutwallForm = memo(({ formik, fields, handleCustomChange, isModalOpen, createPutwallLKey }) => (
    <FormComponent
        fields={fields}
        formik={formik}
        handleCustomChange={handleCustomChange}
        customStyle={{
            backgroundColor: 'none'
        }}
        submitting={createPutwallLKey}
        submitButtonSx={{
            display: 'flex',
            justifyContent: 'flex-end'
        }}
        showSeparaterBorder
        submitButtonText='Generate'
        dividerSx={{
            margin: '10px 0px'
        }}
        gridStyles={{
            gap: 1.5
        }}
    />
))

function SortingTable() {
    const dispatch = useDispatch()
    const hasCreateAccess = useUiAccess('create')

    const csvLinkRef = useRef(null)
    const clearSelectionRef = useRef(null)
    const putwallIdRef = useRef(null)
    const formikRef = useRef(null)

    const modalType = useSelector(state => state.modal.type)
    const { createPutwallLKey, removePutwallItemLKey, sortingDataTableLKey } = useSelector(state => state.loading)

    const [columns, setColumns] = useState([...headers])
    const [excelHandler, setExcelHandler] = useState(false)

    const [gEData, setGeData] = useState([])

    // eslint-disable-next-line no-unused-vars
    const [csvHeaders, setCsvHeaders] = useState([])
    // eslint-disable-next-line no-unused-vars
    const [csvData, setCsvData] = useState([])
    // eslint-disable-next-line no-unused-vars
    const [recordCount, setRecordCount] = useState(0)
    const [activeModal, setActiveModal] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(null)

    const [selectedRow, setSelectedRow] = useState([])
    const [currentQuery, setCurrentQuery] = useState('?start=0&length=10')

    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const [putwallId, setPutwallId] = useState(null)
    const [createPutwall] = useCreatePutwallMutation()
    const [removePutwallItem] = useRemovePutwallItemMutation()
    const [getGeneratePutwallTemplate] = useGetGeneratePutwallTemplateMutation()
    const [uploadPutwallTemplate] = useUploadPutwallTemplateMutation()

    // Define fields outside of render to prevent unnecessary recreations
    const fields = React.useMemo(
        () => [
            {
                name: 'putwallId',
                label: 'Putwall ID*',
                type: 'text',
                placeholder: 'eg: PI509598587',
                required: true,
                CustomFormInput: true,
                grid: { xs: 12 },
                size: 'small',
                inputRef: putwallIdRef,
                autoComplete: 'off',
                customSx: { mb: '10px' }
            }
        ],
        []
    )

    const handleExportAllExcel = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const handleCurrentView = () => {
        if (!gEData.length) return

        const visibleHeaders = headers.filter(header => header.visible && header.label !== 'S. No.')

        const dynamicHeaders = visibleHeaders.map(header => ({
            label: header.label,
            key: header.key
        }))

        const exportData = gEData.map(item => {
            const row = {}

            visibleHeaders.forEach(header => {
                if (header.key === 'status') {
                    row[header.key] = item[header.key]?.props?.label || ''
                } else if (header.key === 'channel') {
                    row[header.key] = item[header.key]?.props?.channel || ''
                } else if (header.key === 'created_at') {
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

    const queryHandler = async queryString => {
        setCurrentQuery(queryString)
        const response = await dispatch(sortingDataTable.initiate(queryString, false))
        if (isExcelQuery(queryString)) return
        setGeData(
            response?.data.data.map(loc => ({
                id: loc?.id,
                putwallId: loc?.putwallId ?? '',
                status: (
                    <StatusBadge
                        type={
                            {
                                Complete: 'success',
                                'In Progress': 'info',
                                Empty: 'orange'
                            }[loc?.status]
                        }
                        label={loc?.status}
                        customSx={{
                            minWidth: '7rem'
                        }}
                    />
                ),
                order_no: loc?.order_no || '-',
                channel: <ChannelCell channel={loc?.channel} />,
                picked_quantity: loc?.picked_quantity || '-',
                sorted_quantity: loc?.sorted_quantity || '-',
                created_at: loc?.created_at || '-',
                created_by: loc?.created_by || '-',
                isDisabled: loc?.status !== 'Empty',
                statusText: loc?.status
            }))
        )
        setRecordCount(response?.data?.recordsTotal || 0)
    }

    const getTemplate = async () => getGeneratePutwallTemplate().unwrap()

    const handleFileUpload = async file => {
        let isError = false
        let message = ''
        try {
            const formData = new FormData()
            formData.append('excel', file)
            const response = await uploadPutwallTemplate(formData).unwrap()
            message = response.message
            if (response && objectLength(response) === 1) isError = true
            else if (objectLength(response) > 1) dispatch(closeModal())
            queryHandler(currentQuery)
        } catch (error) {
            isError = true
            message = error?.data?.message || error?.message || 'unable to upload file.'
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    // Focus the input when modal opens
    // eslint-disable-next-line consistent-return
    useEffect(() => {
        if (isModalOpen) {
            const timer = setTimeout(() => {
                if (putwallIdRef?.current) {
                    putwallIdRef?.current?.focus()
                }
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [isModalOpen])

    // Memoize modal opening handlers
    const handleBulkImport = useCallback(() => {
        setActiveModal('bulkImport')
        dispatch(
            openModal({
                content: (
                    <ImportFileModal
                        handleGetTemplate={getTemplate}
                        handleFileSubmission={handleFileUpload}
                        sampleFilePath='/csv/outbound/putwalls.csv'
                        fileType={{
                            'text/csv': ['.csv'],
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                        }}
                    />
                ),
                title: <Typography variant='h3'>Generate Putwalls</Typography>
            })
        )
    }, [dispatch])

    // Validation schema
    const validationSchema = z.object({
        putwallId: z
            .string()
            .trim()
            .min(1, 'Putwall ID is required')
            .max(20, { message: 'Putwall ID must be at most 20 characters' })
    })

    // Convert schema to validation function
    const validate = useCallback(values => {
        const result = validationSchema.safeParse(values)
        let errors = {}

        if (!result.success) {
            errors = result.error.issues.reduce((acc, issue) => {
                acc[issue.path[0]] = issue.message
                return acc
            }, {})
        }
        return errors
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Initialize formik with memoized handlers
    const formik = useFormik({
        initialValues: {
            putwallId: ''
        },
        validate,
        onSubmit: useCallback(
            async (values, { resetForm }) => {
                try {
                    const response = await createPutwall({
                        code: values.putwallId
                    }).unwrap()
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: response?.message || 'Successfully added',
                            variant: 'alert',
                            alert: { color: 'success' },
                            anchorOrigin: { vertical: 'top', horizontal: 'center' }
                        })
                    )
                    queryHandler(currentQuery)
                    setIsModalOpen(false)
                    setActiveModal(null)
                    resetForm()
                } catch (error) {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: error?.data?.data?.message || error?.message || 'Something went wrong.',
                            variant: 'alert',
                            alert: { color: 'error' },
                            anchorOrigin: { vertical: 'top', horizontal: 'center' }
                        })
                    )
                }
            },
            [dispatch]
        ),
        validateOnBlur: false,
        validateOnChange: true
    })

    // Memoize change handler
    const handleCustomChange = useCallback(e => {
        formik.handleChange(e)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Memoize option click handler
    const handleOptionClick = useCallback(
        action => {
            if (action === 'form') {
                setActiveModal('addPutwall')
                setIsModalOpen(true)
            } else {
                handleBulkImport()
            }
        },
        [handleBulkImport]
    )

    // Memoize toggle handler
    const handleCheckToggle = useCallback(key => {
        setColumns(prevColumns =>
            prevColumns.map(item => {
                if (key === TOGGLE_ALL) return { ...item, visible: true }
                if (key === item.key) return { ...item, visible: !item.visible }
                return item
            })
        )
    }, [])

    // Memoize clear filter handler
    const handleClearFilters = useCallback(() => {
        setClearAllFilters(prev => !prev)
    }, [])

    const renderAction = useCallback(
        row => (
            <ActionCell
                row={row}
                onDelete={id => {
                    setPutwallId(id)
                    setActiveModal('singleDelete')
                    dispatch(
                        openModal({
                            type: 'confirm_modal'
                        })
                    )
                }}
                onViewQrCode={id => {
                    setPutwallId(id)
                    setActiveModal('showQrCode')
                    setIsModalOpen(true)
                }}
            />
        ),
        [dispatch, setPutwallId, setActiveModal, setIsModalOpen]
    )

    const handleBulkConfirm = async () => {
        try {
            const idString = selectedRow.map(String).join(',')
            const data = await removePutwallItem({ id: idString }).unwrap()

            if (clearSelectionRef?.current) {
                clearSelectionRef.current()
            }
            setSelectedRow([])
            queryHandler(currentQuery)
            dispatch(
                openSnackbar({
                    open: true,
                    message: data.message || 'Putwall deleted successfully',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            dispatch(closeModal())
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || 'Delete failed',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    const handleSingleDeleteConfirm = async () => {
        try {
            const row = gEData.find(item => item.putwallId === putwallId)
            const data = await removePutwallItem({ id: row.id }).unwrap()

            await queryHandler(currentQuery)

            dispatch(
                openSnackbar({
                    open: true,
                    message: data.message || 'Putwall deleted successfully',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            dispatch(closeModal())
            setActiveModal(null)
            setPutwallId(null)
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || 'Failed to delete putwall',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    // Store formik instance in ref for access in handleCloseModal
    useEffect(() => {
        formikRef.current = formik
    }, [formik])

    // use keyboard shortcut
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) {
            setActiveModal('addPutwall')
            setIsModalOpen(true)
        }
    })

    const menuOptions = [
        {
            label: 'Delete',
            icon: (
                <Delete
                    fontSize='small'
                    sx={{
                        color: 'error.main'
                    }}
                />
            ),
            onClick: row => {
                setPutwallId(row?.putwallId)
                setActiveModal('singleDelete')
                dispatch(
                    openModal({
                        type: 'confirm_modal'
                    })
                )
            },
            condition: row => !['Complete', 'In Progress'].includes(row?.statusText)
        },
        {
            label: 'Print QR Code',
            icon: <QrCodeScanner fontSize='small' sx={{ fill: '#1976d2' }} />,
            onClick: row => {
                setPutwallId(row?.putwallId)
                setActiveModal('showQrCode')
                setIsModalOpen(true)
            }
        }
    ]

    return (
        <ContextMenuProvider>
            <MainCard content={false}>
                <Box sx={{ paddingY: 2, paddingX: { xs: 1.5, sm: 1 }, paddingTop: '2px' }}>
                    <Box
                        sx={{
                            display: { xs: 'none', md: 'flex' },
                            gap: { xs: 0, sm: 2 },
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexDirection: { xs: 'column', sm: 'row' }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, paddingTop: { xs: 2, sm: 0 } }}>
                            <Typography variant='h3'>All Putwalls</Typography>
                        </Box>
                        <Stack direction='row' spacing={2} flexWrap='wrap' alignItems='center' paddingY='12px'>
                            {selectedRow?.length > 0 && (
                                <CustomButton
                                    variant='outlined'
                                    startIcon={<DeleteAnimIcon fontSize='small' stroke='currentColor' />}
                                    shouldAnimate
                                    onClick={() => {
                                        setActiveModal('bulkDelete')
                                        dispatch(
                                            openModal({
                                                type: 'confirm_modal'
                                            })
                                        )
                                    }}
                                    customStyles={{
                                        color: 'error.main'
                                    }}
                                >
                                    Delete
                                </CustomButton>
                            )}
                            {isShowClearButton && (
                                <CustomButton
                                    variant='text'
                                    customStyles={{
                                        color: 'error.main',
                                        '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
                                    }}
                                    startIcon={<FilterAltOff />}
                                    onClick={handleClearFilters}
                                >
                                    Clear All Filters
                                </CustomButton>
                            )}
                            <DropdownMenu
                                buttonText='Add New'
                                options={dropdownOptions}
                                onOptionClick={handleOptionClick}
                            />

                            <CSVExport handleExcelClick={handleCurrentView} exportAllFunc={handleExportAllExcel} />
                            <ToggleColumns columns={columns} handler={handleCheckToggle} />
                        </Stack>
                    </Box>

                    <MobileTableToolbar
                        title='All Putwalls'
                        isShowClearButton={isShowClearButton}
                        handleCurrentView={handleCurrentView}
                        handleExportAllExcel={handleExportAllExcel}
                        setClearAllFilters={setClearAllFilters}
                        handleAdd={() => {
                            if (hasCreateAccess) {
                                setActiveModal('addPutwall')
                                setIsModalOpen(true)
                            }
                        }}
                        rightColumnElement={
                            selectedRow?.length > 0 && (
                                <CustomButton
                                    variant='outlined'
                                    shouldAnimate
                                    onClick={() => {
                                        setActiveModal('bulkDelete')
                                        dispatch(
                                            openModal({
                                                type: 'confirm_modal'
                                            })
                                        )
                                    }}
                                    customStyles={{
                                        color: 'error.main',
                                        border: '1px solid',
                                        borderColor: 'primary.main',
                                        minWidth: '2rem',
                                        padding: '9px',
                                        borderRadius: '10px'
                                    }}
                                >
                                    <DeleteAnimIcon fontSize='small' stroke='currentColor' />
                                </CustomButton>
                            )
                        }
                    />

                    {/* Wrap DataTable in React.memo or use React.useMemo if DataTable isn't already memoized */}
                    <DataTable
                        data={gEData}
                        columns={columns}
                        reqKey='sortingDataTableLKey'
                        addExcelQuery={excelHandler}
                        queryHandler={queryHandler}
                        totalRecords={recordCount}
                        renderAction={renderAction}
                        isCheckbox
                        setSelectedRow={setSelectedRow}
                        clearSelectionRef={clearSelectionRef}
                        setIsShowClearButton={setIsShowClearButton}
                        isLoading={sortingDataTableLKey}
                        clearAllFilters={clearAllFilters}
                        enableContextMenu
                        showStripes={false}
                    />
                    <PopperContextMenu options={menuOptions} />
                </Box>

                {modalType === 'global_modal' && <CustomModal />}

                {activeModal === 'bulkDelete' && modalType === 'confirm_modal' ? (
                    <ConfirmModal
                        title={`Delete ${selectedRow?.length > 1 ? 'Putwalls' : 'Putwall'}`}
                        message={`Are you sure you want to delete ${selectedRow?.length} ${selectedRow?.length > 1 ? 'products' : 'product'} from the list?`}
                        icon='warning'
                        confirmText='Yes, Delete'
                        customStyle={{ width: { xs: '320px', sm: '480px' } }}
                        onConfirm={handleBulkConfirm}
                        isLoading={removePutwallItemLKey}
                        btnContainerSx={{
                            flexDirection: 'row-reverse',
                            gap: 1,
                            justifyContent: 'end'
                        }}
                        onCancel={() => {
                            setActiveModal(null)
                        }}
                    />
                ) : activeModal === 'singleDelete' ? (
                    <ConfirmModal
                        title='Delete Putwall'
                        message={`Are you sure you want to delete putwall # ${putwallId} from the list?`}
                        icon='warning'
                        confirmText='Yes, Delete'
                        customStyle={{ width: { xs: '320px', sm: '480px' } }}
                        onConfirm={handleSingleDeleteConfirm}
                        isLoading={removePutwallItemLKey}
                        btnContainerSx={{
                            flexDirection: 'row-reverse',
                            gap: 1,
                            justifyContent: 'end'
                        }}
                        onCancel={() => {
                            setActiveModal(null)
                        }}
                    />
                ) : activeModal === 'addPutwall' ? (
                    <TitleModalWrapper
                        title='Add Putwall'
                        isOpen={isModalOpen}
                        setIsOpen={setIsModalOpen}
                        boxContainerSx={{
                            width: { xs: '340px', sm: '400px' }
                        }}
                        onClose={() => {
                            if (formikRef.current) {
                                formikRef.current.resetForm()
                            }
                            setActiveModal(null)
                            setIsModalOpen(false)
                            setPutwallId(null)
                        }}
                    >
                        <PutwallForm
                            formik={formik}
                            fields={fields}
                            handleCustomChange={handleCustomChange}
                            isModalOpen={isModalOpen}
                            createPutwallLKey={createPutwallLKey}
                        />
                    </TitleModalWrapper>
                ) : activeModal === 'showQrCode' ? (
                    <QrCodeModalWrapper
                        onClose={() => {
                            setActiveModal(null)
                            setIsModalOpen(false)
                        }}
                        isOpen={isModalOpen}
                        setIsOpen={setIsModalOpen}
                        title='Print QR Code'
                        id={putwallId}
                    />
                ) : null}

                <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename={`Putwall${new Date()}.csv`}
                    ref={csvLinkRef}
                    style={{ display: 'none' }}
                />
            </MainCard>
        </ContextMenuProvider>
    )
}

export default memo(SortingTable)
