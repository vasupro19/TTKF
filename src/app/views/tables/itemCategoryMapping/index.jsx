import { useEffect, useMemo, useState } from 'react'

import { FormControlLabel, IconButton, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Add, Delete, Edit, FilterAltOff } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import { CSVExport } from '@core/components/extended/CreateCSV'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import CustomModal from '@core/components/extended/CustomModal'
import ToggleColumns from '@core/components/ToggleColumns'
import CustomSwitch from '@core/components/extended/CustomSwitch'
import ConfirmModal from '@core/components/modals/ConfirmModal'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'

// ** import utils
import { getObjectKeys, toCapitalizedWords } from '@/utilities'

// ** import from redux
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'

import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'

// ** import sub-components
import CreateItemCategoryMappingModal from './CreateItemCategoryMappingModal'

// ** import dummy data
import { locations } from './locations'

function MasterItemCategoryMappingTable() {
    const hasCreateAccess = useUiAccess('create')
    const [columns, setColumns] = useState([])
    const [excelHandler, setExcelHandler] = useState(false)
    const dispatch = useDispatch()
    const modalType = useSelector(state => state.modal.type)
    const isOpen = useSelector(state => state.modal.open)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const [removeID, setRemoveID] = useState(null)

    const queryHandler = (key, value) => {
        // eslint-disable-next-line no-console
        console.log('key ', key, 'value ', value)
    }

    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    // this can be done by making headers and columns array
    useEffect(() => {
        let ObjectKeys = []

        // TODO: once api integrated remove this block completely

        // eslint-disable-next-line no-unused-vars
        const data = locations.map((user, index) => {
            if (index === 0) {
                ObjectKeys = getObjectKeys(user)
                setColumns(
                    ObjectKeys.map((key, keyIndex) => ({
                        id: keyIndex,
                        label: key === 'id' ? 'Sr.No.' : toCapitalizedWords(key),
                        align: key === 'id' || key === 'zone' ? 'center' : undefined, // align items can be used specifically for a column too
                        search: true,
                        // eslint-disable-next-line no-nested-ternary
                        sort: key === 'createdBy' ? false : key === 'id' ? false : Math.ceil(Math.random() * 10) >= 5,
                        // eslint-enable-next-line no-nested-ternary
                        // colFilter: key === 'createdBy' ? <DropdownWithSearch /> : null, // show individual filter
                        key,
                        accessKey: key,
                        stick: [0, 1].includes(keyIndex), // pass the no. of column need to stick when user try to scroll horizontally
                        visible: true, // hide id column
                        minWidth: key === 'id' ? 3.1 : 8, // unit = rem (required)
                        maxWidth: key === 'id' ? 3.1 : 8 // unit = rem (required)
                    }))
                )
            }

            return ObjectKeys.map(key => user[key])
        })
    }, [])

    // open add new pincode modal
    const handleAdd = () => {
        dispatch(
            openModal({
                content: <CreateItemCategoryMappingModal />,
                closeOnBackdropClick: false,
                title: <Typography variant='h3'>Item-Category Mapping</Typography>
            })
        )
    }

    const editHandler = (id, row) => {
        // eslint-disable-next-line no-console
        console.log('edit id ', id, row)
        // TODO:: later open modal with fetched values
        handleAdd()
    }

    const handleUpdateStatus = id => {
        // eslint-disable-next-line no-console
        console.log('id updated ', id)
    }

    const deleteHandler = (id, row) => {
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
        // eslint-disable-next-line no-console
        console.log('delete id ', id, row)
        setRemoveID(id)
    }

    const menuOptions = useMemo(
        () => [
            {
                label: 'Edit',
                icon: <Edit fontSize='small' sx={{ fill: '#60498a' }} />,
                onClick: row => editHandler(row.id, row)
            },
            {
                label: 'Delete',
                icon: <Delete fontSize='small' sx={{ color: 'error.main' }} />,
                onClick: row => deleteHandler(row.id, row)
            }
        ],
        [editHandler, handleUpdateStatus, deleteHandler]
    )

    // use keyboard shortcut
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) {
            handleAdd()
        }
    })

    return (
        <ContextMenuProvider>
            <MainCard content={false}>
                <Box sx={{ paddingY: 2, paddingX: 2, paddingTop: '2px' }}>
                    {/* Add your dummy buttons here */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant='h3'>Item-Category Mapping</Typography>
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
                            <CSVExport handleExcelClick={handleExcelClick} />
                            {/* add your custom filters here */}
                            <CustomButton variant='clickable' color='primary' onClick={handleAdd}>
                                Add New
                                <Add sx={{ marginLeft: '0.2rem', fontSize: '18px' }} />
                            </CustomButton>
                            {/* render action column can be made dynamic based on user authorization  */}
                            <ToggleColumns columns={[...columns.map(c => c.label)]} />
                        </Stack>
                    </Box>
                    <DataTable
                        data={locations} // TODO: remove dummy data once api integrated
                        columns={columns}
                        queryHandler={queryHandler}
                        isCheckbox={false}
                        addExcelQuery={excelHandler}
                        renderAction={row => (
                            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
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
                                <Tooltip title='Update Status'>
                                    <FormControlLabel
                                        sx={{ margin: '0px' }}
                                        control={
                                            <CustomSwitch
                                                // isChecked={row?.status === 'Active'}
                                                isChecked={Math.ceil(Math.random() * 10) >= 5}
                                                handleChange={() => {
                                                    handleUpdateStatus(row.id)
                                                }}
                                            />
                                        }
                                    />
                                </Tooltip>
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
                            </Box>
                        )}
                        setIsShowClearButton={setIsShowClearButton}
                        clearAllFilters={clearAllFilters}
                        enableContextMenu
                    />
                    <PopperContextMenu options={menuOptions} />
                </Box>
                {/* confirm before delete */}
                <ConfirmModal
                    title='Delete Mapping'
                    message={
                        <>
                            Are you sure you want to delete this mapping:{' '}
                            <strong>
                                {locations?.find(mapping => mapping?.id === removeID)?.locationCode || 'Unknown'}
                            </strong>
                            ?
                        </>
                    }
                    icon='warning'
                    confirmText='Yes, Delete'
                    customStyle={{ width: { xs: '300px', sm: '456px' } }}
                />
                {modalType === 'global_modal' && (
                    <CustomModal open={isOpen} handleClose={() => dispatch(closeModal())} />
                )}
            </MainCard>
        </ContextMenuProvider>
    )
}

export default MasterItemCategoryMappingTable
