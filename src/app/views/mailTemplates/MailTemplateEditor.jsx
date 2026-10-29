import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useResetMailTemplateMutation, useSaveMailTemplateMutation } from '@/app/store/slices/api/mailTemplateSlice'
import ConfirmDialog from './ConfirmDialog'
import MailPreview from './MailPreview'
import PlaceholderChips from './PlaceholderChips'
import SlotField from './SlotField'
import ThemeSelect from './ThemeSelect'
import {
    customisedSummary,
    describeFailure,
    draftOf,
    insertAtCursor,
    isUnsaved,
    placeholderToken,
    slotProblems,
    slotsBody,
    updatedLine
} from './mailTemplateFacts'

const without = (record, key) => {
    const { [key]: removed, ...rest } = record
    return rest
}

/**
 * One kind of email: its texts to edit, the fill-ins to put in them, a live preview, and Save / Reset. Open a different kind and
 * this is built again, so each kind starts from what is saved. `onDirtyChange` tells the page whether there is typing that
 * isn't saved (it asks before leaving). `onLocked` hears the server's 409 (the agency's database isn't upgraded): editing stops.
 * The kind's theme is saved the moment it is picked (`onThemeChange` gets a theme's key, or '' to follow the theme for all), apart
 * from the texts; the preview shows the theme the kind goes out in.
 */
