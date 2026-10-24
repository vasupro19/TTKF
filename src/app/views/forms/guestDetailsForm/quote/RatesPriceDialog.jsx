import { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputAdornment,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { usePriceFromRatesMutation } from '@/app/store/slices/api/ratesSlice'
import GapRates from './GapRates'
import { formatRupees } from './quoteDays'
import { PER_PERSON, TOTAL, groupPrice, priceBasisOf } from './pricing'
import { inputsLine, missingRates, pricedCount, pricesFromResult } from './ratesPrice'

function CategoryCard({ category, canSeeCosts, basis, people }) {
    const [open, setOpen] = useState(false)
    if (!category.ok) {
        return (
            <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 600 }}>{category.label}</Typography>
                <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mb: 0.75 }}>
                    Can’t be priced yet
                </Typography>
                <Stack direction='row' sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {category.missing.map(text => (
                        <Chip key={text} size='small' variant='outlined' label={text} />
                    ))}
                </Stack>
            </Box>
        )
    }
    const group = groupPrice(category.perPerson, PER_PERSON, people)
    return (
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 600 }}>{category.label}</Typography>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3 }}>
                {formatRupees(basis === TOTAL ? group : category.perPerson)}
            </Typography>
            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                {basis === TOTAL
                    ? `for the group of ${people}`
                    : `per person${people > 1 ? ` · ${formatRupees(group)} for ${people}` : ''}`}
            </Typography>
            {canSeeCosts ? (
                <>
                    <Button
                        size='small'
                        onClick={() => setOpen(value => !value)}
                        sx={{ mt: 1, px: 0, textTransform: 'none' }}
                    >
                        {open ? 'Hide how it was worked out' : `Cost ${formatRupees(category.cost)} · show how`}
                    </Button>
                    <Collapse in={open}>
                        <Box
                            component='ul'
                            aria-label={`How ${category.label} was worked out`}
                            sx={{ m: 0, mt: 0.5, p: 0, listStyle: 'none' }}
                        >
                            {category.lines.map(line => (
                                <Stack
                                    key={`${line.label}-${line.detail}`}
                                    component='li'
                                    direction='row'
                                    justifyContent='space-between'
                                    spacing={2}
                                    sx={{ py: 0.25 }}
                                >
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontSize: '0.8125rem' }}>{line.label}</Typography>
                                        {line.detail ? (
                                            <Typography color='text.secondary' sx={{ fontSize: '0.75rem' }}>
                                                {line.detail}
                                            </Typography>
                                        ) : null}
                                    </Box>
                                    <Typography sx={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                                        {formatRupees(line.amount)}
                                    </Typography>
                                </Stack>
                            ))}
                        </Box>
                    </Collapse>
                </>
            ) : null}
        </Box>
    )
}

CategoryCard.propTypes = {
    category: PropTypes.shape({
        label: PropTypes.string,
        ok: PropTypes.bool,
        perPerson: PropTypes.number,
        cost: PropTypes.number,
        missing: PropTypes.arrayOf(PropTypes.string),
        lines: PropTypes.arrayOf(
            PropTypes.shape({ label: PropTypes.string, detail: PropTypes.string, amount: PropTypes.number })
        )
    }).isRequired,
    canSeeCosts: PropTypes.bool.isRequired,
    basis: PropTypes.string.isRequired,
    people: PropTypes.number.isRequired
}

/**
 * "Calculate from rates": the quote's four hotel categories priced from the agency's rate card, shown before anything is
 * filled in. A manager or admin also sees what each price is made of and can try another margin; a salesperson sees the
 * prices only. "Use these prices" puts them in the price boxes — the agent still saves them, or changes them first.
 */
