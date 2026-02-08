import { combineReducers } from 'redux'
// eslint-disable-next-line import/no-extraneous-dependencies
import { persistReducer } from 'redux-persist'
// eslint-disable-next-line import/no-extraneous-dependencies
import storage from 'redux-persist/lib/storage'

import AuthSlice from './slices/auth'
import Snackbar from './slices/snackbar'
import { Loading } from './slices/loading'
import { apiSliceConfig } from './slices/api/configSlice'
import ModalSlice from './slices/modalSlice'
import Navbar from './slices/navBarSlice'
import sessionReducer from './slices/sessionSlice'
import { RouteLabel } from './slices/routeLabel'
import AppState from './slices/appStateSlice'
import GrnSetupOption from './slices/grnSetupOption'
import Grn from './slices/grn'
import { PutAway } from './slices/putAway'
import b2bPackingSlice from './slices/b2bPackingSlice'
import inventoryStorageWiseSlice from './slices/inventoryStorageWiseSlice'
import { inventoryFilterCount } from './slices/inventoryFilterTabsSlice'
import { OrderData } from './slices/orderData'
import PickData from './slices/pickDataSlice'
import breadcrumbsSlice from './slices/breadcrumbsSlice'

const persistConfig = {
    key: 'ttk',
    storage
}

const rootReducer = combineReducers({
    auth: AuthSlice,
    snackbar: Snackbar,
    [apiSliceConfig.reducerPath]: apiSliceConfig.reducer,
    loading: Loading,
    modal: ModalSlice,
    navbar: Navbar,
    session: sessionReducer,
    routeLabel: RouteLabel,
    grnSetupOption: persistReducer(persistConfig, GrnSetupOption), // persisted state in localStorage
    appState: AppState,
    grn: Grn,
    putAway: PutAway,
    b2bPacking: b2bPackingSlice,
    orderData: OrderData,
    inventoryStorageWise: inventoryStorageWiseSlice,
    inventoryFilterTabs: inventoryFilterCount,
    pickData: PickData,
    breadcrumbs: breadcrumbsSlice
})

export default rootReducer
