import { Chip, Typography } from '@mui/material'
import { dayText, invoiceStatus, kindLabel, money2 } from '../gst/gstFacts'
import { InvoiceStatusChip } from './invoiceParts'

/** The invoices table: how each column is drawn and what it writes to CSV; `visible: false` starts hidden. */
// eslint-disable-next-line import/prefer-default-export
export const INVOICE_COLUMNS = [
    {
        key: 'number',
        label: 'Invoice',
        render: row => (
            <>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>{row.number}</Typography>
                <Chip size='small' variant='outlined' label={kindLabel(row.kind)} sx={{ mt: 0.5 }} />
            </>
        ),
        csv: row => row.number
    },
    { key: 'kind', label: 'Kind', visible: false, render: row => kindLabel(row.kind), csv: row => kindLabel(row.kind) },
    { key: 'date', label: 'Date', render: row => dayText(row.invoiceDate), csv: row => dayText(row.invoiceDate) },
    {
        key: 'customer',
        label: 'Billed to',
        render: row => (
            <>
                {row.customerName}
                {row.customerGstin && (
                    <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                        {row.customerGstin}
                    </Typography>
                )}
            </>
        ),
        csv: row => row.customerName || ''
    },
    {
        key: 'gstin',
        label: 'Customer GSTIN',
        visible: false,
        render: row => row.customerGstin || '—',
        csv: row => row.customerGstin || ''
    },
    {
        key: 'taxable',
        label: 'Taxable',
        align: 'right',
        render: row => money2(row.taxable),
        csv: row => Number(row.taxable) || 0
    },
    {
        key: 'cgst',
        label: 'CGST',
        align: 'right',
        visible: false,
        render: row => money2(row.cgst),
        csv: row => Number(row.cgst) || 0
    },
    {
        key: 'sgst',
        label: 'SGST',
        align: 'right',
        visible: false,
        render: row => money2(row.sgst),
        csv: row => Number(row.sgst) || 0
    },
    {
        key: 'igst',
        label: 'IGST',
        align: 'right',
        visible: false,
        render: row => money2(row.igst),
        csv: row => Number(row.igst) || 0
    },
    { key: 'gst', label: 'GST', align: 'right', render: row => money2(row.gst), csv: row => Number(row.gst) || 0 },
    {
        key: 'total',
        label: 'Total',
        align: 'right',
        render: row => <strong>{money2(row.total)}</strong>,
        csv: row => Number(row.total) || 0
    },
    {
        key: 'status',
        label: 'Status',
        render: row => <InvoiceStatusChip status={row.status} />,
        csv: row => invoiceStatus(row.status).label
    },
    {
        key: 'issuedBy',
        label: 'Issued by',
        render: row => row.createdByName || '—',
        csv: row => row.createdByName || ''
    }
]