function MailTemplateEditor({
    kind,
    themes = [],
    themeForAll = 'classic',
    themeBusy = false,
    onThemeChange = null,
    locked = '',
    onDirtyChange,
    onLocked
}) {
    const dispatch = useDispatch()
    const [save, { isLoading: saving }] = useSaveMailTemplateMutation()
    const [reset, { isLoading: resetting }] = useResetMailTemplateMutation()
    const saved = useMemo(() => draftOf(kind), [kind])
    const [draft, setDraft] = useState(saved)
    const [saveErrors, setSaveErrors] = useState({}) // the server's messages for the last save, by slot
    const [previewErrors, setPreviewErrors] = useState({}) // …and for the last preview
    const [formError, setFormError] = useState('')
    const [askReset, setAskReset] = useState(false)
    // ? the field the cursor was last in: the fill-ins go there
    const [target, setTarget] = useState(null)
    const inputs = useRef({})
    const cursor = useRef(null)

    // ? what is saved changed (a save, a reset, the list loaded again): the fields show it
    useEffect(() => {
        setDraft(saved)
        setSaveErrors({})
        setFormError('')
    }, [saved])

    const slots = useMemo(() => (Array.isArray(kind.slots) ? kind.slots : []), [kind])
    const placeholders = Array.isArray(kind.placeholders) ? kind.placeholders : []
    const unsaved = isUnsaved(kind, draft)
    const problems = useMemo(() => slotProblems(kind, draft), [kind, draft])
    const body = useMemo(() => slotsBody(kind, draft), [kind, draft])
    const busy = saving || resetting
    const readOnly = Boolean(locked)
    const targetKey = slots.some(slot => slot.key === target) ? target : slots[0]?.key
    const targetSlot = slots.find(slot => slot.key === targetKey)

    useEffect(() => {
        onDirtyChange(unsaved)
    }, [unsaved, onDirtyChange])
    useEffect(() => () => onDirtyChange(false), [onDirtyChange])

    // ? after a fill-in goes in, the cursor goes back into that field, just after it
    useEffect(() => {
        if (!cursor.current) return
        const { key, position } = cursor.current
        cursor.current = null
        const input = inputs.current[key]
        if (!input) return
        input.focus()
        input.setSelectionRange(position, position)
    }, [draft])

    const notify = (message, color = 'success') =>
        dispatch(openSnackbar({ open: true, message, variant: 'alert', alert: { color }, close: false }))

    const edit = (key, value) => {
        setDraft(current => ({ ...current, [key]: value }))
        setSaveErrors(current => without(current, key))
    }

    const insert = name => {
        if (!targetKey) return
        const input = inputs.current[targetKey]
        // ? the cursor is only known for a field that was used; any other gets the fill-in at its end
        const known = target === targetKey && input
        const result = insertAtCursor(
            draft[targetKey],
            known ? input.selectionStart : null,
            known ? input.selectionEnd : null,
            placeholderToken(name)
        )
        cursor.current = { key: targetKey, position: result.cursor }
        edit(targetKey, result.value)
    }

    const discard = () => {
        setDraft(saved)
        setSaveErrors({})
        setFormError('')
    }

    const fail = error => {
        const failure = describeFailure(error, 'Couldn’t reach the server. Please try again.')
        if (failure.type === 'notReady') onLocked(failure.message)
        else if (failure.type === 'fields') setSaveErrors(failure.errors)
        setFormError(failure.type === 'notReady' ? '' : failure.message)
    }

    const handleSave = async () => {
        setFormError('')
        setSaveErrors({})
        try {
            await save({ kind: kind.key, slots: body.slots }).unwrap()
            notify(`“${kind.label}” saved`)
        } catch (error) {
            fail(error)
        }
    }

    const handleReset = async () => {
        setAskReset(false)
        setFormError('')
        setSaveErrors({})
        try {
            await reset({ kind: kind.key }).unwrap()
            notify(`“${kind.label}” is back to the default text`)
        } catch (error) {
            fail(error)
        }
    }

    const onPreviewProblems = useCallback(errors => setPreviewErrors(errors), [])
    const errorOf = key => problems[key] || saveErrors[key] || previewErrors[key] || ''
    // ? server messages about a text this screen has no field for
    const strays = Object.entries({ ...saveErrors, ...previewErrors }).filter(
        ([key]) => !slots.some(slot => slot.key === key)
    )
    const updated = updatedLine(kind)

    return (
        <Box>
            <Stack direction='row' spacing={1.5} alignItems='center' flexWrap='wrap' useFlexGap>
                <Typography component='h2' sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    {kind.label}
                </Typography>
                {kind.customised ? <Chip size='small' color='primary' variant='outlined' label='Customised' /> : null}
            </Stack>
            {kind.description ? (
                <Typography color='text.secondary' sx={{ fontSize: '0.9375rem', mt: 0.5 }}>
                    {kind.description}
                </Typography>
            ) : null}
            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mt: 0.25, mb: 2 }}>
                {[customisedSummary(kind), updated].filter(Boolean).join(' · ')}
            </Typography>

            {readOnly ? (
                <Alert severity='warning' sx={{ mb: 2 }}>
                    {locked}
                </Alert>
            ) : null}
            {formError ? (
                <Alert severity='error' sx={{ mb: 2 }} role='alert'>
                    {formError}
                </Alert>
            ) : null}
            {strays.length ? (
                <Alert severity='error' sx={{ mb: 2 }}>
                    {strays.map(([key, message]) => (
                        <div key={key}>{message}</div>
                    ))}
                </Alert>
            ) : null}

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
                    alignItems: 'start'
                }}
            >
                <Stack spacing={2.5}>
                    {onThemeChange && themes.length ? (
                        <ThemeSelect
                            themes={themes}
                            value={kind.theme || ''}
                            label='Theme for this email'
                            followLabel={`Same as all emails (${themes.find(theme => theme.key === themeForAll)?.label || 'Classic'})`}
                            disabled={readOnly || themeBusy}
                            onChange={value => value !== (kind.theme || '') && onThemeChange(value)}
                            sx={{ maxWidth: 360 }}
                        />
                    ) : null}
                    <PlaceholderChips
                        placeholders={placeholders}
                        targetLabel={targetSlot?.label}
                        disabled={readOnly || busy}
                        onInsert={insert}
                    />
                    {slots.map(slot => (
                        <SlotField
                            key={slot.key}
                            id={`mail-slot-${kind.key}-${slot.key}`}
                            slot={slot}
                            value={draft[slot.key] ?? ''}
                            error={errorOf(slot.key)}
                            disabled={readOnly || busy}
                            inputRef={element => {
                                inputs.current[slot.key] = element
                            }}
                            onChange={value => edit(slot.key, value)}
                            onFocus={() => setTarget(slot.key)}
                            onReset={() => edit(slot.key, slot.default ?? '')}
                        />
                    ))}
                    <Stack
                        direction='row'
                        spacing={1.5}
                        alignItems='center'
                        sx={{
                            flexWrap: 'wrap',
                            rowGap: 1,
                            position: 'sticky',
                            bottom: 0,
                            py: 1.5,
                            bgcolor: 'background.paper',
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            zIndex: 1
                        }}
                    >
                        <Button
                            variant='contained'
                            onClick={handleSave}
                            disabled={readOnly || busy || !unsaved || Object.keys(problems).length > 0}
                            startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
                        >
                            {saving ? 'Saving…' : 'Save changes'}
                        </Button>
                        {unsaved ? (
                            <Button color='inherit' onClick={discard} disabled={busy}>
                                Discard changes
                            </Button>
                        ) : null}
                        <Button
                            color='error'
                            variant='outlined'
                            onClick={() => setAskReset(true)}
                            disabled={readOnly || busy || !kind.customised}
                        >
                            Reset all to default
                        </Button>
                        <Typography
                            role='status'
                            sx={{ fontSize: '0.875rem', color: unsaved ? 'warning.dark' : 'text.secondary' }}
                        >
                            {unsaved ? 'Unsaved changes' : 'All changes saved'}
                        </Typography>
                    </Stack>
                </Stack>

                <Box sx={{ position: { lg: 'sticky' }, top: { lg: 16 } }}>
                    <MailPreview
                        kindKey={kind.key}
                        slots={body.slots}
                        theme={kind.themeUsed || ''}
                        onProblems={onPreviewProblems}
                    />
                </Box>
            </Box>

            <ConfirmDialog
                open={askReset}
                title='Reset to the default text?'
                confirmLabel='Reset to default'
                danger
                busy={resetting}
                onConfirm={handleReset}
                onCancel={() => setAskReset(false)}
            >
                Every text of “{kind.label}” goes back to the default wording.
                {unsaved ? ' The changes you have typed and not saved are lost too.' : ''} This can’t be undone.
            </ConfirmDialog>
        </Box>
    )
}

MailTemplateEditor.propTypes = {
    kind: PropTypes.shape({
        key: PropTypes.string.isRequired,
        label: PropTypes.string,
        description: PropTypes.string,
        customised: PropTypes.bool,
        slots: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.string.isRequired })),
        placeholders: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string.isRequired })),
        theme: PropTypes.string,
        themeUsed: PropTypes.string
    }).isRequired,
    themes: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.string.isRequired })),
    themeForAll: PropTypes.string,
    themeBusy: PropTypes.bool,
    onThemeChange: PropTypes.func,
    locked: PropTypes.string,
    onDirtyChange: PropTypes.func.isRequired,
    onLocked: PropTypes.func.isRequired
}

export default MailTemplateEditor
