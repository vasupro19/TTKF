// modalSlice.js
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    open: false,
    title: '',
    content: null,
    footer: null,
    closeOnBackdropClick: true,
    type: 'global_modal', // global_modal || confirm_modal
    customStyles: {},
    isBackButton: false,
    backButtonTxt: '',
    backButtonFunc: null,
    disableEscapeKeyDown: false
}

const modalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        openModal: (state, action) => {
            state.open = true
            state.title = action.payload.title || ''
            state.content = action.payload.content || null
            state.footer = action.payload.footer || null
            state.closeOnBackdropClick = action.payload.closeOnBackdropClick
            state.type = action.payload.type || 'global_modal'
            state.customStyles = action.payload.customStyles || {}
            state.isBackButton = action.payload.isBackButton || false
            state.backButtonTxt = action.payload.backButtonTxt || ''
            state.backButtonFunc = action.payload.backButtonFunc || null
            state.disableEscapeKeyDown = action.payload.disableEscapeKeyDown || false
        },
        closeModal: state => {
            state.open = false
            state.title = ''
            state.content = null
            state.footer = null
            state.closeOnBackdropClick = true
            state.type = 'global_modal'
            state.customStyles = {}
            state.isBackButton = false
            state.backButtonTxt = ''
            state.backButtonFunc = null
            state.disableEscapeKeyDown = false
        }
    }
})

export const { openModal, closeModal } = modalSlice.actions
export default modalSlice.reducer
