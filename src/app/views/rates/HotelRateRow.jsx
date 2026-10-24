import { memo } from 'react'
import PropTypes from 'prop-types'
import { TableRow } from '@mui/material'
import { AMOUNT_FIELDS, CATEGORY_OPTIONS } from './rateFacts'
import { RateCell, RateInput, RatePick, RateTick, RowActions } from './rateFields'

const onlyAmount = value => value.replace(/[^0-9.,]/g, '')

/**
 * One row of the hotel rates. It is its own memoized component made of light boxes (see rateFields.jsx), because the table
 * holds hundreds of them: only the row being typed in draws again, and the page opens at once. The place suggestions are the
 * `<datalist>` named by `listId`.
 */
function HotelRateRow({ row, number, flagged, listId, onChange, onCopy, onRemove }) {
    return (
        <TableRow hover>
            <RateCell>
                <RateInput
                    label={`Place, row ${number}`}
                    placeholder='Place'
                    list={listId}
                    autoComplete='off'
                    value={row.place}
                    invalid={flagged && !row.place.trim()}
                    onChange={event => onChange(row.key, 'place', event.target.value)}
                />
            </RateCell>
            <RateCell>
                <RatePick
                    label={`Category, row ${number}`}
                    options={CATEGORY_OPTIONS}
                    value={row.category}
                    onChange={event => onChange(row.key, 'category', event.target.value)}
                />
            </RateCell>
            <RateCell>
                <RateInput
                    label={`Season, row ${number}`}
                    placeholder='Standard'
                    maxLength={60}
                    value={row.season}
                    onChange={event => onChange(row.key, 'season', event.target.value)}
                />
            </RateCell>
            {['validFrom', 'validTo'].map(field => (
                <RateCell key={field}>
                    <RateInput
                        type='date'
                        label={`${field === 'validFrom' ? 'From' : 'To'}, row ${number}`}
                        value={row[field]}
                        onChange={event => onChange(row.key, field, event.target.value)}
                    />
                </RateCell>
            ))}
            <RateCell>
                <RateTick
                    label={`Every year, row ${number}`}
                    checked={Boolean(row.repeatsYearly)}
                    onChange={event => onChange(row.key, 'repeatsYearly', event.target.checked)}
                />
            </RateCell>
            {AMOUNT_FIELDS.map(([field, label]) => (
                <RateCell key={field}>
                    <RateInput
                        inputMode='decimal'
                        label={`${label}, row ${number}`}
                        value={row[field]}
                        onChange={event => onChange(row.key, field, onlyAmount(event.target.value))}
                    />
                </RateCell>
            ))}
            <RateCell sx={{ whiteSpace: 'nowrap' }}>
                <RowActions
                    copyLabel={`Copy row ${number}`}
                    removeLabel={`Remove row ${number}`}
                    copyTitle='Copy this row (to add a season or another category)'
                    removeTitle='Remove this row'
                    onCopy={() => onCopy(row)}
                    onRemove={() => onRemove(row)}
                />
            </RateCell>
        </TableRow>
    )
}

HotelRateRow.propTypes = {
    row: PropTypes.shape({
        key: PropTypes.string,
        place: PropTypes.string,
        category: PropTypes.string,
        season: PropTypes.string,
        validFrom: PropTypes.string,
        validTo: PropTypes.string,
        repeatsYearly: PropTypes.bool
    }).isRequired,
    number: PropTypes.number.isRequired,
    flagged: PropTypes.bool.isRequired,
    listId: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onCopy: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired
}

export default memo(HotelRateRow)
