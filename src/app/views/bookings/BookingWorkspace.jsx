import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Box, Button, Checkbox, CircularProgress, FormControlLabel, Stack, Typography } from '@mui/material'
import { Add, ArrowBack } from '@mui/icons-material'
import MainCard from '@core/components/extended/MainCard'
import AssignmentModal from '@/core/components/modals/AssignmentModal'
import GuestPaymentModal from '@/core/components/modals/GuestPaymentModal'
import SupplierPaymentModal from '@/core/components/modals/SupplierPaymentModal'
import {
    getConfirmedVoucherPreview,
    getGuestReceiptPreview,
    getGuestServicePreview,
    getSupplierEmailPreview,
    useAddGuestPaymentMutation,
    useAddServiceToPackageMutation,
    useDeleteServiceMutation,
    useDownloadConfirmedVoucherPdfMutation,
    useGetGuestPaymentHistoryQuery,
    useGetPackageByLeadIdQuery,
    useGetServicesByPackageQuery,
    useSendGuestHotelConfirmationEmailMutation,
    useSendGuestReceiptMutation,
    useSendGuestTaxiConfirmationEmailMutation,
    useSendSupplierEmailMutation,
    useSendVoucherEmailMutation
} from '@/app/store/slices/api/packageConvert'
import { usePaySupplierMutation } from '@/app/store/slices/api/confirmedService'
import { useGetLeadByIdQuery } from '@/app/store/slices/api/leadSlice'
import { useGetGuestByIdQuery } from '@/app/store/slices/api/guestSlice'
import { useGetGuestTourByIdQuery } from '@/app/store/slices/api/guestTourSlice'
import { openSnackbar } from '@app/store/slices/snackbar'
import {
    STEPS,
    amount,
    categoryLabel,
    dateRange,
    doneCount,
    emailOutcome,
    guestMoney,
    nextStep,
    progressOf,
    rupees,
    supplierHasBooking,
    supplierMoney,
    urgency
} from './bookingFacts'
import { EmailNote, EmailPreview, MoneyCard, PaymentRow, Section, ServiceRow, StepsBar } from './bookingParts'

const listOf = response => (Array.isArray(response?.data) ? response.data : [])

const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
}

const errorText = (error, fallback) => error?.data?.message || error?.message || fallback

// ? the dialog's title for an email to a supplier, by the kind the server settled on
const SUPPLIER_TITLE = { request: 'Booking request to', amendment: 'Amendment to', cancellation: 'Cancellation to' }

/**
 * One confirmed booking, everything in one place and in the order it gets done: hotels, transport, the
 * guest's payments, paying suppliers, and sending the voucher. The next thing to do is always at the top.
 */
