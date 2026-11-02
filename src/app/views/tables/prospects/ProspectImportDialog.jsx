import { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import { UploadFile } from '@mui/icons-material'
import { useAddProspectMutation, useImportProspectsMutation } from '@/app/store/slices/api/prospectSlice'
import { importableRows, importReport } from './prospectFacts'

// ? the first sheet's rows, keyed by its headings
const readSheet = async file => {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })
}

const BLANK = { name: '', city: '', region: '', phone: '', email: '', website: '' }

/**
 * Adding agencies: a spreadsheet (the columns are read by their headings — Agency, City, Region, Phone, Email,
 * Website, …), or one agency typed in. An agency already on the list (same name and city) is skipped.
 */
function ProspectImportDialog({ open, onClose, onDone }) {
    const fileRef = useRef(null)
    const [rows, setRows] = useState(null)
    const [fileName, setFileName] = useState('')
    const [problem, setProblem] = useState('')
    const [report, setReport] = useState('')
    const [one, setOne] = useState(BLANK)
    const [importProspects, { isLoading: importing }] = useImportProspectsMutation()
    const [addProspect, { isLoading: adding }] = useAddProspectMutation()

    const reset = () => {
        setRows(null)
        setFileName('')
        setProblem('')
        setReport('')
        setOne(BLANK)
        if (fileRef.current) fileRef.current.value = ''
    }
    const close = () => {
        reset()
        onClose()
    }

    const handleFile = async event => {
        const file = event.target.files?.[0]
        setProblem('')
        setReport('')
        if (!file) return
        try {
            const found = importableRows(await readSheet(file))
            setRows(found)
            setFileName(file.name)
            if (!found.length) setProblem('The first sheet has no rows.')
        } catch (error) {
            setRows(null)
            setProblem('This file could not be read. Use an Excel (.xlsx) or CSV file.')
        }
    }

    const handleImport = async () => {
        try {
            const result = await importProspects(rows).unwrap()
            setReport(importReport(result?.data))
            setRows(null)
            if (fileRef.current) fileRef.current.value = ''
            if (onDone) onDone()
        } catch (error) {
            setProblem(error?.data?.message || 'The import did not work.')
        }
    }

    const handleAdd = async () => {
        try {
            const result = await addProspect(one).unwrap()
            setReport(result?.message || 'Agency added')
            setOne(BLANK)
            if (onDone) onDone()
        } catch (error) {
            setProblem(error?.data?.message || 'The agency could not be added.')
        }
    }

    return (
        <Dialog open={open} onClose={close} maxWidth='sm' fullWidth>
            <DialogTitle>Add agencies</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2}>
                    <Typography variant='subtitle1' fontWeight={700}>
                        From a spreadsheet
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                        Columns are read by their headings: Agency, City, Region, Phone, Email, Website, Instagram /
                        Facebook, What they sell, Size signal, Why they fit, Source, Status, Notes. The
                        Travelytics_Potential_Clients.xlsx list works as it is.
                    </Typography>
                    <Stack direction='row' spacing={1.5} alignItems='center'>
                        <Button variant='outlined' component='label' startIcon={<UploadFile />}>
                            Choose file
                            <input ref={fileRef} hidden type='file' accept='.xlsx,.xls,.csv' onChange={handleFile} />
                        </Button>
                        <Typography variant='body2' color='text.secondary'>
                            {fileName && rows ? `${fileName}: ${rows.length} rows` : 'No file chosen'}
                        </Typography>
                    </Stack>
                    {rows?.length > 0 && (
                        <Button
                            variant='contained'
                            onClick={handleImport}
                            disabled={importing}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            {importing ? 'Importing…' : `Import ${rows.length} rows`}
                        </Button>
                    )}

                    <Typography variant='subtitle1' fontWeight={700} sx={{ pt: 1 }}>
                        Or one agency
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <TextField
                            size='small'
                            label='Agency name'
                            value={one.name}
                            onChange={event => setOne({ ...one, name: event.target.value })}
                            fullWidth
                        />
                        <TextField
                            size='small'
                            label='City'
                            value={one.city}
                            onChange={event => setOne({ ...one, city: event.target.value })}
                            fullWidth
                        />
                        <TextField
                            size='small'
                            label='Region'
                            value={one.region}
                            onChange={event => setOne({ ...one, region: event.target.value })}
                            fullWidth
                        />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <TextField
                            size='small'
                            label='Phone'
                            value={one.phone}
                            onChange={event => setOne({ ...one, phone: event.target.value })}
                            fullWidth
                        />
                        <TextField
                            size='small'
                            label='Email'
                            value={one.email}
                            onChange={event => setOne({ ...one, email: event.target.value })}
                            fullWidth
                        />
                        <TextField
                            size='small'
                            label='Website'
                            value={one.website}
                            onChange={event => setOne({ ...one, website: event.target.value })}
                            fullWidth
                        />
                    </Stack>
                    <Button
                        variant='outlined'
                        onClick={handleAdd}
                        disabled={adding || !one.name.trim()}
                        sx={{ alignSelf: 'flex-start' }}
                    >
                        Add agency
                    </Button>

                    {problem && <Alert severity='error'>{problem}</Alert>}
                    {report && <Alert severity='success'>{report}</Alert>}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={close}>Done</Button>
            </DialogActions>
        </Dialog>
    )
}

ProspectImportDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onDone: PropTypes.func
}

export default ProspectImportDialog
