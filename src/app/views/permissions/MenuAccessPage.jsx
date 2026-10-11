import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { useDispatch } from 'react-redux'
import MainCard from '@core/components/extended/MainCard'
import { openSnackbar } from '@app/store/slices/snackbar'
import MenuAccessEditor from './MenuAccessEditor'
import { LoadState, PageHeader, UnsavedBar } from './PermissionParts'
import { diffIds, idsToSave, initialIdsOf, lockedIdsOf } from './menuAccess'
import useLeaveGuard from './useLeaveGuard'

/**
 * @description a whole page for giving screens: header, the editor, and a Save bar.
 * `onSave(ids)` gets only the ids ticked here (never what a role gives) and returns the server's reply.
 */
function MenuAccessPage({ title, subtitle, backTo, backLabel, menus, loading, error, onRetry, onSave, emptyText }) {
    const dispatch = useDispatch()
    const initial = useMemo(() => initialIdsOf(menus), [menus])
    const locked = useMemo(() => lockedIdsOf(menus), [menus])
    const [saved, setSaved] = useState(initial)
    const [current, setCurrent] = useState(initial)
    const [saving, setSaving] = useState(false)

    // ? what the server says now (first load, or after a save) is the new starting point
    useEffect(() => {
        setSaved(initial)
        setCurrent(initial)
    }, [initial])

    const changes = diffIds(saved, current).count
    useLeaveGuard(changes > 0)

    const notify = (message, color) =>
        dispatch(openSnackbar({ open: true, message, variant: 'alert', alert: { color } }))

    const save = async () => {
        setSaving(true)
        try {
            const reply = await onSave(idsToSave(current, locked))
            setSaved(current)
            notify(reply?.message || 'Screens saved', 'success')
        } catch (failure) {
            notify(failure?.data?.message || failure?.message || 'Couldn’t save the screens', 'error')
        } finally {
            setSaving(false)
        }
    }

    const busy = loading || Boolean(error)

    return (
        <MainCard content={false} sx={{ overflow: 'visible' }}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
                <PageHeader backTo={backTo} backLabel={backLabel} title={title} subtitle={subtitle} />
                {busy ? (
                    <LoadState
                        loading={loading}
                        error={error}
                        onRetry={onRetry}
                        fallback='Couldn’t load the screens.'
                    />
                ) : (
                    <>
                        <MenuAccessEditor
                            menus={menus}
                            value={current}
                            onChange={setCurrent}
                            disabled={saving}
                            emptyText={emptyText}
                        />
                        <UnsavedBar count={changes} saving={saving} onDiscard={() => setCurrent(saved)} onSave={save} />
                    </>
                )}
            </Box>
        </MainCard>
    )
}

MenuAccessPage.propTypes = {
    title: PropTypes.node.isRequired,
    subtitle: PropTypes.node,
    backTo: PropTypes.string,
    backLabel: PropTypes.string,
    menus: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]) })),
    loading: PropTypes.bool,
    error: PropTypes.oneOfType([
        PropTypes.shape({ message: PropTypes.string, data: PropTypes.shape({ message: PropTypes.string }) }),
        PropTypes.string
    ]),
    onRetry: PropTypes.func,
    onSave: PropTypes.func.isRequired,
    emptyText: PropTypes.string
}

export default MenuAccessPage
