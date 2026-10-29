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
import { useImportSuppliersMutation } from '@/app/store/slices/api/supplierSlice'
import { REQUIRED, reportOf, suppliersFromSheet, suppliersWord, templateSheets } from './supplierImportFacts'

const SHOWN = 12

// ? the xlsx library is loaded only when someone uses it
const readSheet = async file => {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const first = workbook.SheetNames.find(name => !/how to fill/i.test(name)) || workbook.SheetNames[0]
    const sheet = workbook.Sheets[first]
    const [headings = []] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    return { rows: XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true }), headings }
}

const downloadTemplate = async () => {
    const XLSX = await import('xlsx')
    const workbook = XLSX.utils.book_new()
    Object.entries(templateSheets()).forEach(([name, rows]) => {
        const sheet = XLSX.utils.aoa_to_sheet(rows)
        sheet['!cols'] = rows[0].map((cell, index) => ({ wch: index === 1 && name === 'How to fill' ? 70 : 22 }))
        XLSX.utils.book_append_sheet(workbook, sheet, name)
    })
    XLSX.writeFile(workbook, 'suppliers-template.xlsx')
}

function Lines({ items, text }) {
    return (
        <Box component='ul' sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
            {items.slice(0, SHOWN).map(item => (
                <li key={`${item.row}-${text(item)}`}>
                    <Typography sx={{ fontSize: '0.875rem' }}>
                        Row {item.row}: {text(item)}
                    </Typography>
                </li>
            ))}
            {items.length > SHOWN ? (
                <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                    …and {items.length - SHOWN} more
                </Typography>
            ) : null}
        </Box>
    )
}

Lines.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({ row: PropTypes.number })).isRequired,
    text: PropTypes.func.isRequired
}

/**
 * Suppliers from an Excel sheet. Download the template, fill it in (or use the sheet you already have: the usual headings are
 * understood), choose it — the sheet is checked first and says what would be added, what is already listed and what needs fixing,
 * and nothing is saved until "Import" is clicked.
 */
