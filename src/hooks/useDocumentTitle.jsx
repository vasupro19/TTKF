import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const formatTitle = str =>
    str
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Split camelCase
        .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
        .toLowerCase() // Convert all to lowercase first
        .replace(/\b\w/g, char => char.toUpperCase()) // Capitalize first letter of each word

/**
 * Hook to set document title - auto-generates from route or uses provided title
 * @param {string} [customTitle] - Custom title to override route-based title
 * @param {string} [defaultTitle='Cerebrum'] - Default title when no route segments
 */
const useDocumentTitle = (customTitle, defaultTitle = 'Cerebrum') => {
    const { pathname } = useLocation()

    useEffect(() => {
        let title = defaultTitle

        // Use custom title if provided
        if (customTitle) {
            title = customTitle
        } else {
            // Generate title from route
            const segments = pathname.split('/').filter(Boolean)

            if (segments.length === 1) {
                title = formatTitle(segments[0])
            } else if (segments.length > 1) {
                title = formatTitle(segments[1])
            }
        }

        document.title = title
    }, [pathname, customTitle, defaultTitle])
}

export default useDocumentTitle
