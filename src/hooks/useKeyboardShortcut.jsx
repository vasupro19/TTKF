import { useEffect } from 'react'

/**
 * Hook to add global keyboard shortcuts.
 *
 * @param {string} keyCombination - The key combination or single key (e.g., 'Ctrl+N', 'Enter', 'A').
 * @param {Function} callback - The function to execute when the shortcut is triggered.
 */
// eslint-disable-next-line import/prefer-default-export
export function useKeyboardShortcut(keyCombination, callback) {
    useEffect(() => {
        const handler = event => {
            const keys = keyCombination.split('+').map(k => k.trim().toLowerCase())
            const ctrl = keys.includes('ctrl') ? event.ctrlKey : true
            const shift = keys.includes('shift') ? event.shiftKey : true
            const alt = keys.includes('alt') ? event.altKey : true
            const key = keys[keys.length - 1] // Last part is the actual key
            const pressedKey = event.key.toLowerCase()

            if (ctrl && shift && alt && pressedKey === key) {
                event.preventDefault()
                callback()
            }
        }

        window.addEventListener('keydown', handler)

        return () => {
            window.removeEventListener('keydown', handler)
        }
    }, [keyCombination, callback])
}