export default function SupplierImport({ onDone }) {
    const input = useRef(null)
    const [importSuppliers, { isLoading }] = useImportSuppliersMutation()
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState(null)
    // ? the sheet's rows once read, the check's answer, and the final answer
    const [rows, setRows] = useState([])
    const [check, setCheck] = useState(null)
    const [result, setResult] = useState(null)
    const [problem, setProblem] = useState('')
    const [ignored, setIgnored] = useState([])

    const reset = () => {
        setFile(null)
        setRows([])
        setCheck(null)
        setResult(null)
        setProblem('')
        setIgnored([])
    }
    const close = () => {
        setOpen(false)
        reset()
    }

    const readFile = async event => {
        const [chosen] = event.target.files || []
        // ? so the same file can be chosen again after a fix
        event.target.value = ''
        if (!chosen) return
        reset()
        setFile(chosen)
        try {
            const sheet = await readSheet(chosen)
            const read = suppliersFromSheet(sheet.rows, sheet.headings)
            if (read.missing.length) {
                setProblem(
                    `The sheet needs these columns: ${read.missing.join(', ')}. Use the template, or add them in the first row.`
                )
                return
            }
            if (!read.rows.length) {
                setProblem('The sheet has no suppliers in it.')
                return
            }
            setIgnored(read.ignored)
            setRows(read.rows)
            const reply = await importSuppliers({ rows: read.rows, dryRun: true }).unwrap()
            setCheck(reportOf(reply.data))
        } catch (error) {
            setProblem(error?.data?.message || 'Couldn’t read that file. Save it as .xlsx and try again.')
        }
    }

    const run = async () => {
        setProblem('')
        try {
            const reply = await importSuppliers({ rows }).unwrap()
            setResult(reportOf(reply.data))
            if (onDone) onDone()
        } catch (error) {
            setProblem(error?.data?.message || 'Couldn’t import the suppliers. Please try again.')
        }
    }

    const shown = result || check
    const checking = Boolean(file) && !problem && !check && !result
    let title = 'Import suppliers from Excel'
    if (result) title = result.added ? 'Suppliers imported' : 'Nothing was imported'

    return (
        <>
            <Button size='small' variant='outlined' startIcon={<UploadFile />} onClick={() => setOpen(true)}>
                Import from Excel
            </Button>
            <Dialog
                open={open}
                onClose={isLoading ? undefined : close}
                maxWidth='sm'
                fullWidth
                aria-labelledby='supplier-import-title'
            >
                <DialogTitle id='supplier-import-title'>{title}</DialogTitle>
                <DialogContent>
                    {!file ? (
                        <Typography color='text.secondary' sx={{ fontSize: '0.9375rem', mb: 2 }}>
                            Use your own sheet, or download the template and fill it in. A hotel or transporter already
                            in your list (the same name in the same city) is left as it is, so the same file can be
                            imported twice safely.
                        </Typography>
                    ) : null}

                    <Stack direction='row' spacing={1} sx={{ mb: 2 }} flexWrap='wrap' useFlexGap>
                        <Button size='small' variant='outlined' startIcon={<FileDownload />} onClick={downloadTemplate}>
                            Download template
                        </Button>
                        <Button
                            size='small'
                            variant='contained'
                            startIcon={
                                checking || isLoading ? <CircularProgress size={16} color='inherit' /> : <UploadFile />
                            }
                            disabled={checking || isLoading}
                            onClick={() => input.current?.click()}
                        >
                            {file ? 'Choose another file' : 'Choose a file'}
                        </Button>
                        <input
                            ref={input}
                            type='file'
                            hidden
                            accept='.xlsx,.xls,.csv'
                            onChange={readFile}
                            aria-label='Suppliers file'
                        />
                    </Stack>

                    {file ? (
                        <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mb: 1.5 }}>
                            {file.name}
                            {checking ? ' — checking…' : ''}
                        </Typography>
                    ) : null}

                    {problem ? (
                        <Alert severity='error' sx={{ mb: 1.5 }} role='alert'>
                            {problem}
                        </Alert>
                    ) : null}

                    {shown ? (
                        <Box>
                            <Typography sx={{ fontWeight: 600 }}>
                                {result
                                    ? `${suppliersWord(shown.added)} imported`
                                    : `${suppliersWord(shown.added)} ready to import`}
                                {shown.skipped.length ? ` · ${shown.skipped.length} already in your list` : ''}
                                {shown.problems.length ? ` · ${shown.problems.length} to fix` : ''}
                            </Typography>
                            {ignored.length && !result ? (
                                <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mt: 0.5 }}>
                                    Not used: {ignored.join(', ')}.
                                </Typography>
                            ) : null}
                            {shown.problems.length ? (
                                <Box sx={{ mt: 1.5 }}>
                                    <Alert severity='warning' sx={{ mb: 0.5 }}>
                                        {result
                                            ? 'These rows were not imported. Fix them in the file and import it again — suppliers already imported are not made twice.'
                                            : `These rows will not be imported until they are fixed${shown.added ? ', but the others will' : ''}.`}
                                    </Alert>
                                    <Lines items={shown.problems} text={item => item.message} />
                                </Box>
                            ) : null}
                            {shown.skipped.length ? (
                                <Box sx={{ mt: 1.5 }}>
                                    <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                                        Left as they are:
                                    </Typography>
                                    <Lines items={shown.skipped} text={item => item.reason} />
                                </Box>
                            ) : null}
                        </Box>
                    ) : null}
                    {!file ? (
                        <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                            Needed in every row: {REQUIRED.map(([, label]) => label).join(', ')}.
                        </Typography>
                    ) : null}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={close} disabled={isLoading}>
                        {result ? 'Close' : 'Cancel'}
                    </Button>
                    {check && !result ? (
                        <Button
                            variant='contained'
                            onClick={run}
                            disabled={isLoading || check.added === 0}
                            startIcon={isLoading ? <CircularProgress size={16} color='inherit' /> : null}
                        >
                            {check.added ? `Import ${suppliersWord(check.added)}` : 'Nothing to import'}
                        </Button>
                    ) : null}
                </DialogActions>
            </Dialog>
        </>
    )
}

SupplierImport.propTypes = { onDone: PropTypes.func }
