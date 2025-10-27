import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    drawerOpen: false,
    navBackDropOpen: false,
    selectedMenu: [],
    activeMenu: ''
}

const navBar = createSlice({
    name: 'navbar',
    initialState,
    reducers: {
        toggleNavBar(state) {
            state.drawerOpen = !state.drawerOpen
            state.navBackDropOpen = !state.navBackDropOpen
        },
        storeSelectedMenu(state, action) {
            state.selectedMenu = [...action.payload]
        }
    }
})

export default navBar.reducer

export const { toggleNavBar, storeSelectedMenu } = navBar.actions
