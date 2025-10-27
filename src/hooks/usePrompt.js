import { useEffect, useState } from 'react'

/**
 * Custom hook for displaying a confirmation prompt when the user attempts
 * to leave the site or navigate away from the current page.
 *
 * @param {string} message - The message to display in the confirmation prompt.
 * @param {string} title - The title of the confirmation prompt.
 * @param {string} yesButtonText - Text for the confirmation button.
 * @param {string} noButtonText - Text for the cancellation button.
 *
 * @returns {Object} The visibility state of the modal, modal text, and handlers.
 */
const usePrompt = (message = 'Are you sure?', title = 'Leave site?', yesButtonText = 'Yes', noButtonText = 'No') => {
    // State to manage the visibility of the confirmation modal.
    const [visible, setVisible] = useState(false)

    // Function to show the confirmation modal.
    const showModal = () => setVisible(true)
    // Function to hide the confirmation modal.
    const hideModal = () => setVisible(false)

    // Handler when the user confirms.
    const onYes = () => {
        hideModal()
        // You may add additional logic here on confirmation (e.g., navigation).
    }

    // Handler when the user cancels the prompt.
    const onCancel = () => {
        hideModal()
    }

    useEffect(() => {
        // Handler for the beforeunload event to display the confirmation dialog.
        const handleBeforeUnload = event => {
            event.preventDefault()
            event.returnValue = message // This is required for the dialog to show up.
            return message // Some browsers may require this.
        }

        // Attach the beforeunload event listener.
        window.addEventListener('beforeunload', handleBeforeUnload)

        // Cleanup the event handler on component unmount.
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [message]) // Re-run effect if message changes.

    useEffect(() => {
        // Handler for location change events to show the modal.
        const handleLocationChange = event => {
            showModal() // Show the confirmation modal.
            event.preventDefault() // Prevent the default action of the event.
            event.returnValue = message // Show the dialog with a message.
            return message // Some browsers may require this.
        }

        // Attach the beforeunload event listener for location changes.
        window.addEventListener('beforeunload', handleLocationChange)

        // Cleanup the event handler on component unmount.
        return () => {
            window.removeEventListener('beforeunload', handleLocationChange)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Empty dependency array means this effect runs once on mount.

    // Return the modal's visibility state, texts, and event handlers.
    return {
        visible,
        title,
        message,
        yesButtonText,
        noButtonText,
        onYes,
        onCancel,
        hideModal
    }
}

export default usePrompt
