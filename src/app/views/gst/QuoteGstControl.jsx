import PropTypes from 'prop-types'
import {
    Alert,
    Box,
    Chip,
    Collapse,
    Link,
    MenuItem,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { COMMON_RATES, GST_MODES, splitText } from './gstFacts'

/**
 * The GST of one quote, beside its prices: none, on top of the prices, or inside them; the rate; where the supply is made;
 * and, for a business guest, its GSTIN. The figures per category are shown by the price boxes next to it.
 */
function QuoteGstControl({ gst, quotationNo }) {
    const { draft, setDraft, ready, registered, loading, tax, states, guestStateName, interState, problem } = gst
    if (!ready && !loading) return null

    const set = key => event => setDraft(current => ({ ...current, [key]: event.target.value }))
    const charging = draft.mode !== 'none'
    const commonRate = COMMON_RATES.includes(Number(draft.rate)) ? draft.rate : 'other'

    return (
        <Box sx={{ mb: 2.5 }}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1, sm: 1.5 }}
                alignItems={{ sm: 'center' }}
                sx={{ mb: charging ? 1.5 : 0 }}
            >
                <Typography id={`gst-mode-${quotationNo}`} sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>
                    GST
                </Typography>
                <ToggleButtonGroup
                    size='small'
                    exclusive
                    value={draft.mode}
                    onChange={(event, next) => next && setDraft(current => ({ ...current, mode: next }))}
                    aria-labelledby={`gst-mode-${quotationNo}`}
                    sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 1.75 } }}
                >
                    {GST_MODES.map(mode => (
                        <ToggleButton key={mode.key} value={mode.key} title={mode.hint}>
                            {mode.label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
                {charging && tax.rate > 0 && (
                    <Chip size='small' variant='outlined' label={`${splitText({ rate: tax.rate, interState })}`} />
                )}
            </Stack>

            <Collapse in={charging} unmountOnExit>
                {!registered && (
                    <Alert severity='warning' sx={{ mb: 1.5 }}>
                        The agency has no GSTIN yet, so GST can’t be charged.{' '}
                        <Link component={RouterLink} to='/master/gst'>
                            Add it in GST settings
                        </Link>
                        .
                    </Alert>
                )}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                    <TextField
                        select
                        size='small'
                        label='GST rate'
                        value={commonRate}
                        onChange={event =>
                            setDraft(current => ({
                                ...current,
                                rate: event.target.value === 'other' ? '' : event.target.value
                            }))
                        }
                        sx={{ minWidth: 120 }}
                    >
                        {COMMON_RATES.map(rate => (
                            <MenuItem key={rate} value={String(rate)}>
                                {rate}%
                            </MenuItem>
                        ))}
                        <MenuItem value='other'>Other…</MenuItem>
                    </TextField>
                    {commonRate === 'other' && (
                        <TextField
                            size='small'
                            label='Rate %'
                            value={draft.rate}
                            onChange={set('rate')}
                            sx={{ width: 100 }}
                        />
                    )}
                    <TextField
                        select
                        size='small'
                        label='Supplied in'
                        value={draft.placeOfSupply}
                        onChange={set('placeOfSupply')}
                        helperText={
                            guestStateName ? `Guest’s state: ${guestStateName}` : 'Empty: the agency’s own state'
                        }
                        sx={{ minWidth: 220 }}
                    >
                        <MenuItem value=''>
                            <em>Guest’s state</em>
                        </MenuItem>
                        {states.map(state => (
                            <MenuItem key={state.code} value={state.code}>
                                {state.name}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        size='small'
                        label='Guest’s GSTIN (business)'
                        value={draft.customerGstin}
                        onChange={set('customerGstin')}
                        inputProps={{ maxLength: 15 }}
                        sx={{ minWidth: 200 }}
                    />
                    <TextField
                        size='small'
                        label='Billed to (company)'
                        value={draft.customerName}
                        onChange={set('customerName')}
                        sx={{ minWidth: 200 }}
                    />
                </Stack>
            </Collapse>
            {problem && (
                <Alert severity='error' sx={{ mt: 1.5 }}>
                    {problem}
                </Alert>
            )}
        </Box>
    )
}

QuoteGstControl.propTypes = {
    gst: PropTypes.shape({
        draft: PropTypes.shape({
            mode: PropTypes.string,
            rate: PropTypes.string,
            placeOfSupply: PropTypes.string,
            customerGstin: PropTypes.string,
            customerName: PropTypes.string
        }).isRequired,
        setDraft: PropTypes.func.isRequired,
        ready: PropTypes.bool,
        registered: PropTypes.bool,
        loading: PropTypes.bool,
        tax: PropTypes.shape({ rate: PropTypes.number }).isRequired,
        states: PropTypes.arrayOf(PropTypes.shape({ code: PropTypes.string, name: PropTypes.string })),
        guestStateName: PropTypes.string,
        interState: PropTypes.bool,
        problem: PropTypes.string
    }).isRequired,
    quotationNo: PropTypes.number.isRequired
}

export default QuoteGstControl
