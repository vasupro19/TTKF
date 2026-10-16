import { useState } from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import { useCreateInvoiceMutation, useGetBookingInvoicesQuery } from '@/app/store/slices/api/gstSlice'
import { InvoiceDialog, InvoiceStatusChip } from '@views/invoices/invoiceParts'
import { dayText, errorText, invoiceLine, kindLabel, money2 } from '@views/gst/gstFacts'
import { Section } from './bookingParts'

/** @description what the booking's price is made of, in a line: "Includes GST ₹1,000 (taxable value ₹20,000.00)" */
const priceLine = (booking, tax) => {
    if (!tax || !(Number(tax.gst) > 0)) return 'No GST is charged on this booking, so its invoice is a bill of supply.'
    return `The price of ${money2(booking.sellingPrice)} includes GST ${money2(tax.gst)} (taxable value ${money2(tax.taxable)}), so its invoice is a tax invoice.`
}

/**
 * The booking's invoice: issue it once the booking is confirmed (a tax invoice when the price holds GST, a bill of supply
 * when not), then open, download, email or — accounts and admins — cancel it. A cancelled invoice stays listed with its
 * number; the booking can then be invoiced again.
 */
function InvoicePanel({ booking, notify }) {
    const packageId = booking?.id
    const { data, error } = useGetBookingInvoicesQuery(packageId, { skip: !packageId, refetchOnMountOrArgChange: true })
    const [createInvoice, { isLoading: issuing }] = useCreateInvoiceMutation()
    const [confirming, setConfirming] = useState(false)
    const [billedTo, setBilledTo] = useState('')
    const [open, setOpen] = useState(null)

    if (!packageId) return null
    const invoices = data?.data || []
    const canCancel = Boolean(data?.summary?.canCancel)
    const live = invoices.find(invoice => invoice.status === 'ISSUED')

    const handleIssue = async () => {
        try {
            const response = await createInvoice({ packageId, customerName: billedTo.trim() || undefined }).unwrap()
            notify(response?.message || 'Invoice issued')
            setConfirming(false)
            setBilledTo('')
            if (response?.data) setOpen(response.data)
        } catch (failure) {
            notify(errorText(failure, 'Couldn’t issue the invoice.'), 'error')
        }
    }

    return (
        <Section
            id='invoice'
            title='Invoice'
            action={
                !live && (
                    <Button
                        variant='outlined'
                        size='small'
                        onClick={() => setConfirming(true)}
                        disabled={!booking.sellingPrice}
                    >
                        Issue invoice
                    </Button>
                )
            }
        >
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                {error && <Alert severity='error'>{errorText(error, 'Couldn’t load the invoices.')}</Alert>}
                {invoices.length === 0 && !error && (
                    <Typography color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
                        No invoice yet. {priceLine(booking, booking.tax)}
                    </Typography>
                )}
                <Stack spacing={1}>
                    {invoices.map(invoice => (
                        <Stack
                            key={invoice.id}
                            direction='row'
                            spacing={2}
                            alignItems='center'
                            justifyContent='space-between'
                            sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                                    {invoiceLine(invoice)}
                                </Typography>
                                <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                                    {kindLabel(invoice.kind)} · {dayText(invoice.invoiceDate)}
                                    {Number(invoice.gst) > 0 ? ` · includes GST ${money2(invoice.gst)}` : ''}
                                </Typography>
                            </Box>
                            <Stack direction='row' spacing={1} alignItems='center'>
                                <InvoiceStatusChip status={invoice.status} />
                                <Button size='small' onClick={() => setOpen(invoice)}>
                                    Open
                                </Button>
                            </Stack>
                        </Stack>
                    ))}
                </Stack>
            </Box>

            <Dialog open={confirming} onClose={() => setConfirming(false)} fullWidth maxWidth='xs'>
                <DialogTitle>Issue an invoice for this booking?</DialogTitle>
                <DialogContent>
                    <Typography color='text.secondary' sx={{ mb: 2, fontSize: '0.9375rem' }}>
                        {priceLine(booking, booking.tax)} It takes the next invoice number and can’t be edited — to
                        correct it, cancel it and issue another.
                    </Typography>
                    <TextField
                        fullWidth
                        label='Billed to (optional)'
                        value={billedTo}
                        onChange={event => setBilledTo(event.target.value)}
                        helperText='The guest’s name is used when this is empty'
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirming(false)}>Not now</Button>
                    <Button variant='contained' onClick={handleIssue} disabled={issuing}>
                        {issuing ? 'Issuing…' : 'Issue invoice'}
                    </Button>
                </DialogActions>
            </Dialog>

            <InvoiceDialog invoice={open} canCancel={canCancel} onClose={() => setOpen(null)} notify={notify} />
        </Section>
    )
}

InvoicePanel.propTypes = {
    booking: PropTypes.shape({
        id: PropTypes.number,
        sellingPrice: PropTypes.number,
        tax: PropTypes.shape({ gst: PropTypes.number, taxable: PropTypes.number })
    }),
    notify: PropTypes.func.isRequired
}

export default InvoicePanel