export default function RatesPriceDialog({ leadId, quoteNo, basis, people, onApply, onClose }) {
    const navigate = useNavigate()
    const [price, { isLoading }] = usePriceFromRatesMutation()
    const [data, setData] = useState(null)
    const [problem, setProblem] = useState('')
    const [margin, setMargin] = useState('')
    const shownBasis = priceBasisOf(basis)

    const run = useCallback(
        async marginPct => {
            setProblem('')
            try {
                const reply = await price({
                    leadId,
                    quoteNo,
                    ...(marginPct === undefined ? {} : { marginPct })
                }).unwrap()
                setData(reply.data)
                setMargin(String(reply.data?.inputs?.marginPct ?? ''))
            } catch (error) {
                setData(null)
                setProblem(error?.data?.message || 'Couldn’t work out the prices. Please try again.')
            }
        },
        [price, leadId, quoteNo]
    )

    useEffect(() => {
        run()
        // ? once, when the dialog opens
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const canSeeCosts = Boolean(data?.canSeeCosts)
    const missing = missingRates(data)
    const priced = pricedCount(data)
    const marginOk = margin.trim() !== '' && Number(margin) >= 0

    return (
        <Dialog open onClose={onClose} maxWidth='md' fullWidth>
            <DialogTitle>Prices from your rates — Quote {quoteNo}</DialogTitle>
            <DialogContent>
                {isLoading && !data ? (
                    <Stack direction='row' spacing={1.5} alignItems='center' role='status' sx={{ py: 3 }}>
                        <CircularProgress size={20} />
                        <Typography>Working it out from your rates…</Typography>
                    </Stack>
                ) : null}

                {problem ? (
                    <Alert severity='warning' sx={{ mt: 1 }}>
                        {problem}
                    </Alert>
                ) : null}

                {data ? (
                    <Box>
                        <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mb: 2 }}>
                            {inputsLine(data.inputs, canSeeCosts)}
                        </Typography>
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 1.5,
                                gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }
                            }}
                        >
                            {data.categories.map(category => (
                                <CategoryCard
                                    key={category.key}
                                    category={category}
                                    canSeeCosts={canSeeCosts}
                                    basis={shownBasis}
                                    people={people}
                                />
                            ))}
                        </Box>

                        {data.notes?.map(note => (
                            <Alert key={note} severity='info' sx={{ mt: 1.5 }}>
                                {note}
                            </Alert>
                        ))}

                        {missing.length ? (
                            <Alert
                                severity='warning'
                                sx={{ mt: 1.5 }}
                                action={
                                    canSeeCosts ? (
                                        <Button
                                            color='inherit'
                                            size='small'
                                            onClick={() => navigate('/master/rates')}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Add the rates
                                        </Button>
                                    ) : null
                                }
                            >
                                {canSeeCosts
                                    ? 'Some rates are not on your rate card, so those categories were left out instead of guessed.'
                                    : 'Some rates are not on the agency’s rate card yet. Ask your admin to add them.'}
                            </Alert>
                        ) : null}

                        {data.canEditRates && data.gaps?.length ? (
                            <GapRates gaps={data.gaps} onSaved={() => run(marginOk ? Number(margin) : undefined)} />
                        ) : null}

                        {canSeeCosts ? (
                            <Stack direction='row' spacing={1.5} alignItems='flex-start' sx={{ mt: 2 }}>
                                <TextField
                                    size='small'
                                    label='Margin for this quote'
                                    value={margin}
                                    onChange={event => setMargin(event.target.value.replace(/[^0-9.]/g, ''))}
                                    InputProps={{
                                        endAdornment: <InputAdornment position='end'>%</InputAdornment>,
                                        inputProps: { inputMode: 'decimal', 'aria-label': 'Margin for this quote' }
                                    }}
                                    sx={{ width: 190 }}
                                />
                                <Button
                                    variant='outlined'
                                    disabled={isLoading || !marginOk}
                                    onClick={() => run(Number(margin))}
                                    sx={{ textTransform: 'none', mt: '1px' }}
                                >
                                    Recalculate
                                </Button>
                            </Stack>
                        ) : null}
                    </Box>
                ) : null}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none' }}>
                    Close
                </Button>
                <Button
                    variant='contained'
                    disabled={!priced}
                    onClick={() => onApply(pricesFromResult(data, { basis: shownBasis, people }))}
                    sx={{ textTransform: 'none' }}
                >
                    Use these prices
                </Button>
            </DialogActions>
        </Dialog>
    )
}

RatesPriceDialog.propTypes = {
    leadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    quoteNo: PropTypes.number.isRequired,
    basis: PropTypes.string,
    people: PropTypes.number,
    onApply: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
}

RatesPriceDialog.defaultProps = { basis: PER_PERSON, people: 0 }
