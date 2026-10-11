import PropTypes from 'prop-types'
import { MenuItem, TextField } from '@mui/material'
import { useGetAssigneesQuery } from '@/app/store/slices/api/leadSlice'

/** @description the people GET /leads/assignees returned, as an array (whatever the reply looked like) */
const assigneesOf = data => (Array.isArray(data?.data) ? data.data : [])

/**
 * One person's leads or bookings, for those who can see everyone's: a select of the agency's users with "Everyone"
 * first. Shown only when the server returns more than one person (a salesperson only ever gets themselves back), or
 * when `show` says so (the dashboard knows from its own reply).
 */
function AssigneeFilter({ label = 'Assigned to', value = '', onChange, show, width = 190 }) {
    const { data } = useGetAssigneesQuery()
    const people = assigneesOf(data)
    const visible = show === undefined ? people.length > 1 : show && people.length > 0
    if (!visible) return null
    const chosen = people.some(person => String(person.id) === String(value)) ? String(value) : ''
    return (
        <TextField
            select
            size='small'
            label={label}
            value={chosen}
            onChange={event => onChange(event.target.value)}
            SelectProps={{ displayEmpty: true }}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', md: width }, '& .MuiInputBase-root': { height: 34 } }}
            inputProps={{ 'aria-label': label }}
        >
            <MenuItem value=''>Everyone</MenuItem>
            {people.map(person => (
                <MenuItem key={person.id} value={String(person.id)}>
                    {person.name}
                    {person.isMe ? ' (me)' : ''}
                </MenuItem>
            ))}
        </TextField>
    )
}

AssigneeFilter.propTypes = {
    label: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func.isRequired,
    show: PropTypes.bool,
    width: PropTypes.number
}

export default AssigneeFilter
