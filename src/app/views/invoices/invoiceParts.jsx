import { useState } from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import {
    useCancelInvoiceMutation,
    useDownloadInvoicePdfMutation,
    useEmailInvoiceMutation,
    useGetInvoicePreviewQuery
} from '@/app/store/slices/api/gstSlice'
import { downloadBlob, errorText, invoiceLine, invoiceStatus, safeFileName } from '../gst/gstFacts'

export function InvoiceStatusChip({ status }) {
    const info = invoiceStatus(status)
    return (
        <Chip
            size='small'
            color={info.color}
            variant={info.color === 'default' ? 'outlined' : 'filled'}
            label={info.label}
        />
    )
}

InvoiceStatusChip.propTypes = { status: PropTypes.string.isRequired }

/**
 * An invoice exactly as it will print, with what can be done to it: download the PDF, email it to the guest (the agent sees
 * where it goes first), and — for accounts and the agency's admin — cancel it, with a reason.
 */
export function InvoiceDialog({ invoice, canCancel, onClose, notify }) {
    const { data, isFetching, error } = useGetInvoicePreviewQuery(invoice?.id, {
        skip: !invoice,
        refetchOnMountOrArgChange: true
    })
    const [downloadPdf, { isLoading: downloading }] = useDownloadInvoicePdfMutation()
    const [emailInvoice, { isLoading: sending }] = useEmailInvoiceMutation()
    const [cancelInvoice, { isLoading: cancelling }] = useCancelInvoiceMutation()
    const [reason, setReason] = useState('')
    const [askingWhy, setCancelling] = useState(false)

    if (!invoice) return null
    const preview = data?.data
    const live = (preview?.invoice || invoice).status === 'ISSUED'

    const handleDownload = async () => {
        try {
            const blob = await downloadPdf(invoice.id).unwrap()
            downloadBlob(blob, `${safeFileName(invoice.number)}.pdf`)
        } catch (failure) {
            notify(errorText(failure, 'Couldn’t make the PDF.'), 'error')
        }
    }

    const handleEmail = async () => {
        try {
            const response = await emailInvoice({ id: invoice.id }).unwrap()
            notify(response?.message || 'Invoice sent')
        } catch (failure) {
            notify(errorText(failure, 'Couldn’t send the invoice.'), 'error')
        }
    }

    const handleCancel = async () => {
        try {
            const response = await cancelInvoice({ id: invoice.id, reason }).unwrap()
            notify(response?.message || 'Invoice cancelled')
            setCancelling(false)
            setReason('')
            onClose()
        } catch (failure) {
            notify(errorText(failure, 'Couldn’t cancel the invoice.'), 'error')
        }
    }

    return (
        <>
            <Dialog open onClose={onClose} fullWidth maxWidth='md' aria-labelledby='invoice-dialog-title'>
                <DialogTitle id='invoice-dialog-title'>
                    <Stack direction='row' spacing={1.5} alignItems='center'>
                        <span>{invoiceLine(invoice)}</span>
                        <InvoiceStatusChip status={(preview?.invoice || invoice).status} />
                    </Stack>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    {error && (
                        <Alert severity='error' sx={{ m: 2 }}>
                            {errorText(error, 'Couldn’t load the invoice.')}
                        </Alert>
                    )}
                    {isFetching && !preview && (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <CircularProgress size={28} />
                        </Box>
                    )}
                    {preview && (
                        <>
                            <Typography color='text.secondary' sx={{ px: 2, py: 1, fontSize: '0.875rem' }}>
                                {live
                                    ? `Emailing sends the PDF to ${preview.to || 'no address — the guest has no email on file'}${
                                          preview.from ? `, from ${preview.from}` : ''
                                      }.`
                                    : 'A cancelled invoice keeps its number and can’t be sent.'}
                            </Typography>
                            <iframe
                                title={`Invoice ${invoice.number}`}
                                srcDoc={preview.html}
                                style={{ width: '100%', height: '65vh', border: 'none' }}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 1.5 }}>
                    {canCancel && live && (
                        <Button color='error' onClick={() => setCancelling(true)} sx={{ mr: 'auto' }}>
                            Cancel invoice
                        </Button>
                    )}
                    <Button onClick={onClose}>Close</Button>
                    <Button onClick={handleDownload} disabled={downloading}>
                        {downloading ? 'Making PDF…' : 'Download PDF'}
                    </Button>
                    {live && (
                        <Button variant='contained' onClick={handleEmail} disabled={sending || !preview?.to}>
                            {sending ? 'Sending…' : 'Email to guest'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <Dialog open={askingWhy} onClose={() => setCancelling(false)} fullWidth maxWidth='xs'>
                <DialogTitle>Cancel {invoice.number}?</DialogTitle>
                <DialogContent>
                    <Typography color='text.secondary' sx={{ mb: 2, fontSize: '0.9375rem' }}>
                        The invoice keeps its number and stays on record as cancelled. You can then issue a new one for
                        the booking, which takes the next number.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        label='Why is it being cancelled?'
                        value={reason}
                        onChange={event => setReason(event.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelling(false)}>Keep it</Button>
                    <Button
                        color='error'
                        variant='contained'
                        onClick={handleCancel}
                        disabled={cancelling || !reason.trim()}
                    >
                        {cancelling ? 'Cancelling…' : 'Cancel invoice'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

InvoiceDialog.propTypes = {
    invoice: PropTypes.shape({ id: PropTypes.number, number: PropTypes.string, status: PropTypes.string }),
    canCancel: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    notify: PropTypes.func.isRequired
}
