import { useState } from 'react'
import PropTypes from 'prop-types'
import {
    Autocomplete,
    Box,
    Button,
    ButtonBase,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Menu,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    useMediaQuery
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { Add, Close, OpenInFull, PictureAsPdf, Visibility } from '@mui/icons-material'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import DayCard from './quote/DayCard'
import { HOTEL_TIERS, daysSummary, entryTypeLabel, formatRupees, hotelList } from './quote/quoteDays'
import { confirmedShape, priceShape, quoteDayShape } from './quote/shapes'

const packageShape = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    campaignId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    campaign: PropTypes.shape({ title: PropTypes.string }),
    name: PropTypes.string,
    packageItenaries: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number }))
})

function SectionTitle({ children, aside = null }) {
    return (
        <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent='space-between'
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={1}
            sx={{ mb: 2 }}
        >
            <Typography component='h3' sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
                {children}
            </Typography>
            {aside}
        </Stack>
    )
}

SectionTitle.propTypes = { children: PropTypes.node.isRequired, aside: PropTypes.node }

const campaignShape = PropTypes.shape({ id: PropTypes.number, title: PropTypes.string })

function QuoteBar({ quotes, current, onSelect, onNew, campaigns, labels, defaultCampaignId = null }) {
    const [menuAnchor, setMenuAnchor] = useState(null)
    // ? with one campaign there is nothing to ask; with several, a new quote says which trip it is for
    const askCampaign = campaigns.length > 1
    return (
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap role='group' aria-label='Quotes'>
            {quotes.map(quoteNo => {
                const selected = quoteNo === current
                return (
                    <ButtonBase
                        key={quoteNo}
                        onClick={() => onSelect(quoteNo)}
                        aria-pressed={selected}
                        sx={theme => ({
                            px: 2,
                            py: 0.875,
                            borderRadius: 999,
                            border: '1px solid',
                            borderColor: selected ? theme.palette.primary.main : theme.palette.divider,
                            bgcolor: selected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                            color: selected ? theme.palette.primary.main : theme.palette.text.primary,
                            fontSize: '0.9375rem',
                            fontWeight: selected ? 600 : 400
                        })}
                    >
                        Quote {quoteNo}
                        {labels[quoteNo] ? (
                            <Box component='span' sx={{ ml: 0.75, fontWeight: 400, color: 'text.secondary' }}>
                                · {labels[quoteNo]}
                            </Box>
                        ) : null}
                    </ButtonBase>
                )
            })}
            <Button
                startIcon={<Add />}
                onClick={event => (askCampaign ? setMenuAnchor(event.currentTarget) : onNew(defaultCampaignId))}
                aria-haspopup={askCampaign ? 'menu' : undefined}
                sx={{ borderRadius: 999 }}
            >
                New quote
            </Button>
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                <MenuItem disabled sx={{ fontSize: '0.8125rem', opacity: '1 !important', color: 'text.secondary' }}>
                    Which trip is the new quote for?
                </MenuItem>
                {[...campaigns]
                    .sort((a, b) => (b.id === defaultCampaignId) - (a.id === defaultCampaignId))
                    .map(campaign => (
                        <MenuItem
                            key={campaign.id}
                            onClick={() => {
                                setMenuAnchor(null)
                                onNew(campaign.id)
                            }}
                        >
                            {campaign.title}
                        </MenuItem>
                    ))}
            </Menu>
        </Stack>
    )
}

QuoteBar.propTypes = {
    quotes: PropTypes.arrayOf(PropTypes.number).isRequired,
    current: PropTypes.number.isRequired,
    onSelect: PropTypes.func.isRequired,
    onNew: PropTypes.func.isRequired,
    campaigns: PropTypes.arrayOf(campaignShape).isRequired,
    labels: PropTypes.objectOf(PropTypes.string).isRequired,
    defaultCampaignId: PropTypes.number
}

