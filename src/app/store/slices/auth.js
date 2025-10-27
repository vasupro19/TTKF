import { createSlice } from '@reduxjs/toolkit'
import { menuItems } from '@/app/layouts/header/menuItems'

const AuthSlice = createSlice({
    name: 'Auth',
    initialState: {
        isLoggedIn: false,
        user: null,
        loading: false,
        error: null,
        selectedLocation: null,
        menuAccess: new Set([]),
        moduleAccess: new Set([]),
        pathAccess: new Map(),
        permissionExpired: false,
        masterAdminAllowedRoutes: new Set([
            'setup',
            'warehouse_location',
            'client',
            'company',
            'location_account',
            'location_account_create',
            'location_account_view',
            'location_account_configure',
            'masters',
            'warehouse',
            'storage_location',
            'zone',
            'item_category_mapping',
            'bucket_config',
            'location_codes',
            'bin',
            'pallet',
            'vendor_directory',
            'customer_directory',
            'sku_master',
            'item',
            'property_mapping',
            'item_property',
            'serial_master',
            'generate_serials',
            'import_mapping',
            'other_master',
            'pincode_master',
            'city_master',
            'state_master',
            'country',
            'user_management',
            'user',
            'role',
            'user_log'
        ])
    },
    reducers: {
        logout: state => {
            state.user = null
            state.isLoggedIn = false
        },
        testLogin: state => {
            state.isLoggedIn = true
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        },
        setUser: (state, action) => {
            state.user = action.payload
            state.isLoggedIn = true
            state.error = null
        },
        setLocation: (state, action) => {
            state.selectedLocation = action.payload
        },
        setUserDetails: (state, action) => {
            state.user = { ...action.payload.user }
            state.isLoggedIn = true
            state.error = null
            state.permissionExpired = false
            const staticMenu = {
                '/select-client-location': {
                    path: '/select-client-location',
                    key: 'select_client_location',
                    label: 'Select Client Location'
                },
                '/': {
                    path: '/',
                    key: 'dashboard',
                    label: 'Dashboard'
                },
                '/components-view': {
                    path: '/components-view',
                    key: 'component_view',
                    label: 'Component View'
                },
                '/manageUploadsDownloads': {
                    path: '/manageUploadsDownloads',
                    key: 'manage_upload_downloads',
                    label: 'Manage Upload Downloads'
                },
                '/account': {
                    path: '/account',
                    key: 'account',
                    label: 'Account'
                }
            }

            // if (action.payload.permission.access) {
            //     const tempMenus = new Set()
            //     const tempModules = new Set()
            //     const pathAccess = new Map()

            //     // for static menus
            //     Object.keys(staticMenu).map(key => {
            //         pathAccess.set(key, staticMenu[key]) // static access data for client selection screen
            //         tempMenus.add(staticMenu[key].key) // static menu code for client selection screen
            //         return key
            //     })

            //     let currentParentLabel
            //     const makePathAccess = item => {
            //         if (item.type === 'collapse' && item.children) {
            //             currentParentLabel = item.label
            //             item.children.forEach(makePathAccess)
            //         } else if (item?.path) {
            //             pathAccess.set(item.path, {
            //                 path: item.path,
            //                 key: item.id,
            //                 label: item.label,
            //                 parentLabel: currentParentLabel
            //             })
            //         }
            //     }
            //     menuItems.forEach(makePathAccess)

            //     Object.keys(action.payload.permission).forEach(key => {
            //         if (
            //             ['view', 'create', 'edit', 'delete', 'export'].includes(key) &&
            //             action.payload.permission[key]
            //         ) {
            //             tempModules.add(key)
            //         } else if (action.payload.permission[key]) {
            //             tempMenus.add(key)
            //         }
            //     })
            //     if (state.menuAccess.size !== tempMenus.size) state.menuAccess = tempMenus
            //     if (state.moduleAccess.size !== tempModules.size) state.moduleAccess = tempModules
            //     if (state.pathAccess.size !== pathAccess.size) state.pathAccess = pathAccess
            // }
        },
        setPermissionExpired: state => {
            state.permissionExpired = true
        }
    }
})

export const { logout, testLogin, setLoading, setError, setUser, setLocation, setUserDetails, setPermissionExpired } =
    AuthSlice.actions
export default AuthSlice.reducer
