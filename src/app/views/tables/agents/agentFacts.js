const toOptions = values => (values || []).filter(Boolean).map(value => ({ value, label: value }))

// ? the two dropdowns of the Agents list, built from the cities and states the agents really have
export const filtersFor = ({ cities, states } = {}) => [
    { key: 'city', label: 'City', options: toOptions(cities) },
    { key: 'state', label: 'State', options: toOptions(states) }
]