function PackagePicker({ packages, loading, replacing, busy, onPick, campaignId = null }) {
    const [input, setInput] = useState('')
    // ? this quote's campaign first, then the others, each under its campaign's name
    const ordered = [...packages].sort(
        (a, b) =>
            (Number(b.campaignId) === campaignId) - (Number(a.campaignId) === campaignId) ||
            String(a.campaign?.title || '').localeCompare(String(b.campaign?.title || ''))
    )
    return (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Autocomplete
                sx={{ width: { xs: '100%', sm: 380 } }}
                options={ordered}
                groupBy={option => option.campaign?.title || 'Other packages'}
                loading={loading}
                disabled={busy}
                value={null}
                inputValue={input}
                onInputChange={(event, value, reason) => setInput(reason === 'reset' ? '' : value)}
                onChange={(event, selected) => {
                    if (selected) onPick(selected)
                }}
                getOptionLabel={option =>
                    `${option.name || 'Untitled package'} · ${option.packageItenaries?.length || 0} days`
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText='No packages yet — create one in Packages'
                renderInput={params => (
                    <TextField
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        {...params}
                        label={replacing ? 'Replace the days with a package' : 'Start from a package'}
                    />
                )}
            />
            {busy ? (
                <Stack direction='row' spacing={1} alignItems='center' role='status'>
                    <CircularProgress size={16} />
                    <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                        Adding the package’s days…
                    </Typography>
                </Stack>
            ) : null}
        </Stack>
    )
}

PackagePicker.propTypes = {
    campaignId: PropTypes.number,
    packages: PropTypes.arrayOf(packageShape).isRequired,
    loading: PropTypes.bool.isRequired,
    replacing: PropTypes.bool.isRequired,
    busy: PropTypes.bool.isRequired,
    onPick: PropTypes.func.isRequired
}

function DaysTable({ days, onEdit }) {
    return (
        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Table size='small' sx={{ minWidth: 760 }}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Day</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                        {HOTEL_TIERS.map(tier => (
                            <TableCell key={tier.key} sx={{ fontWeight: 600 }}>
                                {tier.label}
                            </TableCell>
                        ))}
                        <TableCell />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {days.map((day, index) => (
                        <TableRow key={day.fullItem?.id || index} sx={{ verticalAlign: 'top' }}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell sx={{ maxWidth: 240 }}>
                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                    {day.title || 'Untitled day'}
                                </Typography>
                                <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                                    {[day.destination, day.entryType !== 'Stay' ? entryTypeLabel(day.entryType) : '']
                                        .filter(Boolean)
                                        .join(' · ')}
                                </Typography>
                            </TableCell>
                            {HOTEL_TIERS.map(tier => (
                                <TableCell key={tier.key} sx={{ fontSize: '0.8125rem' }}>
                                    {hotelList(day.hotels?.[tier.key]).join(', ') || '—'}
                                </TableCell>
                            ))}
                            <TableCell>
                                <Button size='small' onClick={() => onEdit(day, index)}>
                                    Edit
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

DaysTable.propTypes = { days: PropTypes.arrayOf(quoteDayShape).isRequired, onEdit: PropTypes.func.isRequired }

const tierLabel = key => HOTEL_TIERS.find(tier => tier.priceKey === key)?.label || key || ''

function BookingNote({ confirmed = null, currentQuoteNo }) {
    if (!confirmed?.selectedPackage) {
        return (
            <Typography color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
                When the guest confirms, turn this quote into a booking.
            </Typography>
        )
    }
    const what = `${tierLabel(confirmed.selectedPackage)} at ${formatRupees(confirmed.sellingPrice) || '—'}`
    if (confirmed.quotationNo === currentQuoteNo) {
        return (
            <Typography sx={{ fontSize: '0.9375rem' }}>
                Quote {currentQuoteNo} is booked — {what}.
            </Typography>
        )
    }
    return (
        <Typography sx={{ fontSize: '0.9375rem', color: 'warning.dark' }}>
            Quote {confirmed.quotationNo} is booked ({what}). Booking Quote {currentQuoteNo} replaces it.
        </Typography>
    )
}

BookingNote.propTypes = { confirmed: confirmedShape, currentQuoteNo: PropTypes.number.isRequired }

function sharedNote(lastSharedQuoteNo, lastSharedAt, currentQuoteNo) {
    if (!lastSharedQuoteNo) return 'Not sent to the guest yet.'
    if (lastSharedQuoteNo !== currentQuoteNo) {
        return `The guest last got Quote ${lastSharedQuoteNo}. Sending this one sends a different version.`
    }
    const when = lastSharedAt
        ? ` on ${new Date(lastSharedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
        : ''
    return `Emailed to the guest${when}.`
}

/**
 * Step 2 of a quotation: the days, the price per person, sending it, and booking it — one calm column, in
 * the order an agent works.
 */
export default function ItinerarySection({
    quotes,
    currentQuoteNo,
    onSelectQuote,
    onNewQuote,
    campaigns = [],
    quoteCampaigns = {},
    currentCampaignId = null,
    leadCampaignId = null,
    onChangeQuoteCampaign = () => {},
    savingQuoteCampaign = false,
    tripLine = '',
    onEditTrip,
    startDate = '',
    guestCategory = '',
    days,
    stays,
    loadingDays = false,
    packages,
    loadingPackages = false,
    applyingPackage = false,
    onApplyPackage,
    onAddDay,
    onEditDay,
    onDeleteDay,
    onMoveDay,
    priceForm,
    priceData = null,
    confirmedPackage = null,
    lastSharedQuoteNo = null,
    lastSharedAt = null,
    onPreview,
    onDownloadPdf,
    onWhatsApp,
    onConvert
}) {
    const theme = useTheme()
    const phone = useMediaQuery(theme.breakpoints.down('sm'))
    const [view, setView] = useState('list')
    const [fullView, setFullView] = useState(false)
    const [pendingPackage, setPendingPackage] = useState(null)

    const hasDays = days.length > 0
    const bookedThis = confirmedPackage?.selectedPackage && confirmedPackage.quotationNo === currentQuoteNo
    const bookedOther = confirmedPackage?.selectedPackage && confirmedPackage.quotationNo !== currentQuoteNo
    let convertLabel = `Book Quote ${currentQuoteNo}`
    if (bookedThis) convertLabel = 'Update the booking'
    if (bookedOther) convertLabel = `Book Quote ${currentQuoteNo} instead`

    const pickPackage = pkg => (hasDays ? setPendingPackage(pkg) : onApplyPackage(pkg))

    return (
        <Box sx={{ width: '100%', '& .MuiButton-root, & .MuiToggleButton-root': { textTransform: 'none' } }}>
            <Stack spacing={2} sx={{ mb: 5 }}>
                <QuoteBar
                    quotes={quotes}
                    current={currentQuoteNo}
                    onSelect={onSelectQuote}
                    onNew={onNewQuote}
                    campaigns={campaigns}
                    labels={
                        // ? campaign names only say something when the quotes are for different trips
                        new Set(Object.values(quoteCampaigns).filter(Boolean)).size > 1 ||
                        (currentCampaignId && leadCampaignId && currentCampaignId !== leadCampaignId)
                            ? quoteCampaigns
                            : {}
                    }
                    defaultCampaignId={currentCampaignId}
                />
                <Stack direction='row' spacing={1} alignItems='baseline' flexWrap='wrap' useFlexGap>
                    <Typography color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
                        {tripLine || 'Trip details not added yet'}
                    </Typography>
                    <Button size='small' onClick={onEditTrip} sx={{ minWidth: 0, px: 0.75 }}>
                        Edit trip details
                    </Button>
                </Stack>
                {campaigns.length > 1 ? (
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={{ xs: 1, sm: 1.5 }}
                        alignItems={{ sm: 'center' }}
                    >
                        <TextField
                            select
                            size='small'
                            label={`Trip for Quote ${currentQuoteNo}`}
                            value={campaigns.some(item => item.id === currentCampaignId) ? currentCampaignId : ''}
                            onChange={event => onChangeQuoteCampaign(event.target.value)}
                            disabled={savingQuoteCampaign}
                            sx={{ minWidth: 220 }}
                        >
                            {campaigns.map(campaign => (
                                <MenuItem key={campaign.id} value={campaign.id}>
                                    {campaign.title}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                            This trip’s inclusions, exclusions, notes and bank details go on Quote {currentQuoteNo}.
                        </Typography>
                    </Stack>
                ) : null}
            </Stack>

            <Box component='section' aria-labelledby='quote-days' sx={{ mb: 6 }}>
                <SectionTitle
                    aside={
                        hasDays ? (
                            <Stack direction='row' spacing={1} alignItems='center'>
                                <ToggleButtonGroup
                                    size='small'
                                    exclusive
                                    value={view}
                                    onChange={(event, next) => next && setView(next)}
                                    aria-label='How to show the days'
                                >
                                    <ToggleButton value='list'>List</ToggleButton>
                                    <ToggleButton value='table'>Hotels table</ToggleButton>
                                </ToggleButtonGroup>
                                <Button size='small' startIcon={<OpenInFull />} onClick={() => setFullView(true)}>
                                    Full view
                                </Button>
                            </Stack>
                        ) : null
                    }
                >
                    <span id='quote-days'>Days</span>
                </SectionTitle>

                {hasDays ? (
                    <Typography color='text.secondary' sx={{ fontSize: '0.9375rem', mt: -1, mb: 2.5 }}>
                        {daysSummary(days, stays)}
                    </Typography>
                ) : (
                    <Typography color='text.secondary' sx={{ fontSize: '0.9375rem', mt: -1, mb: 2.5 }}>
                        {loadingDays
                            ? 'Loading the days…'
                            : `Quote ${currentQuoteNo} has no days yet. Start from one of your packages, or add days one at a time.`}
                    </Typography>
                )}

                <Box sx={{ mb: 2.5 }}>
                    <PackagePicker
                        campaignId={currentCampaignId}
                        packages={packages}
                        loading={loadingPackages}
                        replacing={hasDays}
                        busy={applyingPackage}
                        onPick={pickPackage}
                    />
                </Box>

                {hasDays && view === 'list' ? (
                    <Box component='ol' sx={{ m: 0, p: 0 }}>
                        {days.map((day, index) => (
                            <DayCard
                                key={day.fullItem?.id || index}
                                day={day}
                                index={index}
                                total={days.length}
                                startDate={startDate}
                                guestCategory={guestCategory}
                                onEdit={onEditDay}
                                onDelete={onDeleteDay}
                                onMove={onMoveDay}
                            />
                        ))}
                    </Box>
                ) : null}
                {hasDays && view === 'table' ? <DaysTable days={days} onEdit={onEditDay} /> : null}

                <Box
                    sx={{ borderTop: hasDays && view === 'list' ? '1px solid' : 'none', borderColor: 'divider', pt: 2 }}
                >
                    <Button variant={hasDays ? 'text' : 'outlined'} startIcon={<Add />} onClick={onAddDay}>
                        Add a day
                    </Button>
                </Box>
            </Box>

            {hasDays ? (
                <>
                    <Box component='section' aria-labelledby='quote-prices' sx={{ mb: 6 }}>
                        <SectionTitle>
                            <span id='quote-prices'>Price per person</span>
                        </SectionTitle>
                        {priceForm}
                    </Box>

                    <Box component='section' aria-labelledby='quote-send' sx={{ mb: 6 }}>
                        <SectionTitle>
                            <span id='quote-send'>Send to the guest</span>
                        </SectionTitle>
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1.5}
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                        >
                            <Button variant='contained' startIcon={<Visibility />} onClick={onPreview}>
                                Preview and email
                            </Button>
                            <Button variant='outlined' startIcon={<PictureAsPdf />} onClick={onDownloadPdf}>
                                Download PDF
                            </Button>
                            <Button
                                variant='outlined'
                                startIcon={<WhatsAppIcon sx={{ color: '#25D366' }} />}
                                onClick={onWhatsApp}
                            >
                                WhatsApp
                            </Button>
                        </Stack>
                        <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mt: 1.5 }}>
                            {sharedNote(lastSharedQuoteNo, lastSharedAt, currentQuoteNo)}
                        </Typography>
                    </Box>

                    <Box component='section' aria-labelledby='quote-booking'>
                        <SectionTitle>
                            <span id='quote-booking'>Booking</span>
                        </SectionTitle>
                        <BookingNote confirmed={confirmedPackage} currentQuoteNo={currentQuoteNo} />
                        <Button variant='outlined' onClick={onConvert} sx={{ mt: 2 }}>
                            {convertLabel}
                        </Button>
                    </Box>
                </>
            ) : null}

            <Dialog open={Boolean(pendingPackage)} onClose={() => setPendingPackage(null)} maxWidth='xs' fullWidth>
                <DialogTitle>Replace the days in Quote {currentQuoteNo}?</DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontSize: '0.9375rem' }}>
                        Its {days.length} day{days.length === 1 ? '' : 's'} will be replaced by the{' '}
                        {pendingPackage?.packageItenaries?.length || 0} days of “{pendingPackage?.name}”. Prices stay as
                        they are.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ '& .MuiButton-root': { textTransform: 'none' } }}>
                    <Button onClick={() => setPendingPackage(null)}>Cancel</Button>
                    <Button
                        variant='contained'
                        onClick={() => {
                            onApplyPackage(pendingPackage)
                            setPendingPackage(null)
                        }}
                    >
                        Replace days
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog fullScreen={phone} maxWidth='md' fullWidth open={fullView} onClose={() => setFullView(false)}>
                <DialogTitle sx={{ pr: 7 }}>
                    Quote {currentQuoteNo}
                    <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                        {[tripLine, daysSummary(days, stays)].filter(Boolean).join(' · ')}
                    </Typography>
                    <IconButton
                        aria-label='Close'
                        onClick={() => setFullView(false)}
                        sx={{ position: 'absolute', right: 12, top: 12 }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ '& .MuiButton-root': { textTransform: 'none' } }}>
                    <Box component='ol' sx={{ m: 0, p: 0 }}>
                        {days.map((day, index) => (
                            <DayCard
                                key={day.fullItem?.id || index}
                                day={day}
                                index={index}
                                total={days.length}
                                startDate={startDate}
                                guestCategory={guestCategory}
                                readOnly
                            />
                        ))}
                    </Box>
                    {HOTEL_TIERS.some(tier => formatRupees(priceData?.[tier.priceKey])) ? (
                        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2.5 }}>
                            <Typography sx={{ fontWeight: 600, mb: 1 }}>
                                {priceData?.priceBasis === 'total' ? 'Total price' : 'Price per person'}
                            </Typography>
                            <Stack direction='row' spacing={3} flexWrap='wrap' useFlexGap>
                                {HOTEL_TIERS.filter(tier => formatRupees(priceData?.[tier.priceKey])).map(tier => (
                                    <Box key={tier.key}>
                                        <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                                            {tier.label}
                                        </Typography>
                                        <Typography sx={{ fontWeight: 600 }}>
                                            {formatRupees(priceData?.[tier.priceKey])}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    ) : null}
                </DialogContent>
            </Dialog>
        </Box>
    )
}

ItinerarySection.propTypes = {
    campaigns: PropTypes.arrayOf(campaignShape),
    quoteCampaigns: PropTypes.objectOf(PropTypes.string),
    currentCampaignId: PropTypes.number,
    leadCampaignId: PropTypes.number,
    onChangeQuoteCampaign: PropTypes.func,
    savingQuoteCampaign: PropTypes.bool,
    quotes: PropTypes.arrayOf(PropTypes.number).isRequired,
    currentQuoteNo: PropTypes.number.isRequired,
    onSelectQuote: PropTypes.func.isRequired,
    onNewQuote: PropTypes.func.isRequired,
    tripLine: PropTypes.string,
    onEditTrip: PropTypes.func.isRequired,
    startDate: PropTypes.string,
    guestCategory: PropTypes.string,
    days: PropTypes.arrayOf(quoteDayShape).isRequired,
    stays: PropTypes.arrayOf(PropTypes.shape({ destination: PropTypes.string, nights: PropTypes.number })).isRequired,
    loadingDays: PropTypes.bool,
    packages: PropTypes.arrayOf(packageShape).isRequired,
    loadingPackages: PropTypes.bool,
    applyingPackage: PropTypes.bool,
    onApplyPackage: PropTypes.func.isRequired,
    onAddDay: PropTypes.func.isRequired,
    onEditDay: PropTypes.func.isRequired,
    onDeleteDay: PropTypes.func.isRequired,
    onMoveDay: PropTypes.func.isRequired,
    priceForm: PropTypes.node.isRequired,
    priceData: priceShape,
    confirmedPackage: confirmedShape,
    lastSharedQuoteNo: PropTypes.number,
    lastSharedAt: PropTypes.string,
    onPreview: PropTypes.func.isRequired,
    onDownloadPdf: PropTypes.func.isRequired,
    onWhatsApp: PropTypes.func.isRequired,
    onConvert: PropTypes.func.isRequired
}
