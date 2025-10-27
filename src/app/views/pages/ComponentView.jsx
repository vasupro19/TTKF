// ComponentView.js
import React from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import SendIcon from '@mui/icons-material/Send'
import AddIcon from '@mui/icons-material/Add'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useDispatch, useSelector } from 'react-redux'

import CustomModal from '@core/components/extended/CustomModal'
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import CustomButton from '../../../core/components/extended/CustomButton'

export default function ComponentView() {
    const dispatch = useDispatch()
    const isOpen = useSelector(state => state.modal.open)

    const handleDelete = () => true

    const handleSend = () => true

    const handleAdd = () => {
        dispatch(
            openModal({
                title: 'Custom Modal Title',
                content: (
                    <Typography>
                        This is custom content inside the modal. You can put any text, form elements, or even components
                        here.
                    </Typography>
                ),
                footer: (
                    <CustomButton variant='outlined' onClick={() => dispatch(closeModal())}>
                        Close Modal
                    </CustomButton>
                )
            })
        )
    }

    return (
        <div>
            <Stack direction='row' spacing={2}>
                {/* Delete button example */}
                <CustomButton
                    text='Delete'
                    variant='outlined'
                    color='secondary'
                    startIcon={<DeleteIcon />}
                    onClick={handleDelete}
                    customStyles={{
                        borderColor: 'red',
                        color: 'red',
                        '&:hover': {
                            backgroundColor: '#ffe6e6'
                        }
                    }}
                />

                {/* Send button example */}
                <CustomButton
                    text='Send'
                    variant='contained'
                    color='primary'
                    endIcon={<SendIcon />}
                    onClick={handleSend}
                    customStyles={{
                        backgroundColor: '#39B54A',
                        '&:hover': {
                            backgroundColor: '#33a44a'
                        }
                    }}
                />

                {/* Add button example */}
                <CustomButton
                    text='Add Item'
                    variant='text'
                    color='success'
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                    customStyles={{
                        fontWeight: 'bold',
                        '&:hover': {
                            color: '#2c2c2c'
                        }
                    }}
                />
            </Stack>

            {/* Modal */}
            <CustomModal
                open={isOpen}
                handleClose={() => dispatch(closeModal())}
                title='Custom Modal Title'
                content={
                    <Typography>
                        This is custom content inside the modal. You can put any text, form elements, or even components
                        here.
                    </Typography>
                }
                footer={
                    <CustomButton variant='outlined' onClick={() => dispatch(closeModal())}>
                        Close Modal
                    </CustomButton>
                }
                customStyles={{
                    width: 500,
                    bgcolor: '#f0f0f0',
                    padding: '20px'
                }}
            />
        </div>
    )
}
