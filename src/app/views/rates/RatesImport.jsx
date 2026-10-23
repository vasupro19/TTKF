import { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Typography
} from '@mui/material'
import { FileDownload, UploadFile } from '@mui/icons-material'
import * as XLSX from 'xlsx'
import { useImportRatesMutation } from '@/app/store/slices/api/ratesSlice'
import { cabsFromSheet, hotelsFromSheet, pickSheets, templateSheets } from './rateFacts'

/** @description the template as an Excel file the agent fills in: one sheet of hotel rates, one of cabs */
const downloadTemplate = () => {
    const workbook = XLSX.utils.book_new()
    Object.entries(templateSheets()).forEach(([name, rows]) => {
        const sheet = XLSX.utils.aoa_to_sheet(rows)
        sheet['!cols'] = rows[0].map(() => ({ wch: 14 }))
        XLSX.utils.book_append_sheet(workbook, sheet, name)
    })
    XLSX.writeFile(workbook, 'rate-card-template.xlsx')
}

/**
 * Download the Excel template, fill it in, and import it: new rates are added, a row for a place, category and dates already on
 * the card changes the amounts it fills in, and rows that cannot be used are listed.
 */
export default function RatesImport({ onDone }) {
    const input = useRef(null)
    const [importRates, { isLoading }] = useImportRatesMutation()
    const [report, setReport] = useState(null)
    const [problem, setProblem] = useState('')

    const readFile = async event => {
        const [file] = event.target.files || []
        // ? so the same file can be chosen again after a fix
        event.target.value = ''
        if (!file) return
        setProblem('')
        try {
            const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
            const names = pickSheets(workbook.SheetNames)
            const rowsOf = name =>
                name ? XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '', raw: true }) : []
            const hotels = hotelsFromSheet(rowsOf(names.hotels))
            const vehicles = cabsFromSheet(rowsOf(names.cabs))
            if (!hotels.length && !vehicles.length) {
                setProblem('That file has no rates in it. Use the template: a Hotels sheet and a Cabs sheet.')
                setReport({ empty: true })
                return
            }
            const reply = await importRates({ hotels, vehicles }).unwrap()
            setReport(reply.data)
            if (onDone) onDone()
        } catch (error) {
            setProblem(error?.data?.message || 'Couldn’t read that file. Save it as .xlsx and try again.')
            setReport({ empty: true })
        }
    }

    const done = report && !report.empty
    return (
        <>
            <Stack direction='row' spacing={1}>
                <Button size='small' variant='outlined' startIcon={<FileDownload />} onClick={downloadTemplate}>
                    Download template
                </Button>
                <Button
                    size='small'
                    variant='contained'
                    startIcon={isLoading ? <CircularProgress size={16} color='inherit' /> : <UploadFile />}
                    disabled={isLoading}
                    onClick={() => input.current?.click()}
                >
                    Import from Excel
                </Button>
                <input
                    ref={input}
                    type='file'
                    hidden
                    accept='.xlsx,.xls,.csv'
                    onChange={readFile}
                    aria-label='Rates file'
                />
            </Stack>

            <Dialog open={Boolean(report)} onClose={() => setReport(null)} maxWidth='sm' fullWidth>
                <DialogTitle>{done ? 'Rates imported' : 'Nothing imported'}</DialogTitle>
                <DialogContent>
                    {problem ? <Alert severity='error'>{problem}</Alert> : null}
                    {done ? (
                        <Box>
                            <Typography>
                                Hotels: {report.hotelsAdded} added, {report.hotelsChanged} changed. Cabs:{' '}
                                {report.cabsAdded} added, {report.cabsChanged} changed.
                            </Typography>
                            {report.skippedCount ? (
                                <Box sx={{ mt: 2 }}>
                                    <Alert severity='warning' sx={{ mb: 1 }}>
                                        {report.skippedCount} row{report.skippedCount === 1 ? '' : 's'} could not be
                                        used
                                        {report.skippedCount > report.skipped.length
                                            ? ` (the first ${report.skipped.length} are listed)`
                                            : ''}
                                        . Fix them in the file and import again — rates already imported are not
                                        duplicated.
                                    </Alert>
                                    <Box component='ul' sx={{ m: 0, pl: 2.5 }}>
                                        {report.skipped.map(item => (
                                            <li key={`${item.sheet}-${item.row}-${item.message}`}>
                                                <Typography sx={{ fontSize: '0.875rem' }}>
                                                    {item.sheet} sheet, row {item.row + 1}: {item.message}
                                                </Typography>
                                            </li>
                                        ))}
                                    </Box>
                                </Box>
                            ) : null}
                        </Box>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReport(null)}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

RatesImport.propTypes = { onDone: PropTypes.func }
