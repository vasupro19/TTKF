import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    action: false,
    open: false,
    message: 'Note archived',
    anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'right'
    },
    variant: 'default',
    alert: {
        color: 'primary',
        variant: 'filled',
        icon: null
    },
    transition: 'Fade',
    close: true,
    actionButton: false,
    autoHideDuration: 3000 // Default duration
}

// ==============================|| SLICE - SNACKBAR ||============================== //

const snackbar = createSlice({
    name: 'snackbar',
    initialState,
    reducers: {
        openSnackbar(state, action) {
            // Close existing snackbar by changing the key
            state.key = Date.now()
            state.open = false
            const { open, message, anchorOrigin, variant, alert, transition, close, actionButton, autoHideDuration } =
                action.payload

            state.action = !state.action
            state.open = open || initialState.open
            state.message = message || initialState.message
            state.anchorOrigin = anchorOrigin || initialState.anchorOrigin
            state.variant = variant || initialState.variant
            state.alert = {
                color: alert?.color || initialState.alert.color,
                variant: alert?.variant || initialState.alert.variant,
                icon: alert?.icon || initialState.alert.icon
            }
            state.transition = transition || initialState.transition
            state.close = close === false ? close : initialState.close
            state.actionButton = actionButton || initialState.actionButton
            state.autoHideDuration = autoHideDuration || initialState.autoHideDuration
        },

        closeSnackbar(state) {
            state.open = false
        }
    }
})

export default snackbar.reducer

export const { closeSnackbar, openSnackbar } = snackbar.actions
