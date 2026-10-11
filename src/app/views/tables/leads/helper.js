// ? each cell is drawn by the leads screen (see displayRow in ./index.jsx); keys are its display fields, and none is
// ? searchable per column — the search box above the table looks in name, phone and email
const column = (id, label, key, minWidth, maxWidth, extra = {}) => ({
    id,
    label,
    key,
    search: false,
    sort: false,
    stick: false,
    visible: true,
    minWidth,
    maxWidth,
    align: 'left',
    ...extra
})

export const headers = [
    column(1, 'Lead', 'leadCell', 13, 18, { stick: true }),
    column(2, 'Contact', 'contactCell', 12, 16),
    column(3, 'Trip', 'tripCell', 9, 14),
    column(4, 'Step', 'stepCell', 11, 14),
    column(5, 'Follow-up', 'followUpCell', 7, 9),
    column(6, 'Assigned to', 'assignedCell', 7, 10),
    column(7, 'Received', 'receivedCell', 7, 9)
]

export default headers
