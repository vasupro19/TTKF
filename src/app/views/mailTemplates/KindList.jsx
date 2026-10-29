import PropTypes from 'prop-types'
import { Box, Chip, List, ListItemButton, ListItemText, Typography } from '@mui/material'

/**
 * The kinds of email, grouped by who gets them. One is open at a time; a kind that has the agency's own words shows a
 * "Customised" chip.
 */
function KindList({ groups, activeKey, onSelect }) {
    return (
        <Box component='nav' aria-label='Kinds of email'>
            {groups.map(group => (
                <Box key={group.audience} sx={{ mb: 2.5 }}>
                    <Typography
                        id={`mail-group-${group.audience}`}
                        color='text.secondary'
                        sx={{
                            fontSize: '0.75rem',
                            letterSpacing: '0.08em',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            mb: 0.5
                        }}
                    >
                        {group.label}
                    </Typography>
                    <List dense disablePadding aria-labelledby={`mail-group-${group.audience}`}>
                        {group.kinds.map(kind => (
                            <ListItemButton
                                key={kind.key}
                                selected={kind.key === activeKey}
                                aria-current={kind.key === activeKey ? 'true' : undefined}
                                onClick={() => onSelect(kind.key)}
                                sx={{ borderRadius: 1.5, py: 0.75, gap: 1 }}
                            >
                                <ListItemText
                                    primary={kind.label}
                                    primaryTypographyProps={{ sx: { fontSize: '0.9375rem' } }}
                                />
                                {kind.customised ? (
                                    <Chip size='small' color='primary' variant='outlined' label='Customised' />
                                ) : null}
                            </ListItemButton>
                        ))}
                    </List>
                </Box>
            ))}
        </Box>
    )
}

KindList.propTypes = {
    groups: PropTypes.arrayOf(
        PropTypes.shape({
            audience: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            kinds: PropTypes.arrayOf(
                PropTypes.shape({
                    key: PropTypes.string.isRequired,
                    label: PropTypes.string,
                    customised: PropTypes.bool
                })
            ).isRequired
        })
    ).isRequired,
    activeKey: PropTypes.string,
    onSelect: PropTypes.func.isRequired
}

export default KindList
