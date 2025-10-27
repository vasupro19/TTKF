import React from 'react'
import { Paper, Box, Typography, Divider } from '@mui/material'
import { Checklist } from '@mui/icons-material'
import PropTypes from 'prop-types'

function NotesInstructions({ notes = [], customFontSize = '' }) {
    return (
        <Paper
            variant='outlined'
            sx={{
                padding: 2,
                backgroundColor: 'grey.bgLight',
                border: '1px solid',
                borderColor: 'grey.borderLight',
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px'
            }}
        >
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                    Instructions
                </Typography>
                <Checklist />
            </Box>
            <Divider
                sx={{
                    borderColor: '#ccc'
                }}
            />
            <Box
                component='ol'
                sx={{
                    pl: 2,
                    mt: 1,
                    '& *': {
                        // This applies a 12px font size to all child elements
                        fontSize: customFontSize ? `${customFontSize} !important` : '12px !important'
                    }
                }}
            >
                {notes.length > 0 ? (
                    notes.map(note => (
                        <Typography
                            component='li'
                            variant='body2'
                            gutterBottom
                            key={note.id} // Use unique identifier for the key
                        >
                            {note.text}
                        </Typography>
                    ))
                ) : (
                    <Typography variant='body2' color='textSecondary'>
                        No instructions available.
                    </Typography>
                )}
            </Box>
        </Paper>
    )
}

export default NotesInstructions
NotesInstructions.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    notes: PropTypes.array,
    customFontSize: PropTypes.string
}
