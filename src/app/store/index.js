import { configureStore } from '@reduxjs/toolkit'
import { useDispatch as useAppDispatch, useSelector as useAppSelector } from 'react-redux'
import { persistStore } from 'redux-persist'

import { enableMapSet } from 'immer'
import rootReducer from './reducers'
import { apiSliceConfig } from './slices/api/configSlice'
import { listenerMiddleware } from './middleware/listenerMiddleware'
import loadingMiddleware from './middleware/loadingMiddleware'

enableMapSet()
const store = configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({ serializableCheck: false, immutableCheck: false })
            .prepend(listenerMiddleware.middleware)
            .concat(apiSliceConfig.middleware, loadingMiddleware)
})

const useDispatch = () => useAppDispatch()
const useSelector = useAppSelector

const persistor = persistStore(store)
export { store, persistor, useSelector, useDispatch }
