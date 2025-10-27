import { createSlice } from '@reduxjs/toolkit'

const AuthSlice = createSlice({
    name: 'AppState',
    initialState: {
        locale: 'fr'
    },
    reducers: {
        changeLocale: (state, action) => {
            state.locale = action.payload
        }
    }
})

export const { changeLocale } = AuthSlice.actions
export default AuthSlice.reducer
