import { useState, useEffect } from 'react'

// add all localStorage keys here
export const LOCAL_STORAGE_KEYS = Object.freeze({
    token: 'token',
    previousRoute: 'previousRoute',
    clientLocation: 'clientLocation',
    grnConfig: 'grnConfig',
    tableId: 'tableId'
})

export function useLocalStorage(key, initialValue = null, isJson = false) {
    if (!(key in LOCAL_STORAGE_KEYS)) {
        throw new Error(`Invalid key: ${key}`)
    }

    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = localStorage.getItem(key)
            // eslint-disable-next-line no-nested-ternary
            return item ? (isJson ? JSON.parse(item) : item) : initialValue
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error reading localStorage:', error)
            return initialValue
        }
    })

    const setValue = value => {
        try {
            const valueToStore = isJson ? JSON.stringify(value) : value
            window.localStorage.setItem(key, valueToStore)
            setStoredValue(value)
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error setting localStorage:', error)
        }
    }

    const removeValue = () => {
        try {
            localStorage.removeItem(key)
            setStoredValue(null)
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error removing localStorage item:', error)
        }
    }

    useEffect(() => {
        const handleStorageChange = () => {
            const newValue = localStorage.getItem(key)
            // eslint-disable-next-line no-nested-ternary
            setStoredValue(newValue ? (isJson ? JSON.parse(newValue) : newValue) : initialValue)
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [key, isJson, initialValue])

    return [storedValue, setValue, removeValue]
}