function BookingWorkspace() {
    const { leadId } = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const notify = (message, color = 'success') =>
        dispatch(
            openSnackbar({
                open: true,
                message,
                variant: 'alert',
                alert: { color },
                anchorOrigin: { vertical: 'top', horizontal: 'right' }
            })
        )

    const fresh = { refetchOnMountOrArgChange: true }
    const bookingQuery = useGetPackageByLeadIdQuery(leadId, fresh)
    const booking = bookingQuery.data?.data || null
    const packageId = booking?.id
    const hotelsQuery = useGetServicesByPackageQuery({ packageId, type: 'Hotel' }, { ...fresh, skip: !packageId })
    const taxisQuery = useGetServicesByPackageQuery({ packageId, type: 'Taxi' }, { ...fresh, skip: !packageId })
    const paymentsQuery = useGetGuestPaymentHistoryQuery(packageId, { ...fresh, skip: !packageId })
    const { data: leadData } = useGetLeadByIdQuery(leadId)
    const { data: guestData } = useGetGuestByIdQuery(leadId)
    const { data: tourData } = useGetGuestTourByIdQuery(leadId, fresh)

    const [addService, { isLoading: savingService }] = useAddServiceToPackageMutation()
    const [deleteService] = useDeleteServiceMutation()
    const [sendSupplierEmail] = useSendSupplierEmailMutation()
    const [sendGuestReceipt] = useSendGuestReceiptMutation()
    const [addGuestPayment, { isLoading: savingGuestPayment }] = useAddGuestPaymentMutation()
    const [paySupplier, { isLoading: savingSupplierPayment }] = usePaySupplierMutation()
    const [sendVoucherEmail] = useSendVoucherEmailMutation()
    const [sendHotelEmail] = useSendGuestHotelConfirmationEmailMutation()
    const [sendTaxiEmail] = useSendGuestTaxiConfirmationEmailMutation()
    const [downloadPdf] = useDownloadConfirmedVoucherPdfMutation()

    const [serviceForm, setServiceForm] = useState({ open: false, type: 'Hotel', row: null })
    const [guestPaymentOpen, setGuestPaymentState] = useState(false)
    // ? one key for every try of one payment: the API records it once even if the reply is slow and it is sent again
    const [paymentKey, setPaymentKey] = useState('')
    const setGuestPaymentOpen = open => {
        if (open)
            setPaymentKey(globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`)
        setGuestPaymentState(open)
    }
    const [supplierPayment, setSupplierPayment] = useState(null)
    const [busy, setBusy] = useState('')
    /**
     * The email being checked before it is sent. Nothing on this page emails anyone without the agent seeing it
     * first. `send` says what it is:
     *   { kind: 'voucher' }
     *   { kind: 'supplier', id, emailKind: 'request' | 'amendment' | 'cancellation', previous, name, paid }
     *   { kind: 'receipt', paymentId }
     *   { kind: 'guestService', type: 'Hotel' | 'Taxi' }
     * `next` is the email to show once this one is sent or skipped (after a supplier change: the cancellation to the
     * supplier who still holds the booking).
     */
    const closedMail = {
        open: false,
        loading: false,
        send: null,
        next: null,
        title: '',
        to: '',
        subject: '',
        html: '',
        note: '',
        from: '',
        fromNote: '',
        remove: false
    }
    const [mail, setMail] = useState(closedMail)
    const lead = leadData?.data || {}
    const guest = guestData?.data || {}
    const guestName = lead.fullName || 'Guest'
    const hotels = listOf(hotelsQuery.data)
    const taxis = listOf(taxisQuery.data)
    const services = [...hotels, ...taxis]
    const payments = listOf(paymentsQuery.data)
    // ? only the quote that was booked — a lead can hold several
    const bookedQuote = Number(booking?.quotationNo) || 1
    const bookedDays = listOf(tourData)
        .filter(day => (Number(day.quoteNo) || 1) === bookedQuote)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const progress = progressOf({ booking, services })
    const step = nextStep(progress)
    const money = guestMoney(booking)
    const suppliers = supplierMoney(services)
    const margin = money.price - suppliers.cost - amount(booking?.otherCosts)
    const soon = urgency(guest.pickupDate, !step)

    const refresh = () => {
        bookingQuery.refetch()
        if (packageId) {
            hotelsQuery.refetch()
            taxisQuery.refetch()
            paymentsQuery.refetch()
        }
    }

    const run = async (key, task, success, failure) => {
        setBusy(key)
        try {
            const response = await task()
            notify(response?.message || success)
            refresh()
            // ? emails are queued: look again once they have had time to go
            setTimeout(refresh, 8000)
            return true
        } catch (error) {
            notify(errorText(error, failure), 'error')
            return false
        } finally {
            setBusy('')
        }
    }

    // ? a new hotel or transport starts from the guest's trip details
    const serviceDefaults = type =>
        type === 'Hotel'
            ? {
                  quantity: guest.rooms ? String(guest.rooms) : '',
                  roomType: guest.packageType || '',
                  details: {
                      mealPlan: guest.foodPlan || '',
                      extraBeds: Number(guest.extraBedding) > 0 ? String(guest.extraBedding) : ''
                  }
              }
            : {
                  quantity: '1',
                  startDate: guest.pickupDate ? new Date(guest.pickupDate).toISOString().split('T')[0] : '',
                  endDate: guest.dropDate ? new Date(guest.dropDate).toISOString().split('T')[0] : '',
                  details: {
                      vehicleType: guest.taxiType && guest.taxiType !== 'None' ? guest.taxiType : '',
                      pickupPoint: guest.pickupLocation || '',
                      dropPoint: guest.dropLocation || ''
                  }
              }

    const openServiceForm = (type, row = null) =>
        setServiceForm({
            open: true,
            type,
            row: row ? { ...row, guestName } : { guestName, defaults: serviceDefaults(type) }
        })

    const PREVIEWS = {
        voucher: () => getConfirmedVoucherPreview.initiate(packageId, { forceRefetch: true }),
        supplier: send =>
            getSupplierEmailPreview.initiate(
                { id: send.id, kind: send.emailKind, previous: send.previous },
                { forceRefetch: true }
            ),
        receipt: send => getGuestReceiptPreview.initiate(send.paymentId, { forceRefetch: true }),
        guestService: send =>
            getGuestServicePreview.initiate(
                { packageId, kind: send.type === 'Hotel' ? 'hotel' : 'taxi' },
                { forceRefetch: true }
            )
    }

    const titleOf = (send, kind = send.emailKind, name = send.name) =>
        ({
            voucher: 'Booking voucher',
            supplier: `${SUPPLIER_TITLE[kind] || SUPPLIER_TITLE.request} ${name || 'the supplier'}`,
            receipt: 'Payment receipt',
            guestService: send.type === 'Hotel' ? 'Hotel details for the guest' : 'Transport details for the guest'
        })[send.kind]

    // ? loads the preview of `send` and shows it; `next` follows once it is sent or skipped
    const openMail = async (send, next = null) => {
        setMail({
            ...closedMail,
            open: true,
            loading: true,
            send,
            next,
            title: titleOf(send),
            to: send.kind === 'voucher' ? lead.senderEmail || '' : '',
            remove: Boolean(send.remove)
        })
        const { data, error } = await dispatch(PREVIEWS[send.kind](send))
        if (error) {
            setMail(closedMail)
            notify(errorText(error, 'Couldn’t prepare the email.'), 'error')
            if (next) openMail(next)
            return
        }
        const email = data?.data || {}
        let settled = send
        let followUp = next
        let note = ''
        if (send.kind === 'supplier') {
            // ? the server settles the kind: an "amendment" to a supplier who never had the booking is a request
            settled = { ...send, emailKind: email.kind || send.emailKind, name: email.name || send.name }
            const nothingChanged =
                settled.emailKind === 'amendment' && Array.isArray(email.changes) && !email.changes.length
            if (nothingChanged) {
                setMail(closedMail)
                notify(`Nothing ${settled.name || 'the supplier'} was told has changed, so no amendment is needed.`)
                if (next) openMail(next)
                return
            }
            if (settled.emailKind === 'amendment' && email.changes?.length)
                note = `Changed: ${email.changes.map(change => change.label).join(', ')}.`
            if (email.switchedFrom) {
                note = `You changed the supplier. ${email.switchedFrom.name} still has this booking — you can send them a cancellation next.`
                followUp = {
                    kind: 'supplier',
                    id: send.id,
                    emailKind: 'cancellation',
                    previous: true,
                    name: email.switchedFrom.name
                }
            }
        }
        setMail(current => ({
            ...current,
            loading: false,
            send: settled,
            next: followUp,
            title: titleOf(settled),
            note,
            to: email.to || current.to || '',
            subject: email.subject || '',
            html: email.html || '',
            // ? who it goes from — the user's own mailbox for a guest, the supplier mailbox for a supplier
            from: email.from || '',
            fromNote: email.fromNote || ''
        }))
    }

    const openPreview = () => openMail({ kind: 'voucher' })

    // ? a booking request, an amendment or a cancellation to the supplier of one hotel or transport line
    const openSupplierEmail = (service, emailKind = 'request', options = {}) =>
        openMail({
            kind: 'supplier',
            id: service.id,
            emailKind,
            name: service.supplier?.businessname || 'the supplier',
            paid: amount(service.paidAmount),
            ...options
        })

    // ? done with this email (sent or skipped): show the next one, if there is one
    const closeMail = () => {
        const { next } = mail
        setMail(current => ({ ...current, open: false }))
        if (next) openMail(next)
    }

    const sendMail = async () => {
        const { send } = mail
        const tasks = {
            voucher: () => sendVoucherEmail(packageId).unwrap(),
            supplier: () =>
                sendSupplierEmail({
                    id: send.id,
                    kind: send.emailKind,
                    previous: Boolean(send.previous),
                    remove: send.emailKind === 'cancellation' && !send.previous && mail.remove
                }).unwrap(),
            receipt: () => sendGuestReceipt(send.paymentId).unwrap(),
            guestService: () => (send.type === 'Hotel' ? sendHotelEmail : sendTaxiEmail)(packageId).unwrap()
        }
        const ok = await run('mail', tasks[send.kind], 'Email sent', 'Couldn’t send the email.')
        if (ok) closeMail()
    }

    const saveService = async formData => {
        // ? the line as it was: if its supplier has the booking, they hear about the change (previewed first)
        const edited = formData.id ? services.find(service => service.id === formData.id) || serviceForm.row : null
        const ok = await run(
            'service',
            () =>
                addService({
                    ...formData,
                    type: formData.type || serviceForm.type,
                    packageId,
                    cost: parseFloat(formData.cost || 0),
                    paidAmount: parseFloat(formData.paidAmount || 0),
                    quantity: formData.quantity ? parseInt(formData.quantity, 10) : null
                }).unwrap(),
            formData.id ? 'Booking updated' : `${serviceForm.type === 'Hotel' ? 'Hotel' : 'Transport'} added`,
            'Couldn’t save it.'
        )
        if (!ok) return
        setServiceForm(current => ({ ...current, open: false }))
        if (edited && supplierHasBooking(edited)) openSupplierEmail(edited, 'amendment')
    }

    // ? the receipt is not sent by itself: once the payment is saved, the agent sees it and sends it
    const saveGuestPayment = async formData => {
        setBusy('guest-payment')
        try {
            const response = await addGuestPayment({ packageId, ...formData, idempotencyKey: paymentKey }).unwrap()
            setGuestPaymentOpen(false)
            refresh()
            const { paymentId, guestEmail } = response?.data || {}
            if (paymentId && guestEmail) {
                notify('Payment recorded. Check the receipt, then send it to the guest.')
                openMail({ kind: 'receipt', paymentId })
            } else {
                notify(
                    paymentId
                        ? 'Payment recorded. The guest has no email address, so no receipt can be sent.'
                        : response?.message || 'Payment recorded'
                )
            }
        } catch (error) {
            notify(errorText(error, 'Couldn’t record the payment.'), 'error')
        } finally {
            setBusy('')
        }
    }

    const saveSupplierPayment = async formData => {
        const service = supplierPayment
        const ok = await run(
            'supplier-payment',
            () =>
                paySupplier({
                    confirmedServiceId: service.id,
                    amount: parseFloat(formData.amount),
                    method: formData.paymentMethod,
                    transactionId: formData.transactionId,
                    paymentDate: formData.paymentDate,
                    remarks: formData.remarks || `Payment for ${service.type} - ${guestName}`
                }).unwrap(),
            'Supplier payment recorded',
            'Couldn’t record the supplier payment.'
        )
        if (ok) setSupplierPayment(null)
    }

    // ? the voucher's state: sent (and when), or the reason its last email did not go
    const voucherEmail = emailOutcome(booking?.emails?.voucher)
    let voucherStatus = progress.voucher ? 'Sent' : 'Not sent yet'
    if (voucherEmail) voucherStatus = voucherEmail.text
    let voucherColor = progress.voucher ? 'success.main' : 'text.secondary'
    if (voucherEmail?.failed) voucherColor = 'error.main'

    let mailSendLabel = 'Send'
    if (mail.to) mailSendLabel = `Send to ${mail.to}`
    else if (mail.send && mail.send.kind !== 'supplier') mailSendLabel = 'No guest email on this lead'

    // ? a cancellation can also take the line off the booking — not while payments to the supplier are recorded
    const cancelling = mail.send?.kind === 'supplier' && mail.send.emailKind === 'cancellation' && !mail.send.previous
    const removeOption = cancelling ? (
        <Box>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={mail.remove && !mail.send.paid}
                        disabled={Boolean(mail.send.paid)}
                        onChange={event => setMail(current => ({ ...current, remove: event.target.checked }))}
                    />
                }
                label={`Also remove ${mail.send.name} from this booking`}
            />
            {mail.send.paid ? (
                <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mt: -0.5 }}>
                    Payments to {mail.send.name} are recorded, so it stays on the booking.
                </Typography>
            ) : null}
        </Box>
    ) : null

    const doNext = () => {
        if (!step) return
        if (step.key === 'hotel') openServiceForm('Hotel')
        if (step.key === 'taxi') openServiceForm('Taxi')
        if (step.key === 'guestPaid') setGuestPaymentOpen(true)
        if (step.key === 'suppliersPaid') {
            const unpaid = services.find(service => service.paymentStatus !== 'Fully Paid')
            if (unpaid) setSupplierPayment(unpaid)
        }
        if (step.key === 'voucher') openPreview()
    }

    if (bookingQuery.isLoading) {
        return (
            <MainCard sx={{ py: 2 }}>
                <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={28} />
                </Box>
            </MainCard>
        )
    }

    if (!booking) {
        return (
            <MainCard sx={{ py: 2 }} contentSX={{ px: { xs: 2, sm: 3 } }}>
                <Typography sx={{ mb: 2 }}>This lead has no confirmed booking yet.</Typography>
                <Button startIcon={<ArrowBack />} onClick={() => navigate('/process/packages')}>
                    All bookings
                </Button>
            </MainCard>
        )
    }

    const tripLine = [
        dateRange(guest.pickupDate, guest.dropDate),
        [
            amount(guest.adults) ? `${guest.adults} adult${amount(guest.adults) === 1 ? '' : 's'}` : '',
            amount(guest.children) ? `${guest.children} child${amount(guest.children) === 1 ? '' : 'ren'}` : ''
        ]
            .filter(Boolean)
            .join(', '),
        categoryLabel(booking.selectedPackage),
        booking.quotationNo ? `Quote ${booking.quotationNo}` : '',
        lead.phone,
        lead.senderEmail
    ].filter(Boolean)

    const serviceList = (type, list) => {
        const label = type === 'Hotel' ? 'hotel' : 'transport'
        return (
            <Section
                id={type === 'Hotel' ? 'hotels' : 'transport'}
                title={type === 'Hotel' ? 'Hotels' : 'Transport'}
                action={
                    <Button startIcon={<Add />} onClick={() => openServiceForm(type)}>
                        Add {label}
                    </Button>
                }
            >
                {list.length ? (
                    <Box component='ul' sx={{ m: 0, p: 0 }}>
                        {list.map(service => (
                            <ServiceRow
                                key={service.id}
                                service={service}
                                emailing={busy === 'mail' && mail.send?.id === service.id}
                                onPay={setSupplierPayment}
                                onEmail={item => openSupplierEmail(item)}
                                onCancel={(item, remove) => openSupplierEmail(item, 'cancellation', { remove })}
                                onEdit={item => openServiceForm(type, item)}
                                onRemove={item =>
                                    run(
                                        `remove-${item.id}`,
                                        () => deleteService(item.id).unwrap(),
                                        'Removed from the booking',
                                        'Couldn’t remove it.'
                                    )
                                }
                            />
                        ))}
                    </Box>
                ) : (
                    <Typography
                        color='text.secondary'
                        sx={{ fontSize: '0.9375rem', borderTop: '1px solid', borderColor: 'divider', pt: 2 }}
                    >
                        No {label} booked yet.
                    </Typography>
                )}
            </Section>
        )
    }

    return (
        <MainCard sx={{ py: 2 }} contentSX={{ px: { xs: 2, sm: 3 }, py: 2 }}>
            <Box sx={{ maxWidth: 960, '& .MuiButton-root': { textTransform: 'none' } }}>
                <Button startIcon={<ArrowBack />} onClick={() => navigate('/process/packages')} sx={{ ml: -1, mb: 2 }}>
                    All bookings
                </Button>
                <Typography
                    color='text.secondary'
                    sx={{ fontSize: '0.8125rem', letterSpacing: '0.08em', fontWeight: 600 }}
                >
                    BOOKING{booking?.bookingNo ? ` · ${booking.bookingNo}` : ''}
                </Typography>
                <Typography component='h1' sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 600, mt: 0.5 }}>
                    {guestName}
                </Typography>
                <Stack
                    direction='row'
                    spacing={1}
                    alignItems='baseline'
                    flexWrap='wrap'
                    useFlexGap
                    sx={{ mt: 0.5, mb: 3 }}
                >
                    <Typography color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
                        {tripLine.join(' · ')}
                    </Typography>
                </Stack>

                <Box
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: { xs: 2, sm: 2.5 }, mb: 3 }}
                >
                    <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', fontWeight: 600, mb: 1.5 }}>
                        {doneCount(progress)} of {STEPS.length} done
                    </Typography>
                    <StepsBar progress={progress} />
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.5}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        justifyContent='space-between'
                        sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
                    >
                        <Box>
                            <Typography
                                sx={{
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    color: step ? 'text.primary' : 'success.main'
                                }}
                            >
                                {step ? `Next: ${step.next}` : 'Everything is done — ready to travel.'}
                            </Typography>
                            {soon ? (
                                <Typography sx={{ fontSize: '0.875rem', color: 'error.main', fontWeight: 600 }}>
                                    The guest {soon}.
                                </Typography>
                            ) : null}
                        </Box>
                        {step ? (
                            <Button variant='contained' onClick={doNext}>
                                {step.next}
                            </Button>
                        ) : null}
                    </Stack>
                </Box>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 5 }}>
                    <MoneyCard
                        title='From the guest'
                        lines={[
                            ['Package price', rupees(money.price)],
                            ['Received', rupees(money.received)],
                            ['Balance', rupees(money.balance), true]
                        ]}
                        action={
                            money.balance ? (
                                <Button variant='outlined' size='small' onClick={() => setGuestPaymentOpen(true)}>
                                    Record a payment
                                </Button>
                            ) : null
                        }
                    />
                    <MoneyCard
                        title='To suppliers'
                        lines={[
                            ['Cost', rupees(suppliers.cost)],
                            ['Paid', rupees(suppliers.paid)],
                            ['Due', rupees(suppliers.due), true]
                        ]}
                    />
                    {services.length ? (
                        <MoneyCard
                            title='Margin'
                            lines={[
                                ['Price − supplier costs', rupees(margin), true],
                                ['Share of price', money.price ? `${Math.round((margin / money.price) * 100)}%` : '—']
                            ]}
                        />
                    ) : (
                        <MoneyCard title='Margin' lines={[['Shown once hotels and transport are added', '']]} />
                    )}
                </Stack>

                <Section
                    id='itinerary'
                    title={`Itinerary · Quote ${bookedQuote}`}
                    action={
                        <Button
                            onClick={() =>
                                navigate(`/process/guest/add/${leadId}`, { state: { convertedQuoteNo: bookedQuote } })
                            }
                        >
                            Open the quotation
                        </Button>
                    }
                >
                    {bookedDays.length ? (
                        <Box component='ol' sx={{ m: 0, p: 0 }}>
                            {bookedDays.map((day, index) => (
                                <Stack
                                    component='li'
                                    key={day.id}
                                    direction='row'
                                    spacing={2}
                                    sx={{ listStyle: 'none', borderTop: '1px solid', borderColor: 'divider', py: 1.25 }}
                                >
                                    <Typography
                                        sx={{ fontSize: '0.875rem', fontWeight: 600, width: 56, flexShrink: 0 }}
                                    >
                                        Day {index + 1}
                                    </Typography>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontSize: '0.9375rem' }}>
                                            {day.title || 'Untitled day'}
                                        </Typography>
                                        {day.destination?.name ? (
                                            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                                                {day.destination.name}
                                            </Typography>
                                        ) : null}
                                    </Box>
                                </Stack>
                            ))}
                        </Box>
                    ) : (
                        <Typography
                            color='text.secondary'
                            sx={{ fontSize: '0.9375rem', borderTop: '1px solid', borderColor: 'divider', pt: 2 }}
                        >
                            Quote {bookedQuote} has no days.
                        </Typography>
                    )}
                </Section>

                {serviceList('Hotel', hotels)}
                {serviceList('Taxi', taxis)}

                <Section
                    id='payments'
                    title='Guest payments'
                    action={
                        <Button startIcon={<Add />} onClick={() => setGuestPaymentOpen(true)}>
                            Record a payment
                        </Button>
                    }
                >
                    {payments.length ? (
                        <Box component='ul' sx={{ m: 0, p: 0 }}>
                            {payments.map(payment => (
                                <PaymentRow
                                    key={payment.id}
                                    payment={payment}
                                    canEmail={Boolean(lead.senderEmail)}
                                    onReceipt={item => openMail({ kind: 'receipt', paymentId: item.id })}
                                />
                            ))}
                        </Box>
                    ) : (
                        <Typography
                            color='text.secondary'
                            sx={{ fontSize: '0.9375rem', borderTop: '1px solid', borderColor: 'divider', pt: 2 }}
                        >
                            No payments recorded yet.
                        </Typography>
                    )}
                </Section>

                <Section id='documents' title='Send to the guest'>
                    <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>
                            Booking voucher
                            <Typography
                                component='span'
                                sx={{
                                    ml: 1,
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    color: voucherColor
                                }}
                            >
                                {voucherStatus}
                            </Typography>
                        </Typography>
                        <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mb: 1 }}>
                            The trip, hotels, transport and payments in one document.
                        </Typography>
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1}
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                        >
                            <Button variant='contained' onClick={openPreview}>
                                Preview and email
                            </Button>
                            <Button
                                variant='outlined'
                                disabled={busy === 'pdf'}
                                onClick={async () => {
                                    setBusy('pdf')
                                    try {
                                        const blob = await downloadPdf(packageId).unwrap()
                                        downloadBlob(blob, `${guestName.replace(/\s+/g, '_')}_booking_voucher.pdf`)
                                    } catch (error) {
                                        notify(errorText(error, 'Couldn’t create the PDF.'), 'error')
                                    } finally {
                                        setBusy('')
                                    }
                                }}
                            >
                                {busy === 'pdf' ? 'Creating PDF…' : 'Download PDF'}
                            </Button>
                        </Stack>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 3 }} sx={{ mt: 3 }}>
                        <Box>
                            <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600 }}>Hotel confirmation</Typography>
                            <Button
                                size='small'
                                sx={{ ml: -0.75 }}
                                disabled={!hotels.length}
                                onClick={() => openMail({ kind: 'guestService', type: 'Hotel' })}
                            >
                                {hotels.length ? 'Preview and email' : 'Add a hotel first'}
                            </Button>
                            <EmailNote email={booking?.emails?.hotel} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                                Transport confirmation
                            </Typography>
                            <Button
                                size='small'
                                sx={{ ml: -0.75 }}
                                disabled={!taxis.length}
                                onClick={() => openMail({ kind: 'guestService', type: 'Taxi' })}
                            >
                                {taxis.length ? 'Preview and email' : 'Add transport first'}
                            </Button>
                            <EmailNote email={booking?.emails?.taxi} />
                        </Box>
                    </Stack>
                </Section>
            </Box>

            <AssignmentModal
                open={serviceForm.open}
                type={serviceForm.type}
                row={serviceForm.row}
                onClose={() => setServiceForm(current => ({ ...current, open: false }))}
                onSave={saveService}
                isLoading={savingService}
            />
            <GuestPaymentModal
                open={guestPaymentOpen}
                row={{ ...booking, guestName }}
                isLoading={savingGuestPayment}
                onClose={() => setGuestPaymentOpen(false)}
                onSave={saveGuestPayment}
            />
            <SupplierPaymentModal
                open={Boolean(supplierPayment)}
                row={
                    supplierPayment
                        ? {
                              ...supplierPayment,
                              supplierName: supplierPayment.supplier?.businessname || 'Supplier',
                              guestName
                          }
                        : null
                }
                isLoading={savingSupplierPayment}
                onClose={() => setSupplierPayment(null)}
                onSave={saveSupplierPayment}
            />

            <EmailPreview
                open={mail.open}
                title={mail.title || 'Email'}
                to={mail.to || ''}
                subject={mail.subject}
                html={mail.html}
                loading={mail.loading}
                sending={busy === 'mail'}
                canSend={Boolean(mail.to)}
                sendLabel={mailSendLabel}
                closeLabel={mail.send && mail.send.kind !== 'voucher' ? 'Don’t send' : 'Cancel'}
                from={mail.from}
                fromNote={mail.fromNote}
                note={mail.note}
                extra={removeOption}
                onClose={closeMail}
                onSend={sendMail}
            />
        </MainCard>
    )
}

export default BookingWorkspace
