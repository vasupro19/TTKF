import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    LinearProgress,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material'
import { DeleteOutline } from '@mui/icons-material'
import {
    useDeleteIncentivePlanMutation,
    useGetIncentivePlansQuery,
    useSaveIncentivePlanMutation
} from '@/app/store/slices/api/gstSlice'
import { errorText, monthName } from '../gst/gstFacts'
import { BASIS_HELP } from './incentiveFacts'

const BLANK = { basis: 'profit', rate: '', targetPackages: '', bonusAmount: '', effectiveFrom: '', note: '' }

// ? what the form starts with: the plan that holds now, so changing a rate is editing it
const draftOf = current =>
    current
        ? {
              basis: current.basis,
              rate: String(current.rate),
              targetPackages: current.targetPackages ? String(current.targetPackages) : '',
              bonusAmount: current.bonusAmount ? String(current.bonusAmount) : '',
              effectiveFrom: '',
              note: current.note || ''
          }
        : BLANK

/** @description a plan form for one person (or everyone): how they earn, an optional bonus, and the month it starts */
function PlanDialog({ target, bases, month, onClose, notify }) {
    const [save, { isLoading }] = useSaveIncentivePlanMutation()
    const [draft, setDraft] = useState(BLANK)
    useEffect(() => {
        setDraft(draftOf(target?.current))
    }, [target])
    if (!target) return null

    const perPackage = draft.basis === 'package'
    const set = key => event => setDraft(current => ({ ...current, [key]: event.target.value }))

    const handleSave = async () => {
        try {
            const response = await save({
                userId: target.userId,
                basis: draft.basis,
                rate: draft.rate,
                targetPackages: draft.targetPackages,
                bonusAmount: draft.bonusAmount,
                effectiveFrom: draft.effectiveFrom || month,
                note: draft.note
            }).unwrap()
            notify(response?.message || 'Plan saved')
            onClose()
        } catch (failure) {
            notify(errorText(failure, 'Couldn’t save the plan.'), 'error')
        }
    }

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth='sm'>
            <DialogTitle>
                {target.userId ? `Plan for ${target.name}` : 'Plan for everyone without their own'}
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField select label='They earn' value={draft.basis} onChange={set('basis')}>
                        {bases.map(basis => (
                            <MenuItem key={basis.value} value={basis.value}>
                                {basis.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        label={perPackage ? 'Amount per package (₹)' : 'Percentage (%)'}
                        value={draft.rate}
                        onChange={set('rate')}
                        helperText={BASIS_HELP[draft.basis]}
                    />
                    <Stack direction='row' spacing={2}>
                        <TextField
                            fullWidth
                            label='Bonus after (packages in a month)'
                            value={draft.targetPackages}
                            onChange={set('targetPackages')}
                            helperText='Optional'
                        />
                        <TextField
                            fullWidth
                            label='Bonus amount (₹)'
                            value={draft.bonusAmount}
                            onChange={set('bonusAmount')}
                            helperText='Optional'
                        />
                    </Stack>
                    <TextField
                        type='month'
                        label='Starts in'
                        value={draft.effectiveFrom || month}
                        onChange={set('effectiveFrom')}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ min: month }}
                        helperText='This month or later: what was earned in earlier months doesn’t change'
                    />
                    <TextField label='Note (optional)' value={draft.note} onChange={set('note')} />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant='contained' onClick={handleSave} disabled={isLoading || draft.rate === ''}>
                    {isLoading ? 'Saving…' : 'Save plan'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

PlanDialog.propTypes = {
    target: PropTypes.shape({
        userId: PropTypes.number,
        name: PropTypes.string,
        current: PropTypes.shape({ basis: PropTypes.string })
    }),
    bases: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })).isRequired,
    month: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    notify: PropTypes.func.isRequired
}

/**
 * How everyone earns: the plan for everyone without their own, and each person's. A plan holds from its month until a later
 * one replaces it. Only the agency's owner and admins see this.
 */
function PlansPanel({ notify }) {
    const { data, isFetching, error } = useGetIncentivePlansQuery(undefined, { refetchOnMountOrArgChange: true })
    const [removePlan] = useDeleteIncentivePlanMutation()
    const [target, setTarget] = useState(null)
    const info = data?.data

    const handleRemove = async plan => {
        try {
            await removePlan(plan.id).unwrap()
            notify('Plan removed')
        } catch (failure) {
            notify(errorText(failure, 'Couldn’t remove the plan.'), 'error')
        }
    }

    const planCell = person => (
        <>
            {person.current ? (
                <Typography sx={{ fontSize: '0.9375rem' }}>
                    {person.current.summary}
                    {!person.own && person.userId !== null && (
                        <Chip size='small' variant='outlined' label='everyone’s plan' sx={{ ml: 1 }} />
                    )}
                </Typography>
            ) : (
                <Typography color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
                    No plan — earns nothing yet
                </Typography>
            )}
            {person.upcoming.map(plan => (
                <Stack key={plan.id} direction='row' alignItems='center' spacing={0.5}>
                    <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                        From {monthName(plan.effectiveFrom)}: {plan.summary}
                    </Typography>
                    <IconButton size='small' aria-label='Remove this plan' onClick={() => handleRemove(plan)}>
                        <DeleteOutline fontSize='inherit' />
                    </IconButton>
                </Stack>
            ))}
        </>
    )

    return (
        <Box>
            {isFetching && <LinearProgress />}
            {error && <Alert severity='error'>{errorText(error, 'Couldn’t load the plans.')}</Alert>}
            {info && (
                <>
                    <Typography color='text.secondary' sx={{ mb: 2, fontSize: '0.9375rem' }}>
                        Choose how each person earns on the packages they sell. A person without a plan of their own
                        earns by the plan for everyone.
                    </Typography>
                    <Box sx={{ overflowX: 'auto' }}>
                        <Table size='small'>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Person</TableCell>
                                    <TableCell>Plan</TableCell>
                                    <TableCell align='right' />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>
                                        <strong>Everyone</strong>
                                        <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                                            without a plan of their own
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{planCell({ ...info.everyone, userId: null })}</TableCell>
                                    <TableCell align='right'>
                                        <Button
                                            size='small'
                                            onClick={() =>
                                                setTarget({
                                                    userId: null,
                                                    name: 'everyone',
                                                    current: info.everyone.current
                                                })
                                            }
                                        >
                                            {info.everyone.current ? 'Change' : 'Set plan'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                {info.users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <strong>{user.name}</strong>
                                            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                                                {user.role || user.email}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{planCell({ ...user, userId: user.id })}</TableCell>
                                        <TableCell align='right'>
                                            <Button
                                                size='small'
                                                onClick={() =>
                                                    setTarget({
                                                        userId: user.id,
                                                        name: user.name,
                                                        current: user.current
                                                    })
                                                }
                                            >
                                                {user.own ? 'Change' : 'Set plan'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                    <PlanDialog
                        target={target}
                        bases={info.bases}
                        month={info.month}
                        onClose={() => setTarget(null)}
                        notify={notify}
                    />
                </>
            )}
        </Box>
    )
}

PlansPanel.propTypes = { notify: PropTypes.func.isRequired }

export default PlansPanel
