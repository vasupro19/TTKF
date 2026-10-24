import PropTypes from 'prop-types'
import { TableCell } from '@mui/material'
import { styled } from '@mui/material/styles'
import { ContentCopy, DeleteOutline } from '@mui/icons-material'

/**
 * The boxes of the rate tables. The tables hold hundreds of them, and a full MUI text field is many elements and a style each,
 * which made the page open in seconds. These are the browser's own inputs with one shared style, so a row costs a few
 * elements and the page opens at once. They look like the rest of the screen's outlined boxes.
 */
const boxStyle = ({ theme }) => ({
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0,
    font: 'inherit',
    fontSize: '0.875rem',
    lineHeight: 1.5,
    padding: '7px 10px',
    color: theme.palette.text.primary,
    background: 'transparent',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    outline: 'none',
    '&::placeholder': { color: theme.palette.text.disabled, opacity: 1 },
    '&:hover': { borderColor: theme.palette.text.secondary },
    '&:focus': { borderColor: theme.palette.primary.main, boxShadow: `0 0 0 1px ${theme.palette.primary.main}` },
    '&[aria-invalid="true"]': { borderColor: theme.palette.error.main }
})

const Box = styled('input')(boxStyle)
const PickBox = styled('select')(boxStyle)
const Tick = styled('input')(({ theme }) => ({
    width: 16,
    height: 16,
    margin: '8px 0 0 10px',
    cursor: 'pointer',
    accentColor: theme.palette.primary.main
}))
const IconBtn = styled('button')(({ theme }) => ({
    border: 0,
    background: 'transparent',
    padding: 4,
    margin: 0,
    cursor: 'pointer',
    borderRadius: '50%',
    color: theme.palette.text.secondary,
    display: 'inline-flex',
    '&:hover': { background: theme.palette.action.hover }
}))
const DangerBtn = styled(IconBtn)(({ theme }) => ({ color: theme.palette.error.main }))

/** @description a table cell with the tables' padding */
export const RateCell = styled(TableCell)({ padding: '6px', verticalAlign: 'top' })

/** @description a text, date or amount box */
export function RateInput({ label, invalid, ...rest }) {
    // eslint-disable-next-line react/jsx-props-no-spreading -- the type, value and handlers go straight to the input
    return <Box aria-label={label} aria-invalid={invalid ? 'true' : undefined} {...rest} />
}
RateInput.propTypes = { label: PropTypes.string.isRequired, invalid: PropTypes.bool }
RateInput.defaultProps = { invalid: false }

/** @description a list of choices: `options` is [{ value, label }] */
export function RatePick({ label, options, ...rest }) {
    return (
        // eslint-disable-next-line react/jsx-props-no-spreading -- the value and handler go straight to the select
        <PickBox aria-label={label} {...rest}>
            {options.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </PickBox>
    )
}
RatePick.propTypes = {
    label: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })).isRequired
}

/** @description a tick box */
export function RateTick({ label, checked, onChange }) {
    return <Tick type='checkbox' aria-label={label} checked={checked} onChange={onChange} />
}
RateTick.propTypes = {
    label: PropTypes.string.isRequired,
    checked: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
}

/** @description the copy and remove buttons at the end of a row */
export function RowActions({ copyLabel, removeLabel, copyTitle, removeTitle, onCopy, onRemove }) {
    return (
        <>
            <IconBtn type='button' aria-label={copyLabel} title={copyTitle} onClick={onCopy}>
                <ContentCopy fontSize='small' />
            </IconBtn>
            <DangerBtn type='button' aria-label={removeLabel} title={removeTitle} onClick={onRemove}>
                <DeleteOutline fontSize='small' />
            </DangerBtn>
        </>
    )
}
RowActions.propTypes = {
    copyLabel: PropTypes.string.isRequired,
    removeLabel: PropTypes.string.isRequired,
    copyTitle: PropTypes.string.isRequired,
    removeTitle: PropTypes.string.isRequired,
    onCopy: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired
}
