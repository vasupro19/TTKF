import PropTypes from 'prop-types'
import { IntlProvider } from 'react-intl'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

// load locales files
const loadLocaleData = locale => {
    switch (locale) {
        case 'fr':
            return import('@/utilities/locales/fr.json')
        default:
            return import('@/utilities/locales/en.json')
    }
}

// ==============================|| LOCALIZATION ||============================== //

function Localization({ children }) {
    const { locale } = useSelector(state => state.appState)

    const [messages, setMessages] = useState()

    useEffect(() => {
        loadLocaleData(locale).then(d => {
            setMessages(d.default)
        })
    }, [locale])

    return (
        <IntlProvider locale={locale} defaultLocale='en' messages={messages}>
            {children}
        </IntlProvider>
    )
}

Localization.propTypes = {
    children: PropTypes.node
}

export default Localization
