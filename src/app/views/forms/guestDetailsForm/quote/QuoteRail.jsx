import PropTypes from 'prop-types'
import { Box, Button, Stack, Typography } from '@mui/material'
import { CheckCircle, PictureAsPdf, RadioButtonUnchecked, Visibility, VisibilityOff } from '@mui/icons-material'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'

const card = { border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }

const label = { fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.04em', mb: 0.5 }

/**
 * The right-hand column of a quotation: send it first (with what is still missing), then book it.
 */
export default function QuoteRail({
    quoteNo,
    checklist,
    sentText,
    openedNote = null,
    canSend,
    onPreview,
    onDownloadPdf,
    onWhatsApp,
    bookingNote,
    convertLabel,
    onConvert
}) {
    const missing = checklist.filter(item => !item.done)
    return (
        <Stack spacing={2}>
            <Box component='section' aria-labelledby='quote-send' sx={{ ...card, borderColor: 'primary.main' }}>
                <Typography sx={label}>STEP 1 · SEND</Typography>
                <Typography id='quote-send' component='h2' sx={{ fontSize: '1.0625rem', fontWeight: 600 }}>
                    Send Quote {quoteNo} to the guest
                </Typography>
                <Box component='ul' sx={{ listStyle: 'none', m: 0, mt: 1.25, p: 0 }}>
                    {checklist.map(item => (
                        <Stack component='li' key={item.key} direction='row' spacing={0.75} alignItems='center'>
                            {item.done ? (
                                <CheckCircle sx={{ fontSize: 17, color: 'success.main' }} />
                            ) : (
                                <RadioButtonUnchecked sx={{ fontSize: 17, color: 'text.disabled' }} />
                            )}
                            <Typography
                                sx={{ fontSize: '0.875rem', color: item.done ? 'text.primary' : 'text.secondary' }}
                            >
                                {item.label}
                                {item.done ? null : (
                                    <Box component='span' sx={{ color: '#b45309', fontWeight: 500 }}>
                                        {' '}
                                        — {item.fix.toLowerCase()}
                                    </Box>
                                )}
                            </Typography>
                        </Stack>
                    ))}
                </Box>
                <Button
                    fullWidth
                    variant='contained'
                    startIcon={<Visibility />}
                    onClick={onPreview}
                    disabled={!canSend}
                    sx={{ mt: 2 }}
                >
                    Preview and email
                </Button>
                <Stack direction='row' spacing={1} sx={{ mt: 1 }}>
                    <Button
                        fullWidth
                        variant='outlined'
                        size='small'
                        sx={{ whiteSpace: 'nowrap' }}
                        startIcon={<PictureAsPdf />}
                        onClick={onDownloadPdf}
                        disabled={!canSend}
                    >
                        Download PDF
                    </Button>
                    <Button
                        fullWidth
                        variant='outlined'
                        size='small'
                        sx={{ whiteSpace: 'nowrap' }}
                        startIcon={<WhatsAppIcon sx={{ color: '#25D366' }} />}
                        onClick={onWhatsApp}
                        disabled={!canSend}
                    >
                        WhatsApp
                    </Button>
                </Stack>
                <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mt: 1.5 }}>
                    {canSend && missing.length ? 'You can send now, but check the items above. ' : ''}
                    {sentText}
                </Typography>
                {openedNote?.show ? (
                    <Stack
                        direction='row'
                        spacing={0.75}
                        alignItems='flex-start'
                        sx={{
                            mt: 1,
                            p: 1,
                            borderRadius: 1.5,
                            bgcolor: openedNote.viewed ? 'success.lighter' : 'action.hover'
                        }}
                    >
                        {openedNote.viewed ? (
                            <Visibility sx={{ fontSize: 17, color: 'success.dark', mt: '2px' }} />
                        ) : (
                            <VisibilityOff sx={{ fontSize: 17, color: 'text.disabled', mt: '2px' }} />
                        )}
                        <Typography
                            sx={{
                                fontSize: '0.8125rem',
                                fontWeight: openedNote.viewed ? 600 : 400,
                                color: openedNote.viewed ? 'success.dark' : 'text.secondary'
                            }}
                        >
                            {openedNote.text}
                        </Typography>
                    </Stack>
                ) : null}
            </Box>

            <Box component='section' aria-labelledby='quote-booking' sx={card}>
                <Typography sx={label}>STEP 2 · BOOK</Typography>
                <Typography id='quote-booking' component='h2' sx={{ fontSize: '1.0625rem', fontWeight: 600, mb: 0.75 }}>
                    Booking
                </Typography>
                {bookingNote}
                <Button fullWidth variant='outlined' onClick={onConvert} disabled={!canSend} sx={{ mt: 1.5 }}>
                    {convertLabel}
                </Button>
            </Box>
        </Stack>
    )
}

QuoteRail.propTypes = {
    quoteNo: PropTypes.number.isRequired,
    checklist: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string,
            label: PropTypes.string,
            done: PropTypes.bool,
            fix: PropTypes.string
        })
    ).isRequired,
    sentText: PropTypes.string.isRequired,
    openedNote: PropTypes.shape({ show: PropTypes.bool, viewed: PropTypes.bool, text: PropTypes.string }),
    canSend: PropTypes.bool.isRequired,
    onPreview: PropTypes.func.isRequired,
    onDownloadPdf: PropTypes.func.isRequired,
    onWhatsApp: PropTypes.func.isRequired,
    bookingNote: PropTypes.node.isRequired,
    convertLabel: PropTypes.string.isRequired,
    onConvert: PropTypes.func.isRequired
}
