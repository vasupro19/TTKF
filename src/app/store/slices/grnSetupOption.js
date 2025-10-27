import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    currentOptions: {
        baseDoc: 'boxId',
        processConfig: 'normalConfig',
        additionalConfig: []
    },
    savedOptions: {
        baseDoc: 'boxId',
        processConfig: 'normalConfig',
        additionalConfig: []
    }
}

const grnSetupOptionSlice = createSlice({
    name: 'grnSetupOption',
    initialState,
    reducers: {
        setCurrentBaseDoc: (state, action) => {
            state.currentOptions.baseDoc = action.payload
        },
        setCurrentProcessConfig: (state, action) => {
            state.currentOptions.processConfig = action.payload
        },
        toggleCurrentAdditionalConfig: (state, action) => {
            const value = action.payload
            const config = state.currentOptions.additionalConfig
            if (config.includes(value)) {
                state.currentOptions.additionalConfig = config.filter(item => item !== value)
            } else {
                state.currentOptions.additionalConfig.push(value)
            }
        },
        setCurrentOptions: (state, action) => {
            state.currentOptions = action.payload
        },
        saveOptions: state => {
            state.savedOptions = { ...state.currentOptions }
        },
        revertChanges: state => {
            state.currentOptions = { ...state.savedOptions }
        }
    }
})

export const {
    setCurrentBaseDoc,
    setCurrentProcessConfig,
    toggleCurrentAdditionalConfig,
    saveOptions,
    setCurrentOptions,
    revertChanges
} = grnSetupOptionSlice.actions

export const currentOptions = state => state.grnSetupOption.currentOptions
export const savedOptions = state => state.grnSetupOption.savedOptions
export default grnSetupOptionSlice.reducer
