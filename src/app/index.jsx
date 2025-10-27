import { Suspense } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'

// redux imports
import { Provider } from 'react-redux'
import { store, persistor } from '@app/store'

// app imports
import './index.css'
import Loader from '@core/components/extended/Loader'
import Snackbar from '@core/components/extended/Snackbar'
import ThemeCustomization from '@core/theme'
import Localization from '@app/context/LocalizationContext'
import Routes from './routes'

function App() {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <Localization>
                    <ThemeCustomization>
                        <Snackbar maxSnack={1} />
                        {/* //! enabling future flags to remove warning of react router */}
                        {/* <BrowserRouter> */}
                        <BrowserRouter>
                            <Suspense fallback={<Loader />}>
                                <Routes />
                            </Suspense>
                        </BrowserRouter>
                    </ThemeCustomization>
                </Localization>
            </PersistGate>
        </Provider>
    )
}

export default App
