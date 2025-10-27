import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    userId: null,
    credentials: null,
    userData: {
        username: null,
        sessionId: null,
        sessions: null
    }
}

const sessionSlice = createSlice({
    name: 'session',
    initialState,
    reducers: {
        setSessionData: (state, action) => {
            state.userId = action.payload.userId
            state.credentials = action.payload.credentials
            state.userData = action.payload.userData
            state.sessions = action.payload.sessions
        },
        clearSessionData: state => {
            state.userId = null
            state.credentials = null
            state.userData = null
            state.sessions = null
        }
    }
})

export const { setSessionData, clearSessionData } = sessionSlice.actions
export default sessionSlice.reducer
