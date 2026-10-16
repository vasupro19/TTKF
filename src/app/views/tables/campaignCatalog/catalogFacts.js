import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import { closeModal, openModal } from '@/app/store/slices/modalSlice'
import { useGetCampaignByIdQuery } from '@/app/store/slices/api/campaignSlice'

// ? the filters and columns the four campaign lists share
export const STATUS_FILTER = {
    key: 'active',
    label: 'Status',
    width: 140,
    options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
    ]
}

export const createdColumn = key => ({
    id: 90,
    label: 'Created',
    search: false,
    sort: false,
    stick: false,
    key,
    visible: true,
    minWidth: 8,
    maxWidth: 10
})

export const statusColumn = {
    id: 91,
    label: 'Status',
    search: false,
    sort: false,
    stick: false,
    key: 'status',
    visible: true,
    minWidth: 6,
    maxWidth: 8
}

/** @description the title of the campaign a list is about ('' until it is known) */
export function useCampaignName(campaignId) {
    const { data } = useGetCampaignByIdQuery(campaignId, { skip: !campaignId })
    return data?.data?.title || ''
}

/** @description a list's line under its title: what it holds, and for which campaign */
export const scopedSubtitle = (text, campaignName) => (campaignName ? `${text} Campaign: ${campaignName}.` : text)

/**
 * @description the confirm-and-delete step of a row: `ask(row)` opens the question; "Yes" calls `remove(id)`.
 *              Whatever the server says (it may refuse, or switch the row off instead) is shown in a message.
 */
export function useDeleteFlow({ remove, noun, nameOf, done, loading = false }) {
    const dispatch = useDispatch()
    const [row, setRow] = useState(null)

    const ask = useCallback(
        target => {
            setRow(target)
            dispatch(openModal({ type: 'confirm_modal' }))
        },
        [dispatch]
    )

    const tell = (message, color) =>
        dispatch(
            openSnackbar({
                open: true,
                message,
                variant: 'alert',
                alert: { color },
                anchorOrigin: { vertical: 'top', horizontal: 'right' }
            })
        )

    const confirm = async () => {
        try {
            const reply = await remove(row.id)
            tell(reply?.message || `${noun} deleted.`, 'success')
            if (done) done()
        } catch (error) {
            tell(error?.data?.message || `Could not delete this ${noun.toLowerCase()}.`, 'error')
        } finally {
            dispatch(closeModal())
        }
    }

    const confirmProps = {
        noun,
        name: nameOf(row) || 'Unknown',
        onConfirm: confirm,
        loading
    }
    return { ask, confirmProps }
}
