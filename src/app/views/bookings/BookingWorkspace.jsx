import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { Add, ArrowBack } from '@mui/icons-material'
import MainCard from '@core/components/extended/MainCard'
import AssignmentModal from '@/core/components/modals/AssignmentModal'
import GuestPaymentModal from '@/core/components/modals/GuestPaymentModal'
import SupplierPaymentModal from '@/core/components/modals/SupplierPaymentModal'
import {
    getConfirmedVoucherPreview,
    getSupplierEmailPreview,
    useAddGuestPaymentMutation,
    useAddServiceToPackageMutation,
    useDeleteServiceMutation,
    useDownloadConfirmedVoucherPdfMutation,
    useGetGuestPaymentHistoryQuery,
    useGetPackageByLeadIdQuery,
    useGetServicesByPackageQuery,
    useSendGuestHotelConfirmationEmailMutation,
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
    dateRange,
    doneCount,
    guestMoney,
    nextStep,
    progressOf,
    rupees,
    supplierMoney,
    urgency
} from './bookingFacts'
import { EmailPreview, MoneyCard, PaymentRow, Section, ServiceRow, StepsBar } from './bookingParts'

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
    const [addGuestPayment, { isLoading: savingGuestPayment }] = useAddGuestPaymentMutation()
    const [paySupplier, { isLoading: savingSupplierPayment }] = usePaySupplierMutation()
    const [sendVoucherEmail] = useSendVoucherEmailMutation()
    const [sendHotelEmail] = useSendGuestHotelConfirmationEmailMutation()
    const [sendTaxiEmail] = useSendGuestTaxiConfirmationEmailMutation()
    const [downloadPdf] = useDownloadConfirmedVoucherPdfMutation()

    const [serviceForm, setServiceForm] = useState({ open: false, type: 'Hotel', row: null })
    const [guestPaymentOpen, setGuestPaymentOpen] = useState(false)
    const [supplierPayment, setSupplierPayment] = useState(null)
    const [busy, setBusy] = useState('')
    // ? the email being checked before it is sent: the guest's voucher, or a booking request to a supplier
    const closedMail = {
        open: false,
        loading: false,
        kind: '',
        service: null,
        title: '',
        to: '',
        subject: '',
        html: ''
    }
    const [mail, setMail] = useState(closedMail)
    const closeMail = () => setMail(current => ({ ...current, open: false }))

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

    const saveService = async formData => {
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
        if (ok) setServiceForm(current => ({ ...current, open: false }))
    }

    const saveGuestPayment = async formData => {
        const ok = await run(
            'guest-payment',
            () => addGuestPayment({ packageId, ...formData }).unwrap(),
            'Payment recorded — a receipt is emailed to the guest',
            'Couldn’t record the payment.'
        )
        if (ok) setGuestPaymentOpen(false)
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

    const openPreview = async () => {
        setMail({
            ...closedMail,
            open: true,
            loading: true,
            kind: 'voucher',
            title: 'Booking voucher',
            to: lead.senderEmail
        })
        const { data, error } = await dispatch(getConfirmedVoucherPreview.initiate(packageId, { forceRefetch: true }))
        if (error) {
            setMail(closedMail)
            notify(errorText(error, 'Couldn’t load the voucher.'), 'error')
            return
        }
        setMail(current => ({ ...current, loading: false, html: data?.data?.html || '' }))
    }

    const openSupplierEmail = async service => {
        const name = service.supplier?.businessname || 'the supplier'
        setMail({
            ...closedMail,
            open: true,
            loading: true,
            kind: 'supplier',
            service,
            title: `Booking request to ${name}`
        })
        const { data, error } = await dispatch(getSupplierEmailPreview.initiate(service.id, { forceRefetch: true }))
        if (error) {
            setMail(closedMail)
            notify(errorText(error, 'Couldn’t prepare the email.'), 'error')
            return
        }
        const email = data?.data || {}
        setMail(current => ({
            ...current,
            loading: false,
            to: email.to || '',
            subject: email.subject || '',
            html: email.html || ''
        }))
    }

    const sendMail = async () => {
        const { kind, service } = mail
        const ok =
            kind === 'voucher'
                ? await run(
                      'voucher',
                      () => sendVoucherEmail(packageId).unwrap(),
                      `Voucher emailed to ${guestName}`,
                      'Couldn’t send the voucher.'
                  )
                : await run(
                      `email-${service.id}`,
                      () => sendSupplierEmail(service.id).unwrap(),
                      `Booking request emailed to ${service.supplier?.businessname || 'the supplier'}`,
                      'Couldn’t email the supplier.'
                  )
        if (ok) closeMail()
    }

    let mailSendLabel = 'Send'
    if (mail.to) mailSendLabel = `Send to ${mail.to}`
    else if (mail.kind === 'voucher') mailSendLabel = 'No guest email on this lead'

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
        booking.selectedPackage,
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
                                emailing={busy === `email-${service.id}`}
                                onPay={setSupplierPayment}
                                onEmail={openSupplierEmail}
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
                                <PaymentRow key={payment.id} payment={payment} />
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
                                    color: progress.voucher ? 'success.main' : 'text.secondary'
                                }}
                            >
                                {progress.voucher ? 'Sent' : 'Not sent yet'}
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
                                disabled={!hotels.length || busy === 'hotel-mail'}
                                onClick={() =>
                                    run(
                                        'hotel-mail',
                                        () => sendHotelEmail(packageId).unwrap(),
                                        `Hotel details emailed to ${guestName}`,
                                        'Couldn’t send it.'
                                    )
                                }
                            >
                                {hotels.length ? 'Email to the guest' : 'Add a hotel first'}
                            </Button>
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                                Transport confirmation
                            </Typography>
                            <Button
                                size='small'
                                sx={{ ml: -0.75 }}
                                disabled={!taxis.length || busy === 'taxi-mail'}
                                onClick={() =>
                                    run(
                                        'taxi-mail',
                                        () => sendTaxiEmail(packageId).unwrap(),
                                        `Transport details emailed to ${guestName}`,
                                        'Couldn’t send it.'
                                    )
                                }
                            >
                                {taxis.length ? 'Email to the guest' : 'Add transport first'}
                            </Button>
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
                sending={busy === 'voucher' || (mail.service ? busy === `email-${mail.service.id}` : false)}
                canSend={Boolean(mail.to)}
                sendLabel={mailSendLabel}
                onClose={closeMail}
                onSend={sendMail}
            />
        </MainCard>
    )
}

export default BookingWorkspace
