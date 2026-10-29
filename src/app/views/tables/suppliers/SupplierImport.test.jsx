import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import * as XLSX from 'xlsx'
import SupplierImport from './SupplierImport'

const api = vi.hoisted(() => ({ calls: [], reply: null, fail: null }))

vi.mock('@/app/store/slices/api/supplierSlice', () => ({
    useImportSuppliersMutation: () => [
        payload => ({
            unwrap: () => {
                api.calls.push(payload)
                if (api.fail) return Promise.reject(api.fail)
                return Promise.resolve({ data: api.reply(payload) })
            }
        }),
        { isLoading: false }
    ]
}))

// ? a real .xlsx made in the test, as a file the person would choose
const xlsxFile = (rows, name = 'suppliers.xlsx') => {
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Sheet1')
    const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    const file = new File([bytes], name, { type: 'application/octet-stream' })
    // ? jsdom's File has no arrayBuffer
    file.arrayBuffer = async () => bytes
    return file
}

const HEADINGS = ['Business name', 'Type', 'Contact person', 'Phone', 'Email', 'City']
const choose = file => fireEvent.change(screen.getByLabelText('Suppliers file'), { target: { files: [file] } })
const open = onDone => {
    render(<SupplierImport onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: 'Import from Excel' }))
    return screen.getByRole('dialog', { name: 'Import suppliers from Excel' })
}

beforeEach(() => {
    api.calls = []
    api.fail = null
    api.reply = payload => ({
        dryRun: payload.dryRun === true,
        added: payload.rows.length - 2,
        skipped: [{ row: 4, reason: 'already in your suppliers' }],
        problems: [{ row: 5, message: 'Phone number is empty' }]
    })
})

describe('importing suppliers from Excel', () => {
    test('opens with how to start: the template, the file, and what is needed', () => {
        const dialog = open()
        expect(within(dialog).getByRole('button', { name: 'Download template' })).toBeInTheDocument()
        expect(within(dialog).getByRole('button', { name: 'Choose a file' })).toBeInTheDocument()
        expect(within(dialog).getByText(/Needed in every row: Business name, Type, Phone/)).toBeInTheDocument()
        expect(within(dialog).getByText(/imported twice safely/)).toBeInTheDocument()
    })

    test('the sheet is checked first: what would be added, what is listed already and what to fix — nothing is saved yet', async () => {
        const dialog = open()
        choose(
            xlsxFile([
                HEADINGS,
                ['Hotel Snowline', 'Hotel', 'Mr Negi', 9876543210, 'rooms@snowline.example.com', 'Manali'],
                ['Hotel Rivera', 'Hotel', '', '9812345678', '', 'Kasol'],
                ['Old Lodge', 'Hotel', '', '9811111111', '', 'Shimla'],
                ['No Phone Cabs', 'Taxi', '', '', '', 'Shimla'],
                ['Hotel Aurora', 'Hotel', '', '9822222222', '', 'Goa']
            ])
        )
        expect(
            await within(dialog).findByText(/3 suppliers ready to import · 1 already in your list · 1 to fix/)
        ).toBeInTheDocument()
        expect(api.calls).toHaveLength(1)
        expect(api.calls[0].dryRun).toBe(true)
        // ? each row carries its number in the sheet: the headings are row 1
        expect(api.calls[0].rows.map(row => row.row)).toEqual([2, 3, 4, 5, 6])
        expect(api.calls[0].rows[0]).toMatchObject({
            businessname: 'Hotel Snowline',
            type: 'Hotel',
            phone: 9876543210,
            city: 'Manali'
        })
        expect(within(dialog).getByText('Row 5: Phone number is empty')).toBeInTheDocument()
        expect(within(dialog).getByText('Row 4: already in your suppliers')).toBeInTheDocument()
        expect(within(dialog).getByRole('button', { name: 'Import 3 suppliers' })).toBeEnabled()
    })

    test('Import saves them (no dry run), says how many went in, and tells the list to load again', async () => {
        const onDone = vi.fn()
        const dialog = open(onDone)
        choose(
            xlsxFile([
                HEADINGS,
                ['A Hotel', 'Hotel', '', '9876543210', '', 'Manali'],
                ['B Hotel', 'Hotel', '', '9876543211', '', 'Kasol'],
                ['C Hotel', 'Hotel', '', '9876543212', '', 'Goa'],
                ['D Hotel', 'Hotel', '', '9876543213', '', 'Leh']
            ])
        )
        fireEvent.click(await within(dialog).findByRole('button', { name: 'Import 2 suppliers' }))
        expect(await within(dialog).findByText(/2 suppliers imported/)).toBeInTheDocument()
        expect(api.calls).toHaveLength(2)
        expect(api.calls[1].dryRun).toBeUndefined()
        expect(onDone).toHaveBeenCalledTimes(1)
        expect(screen.getByRole('dialog', { name: 'Suppliers imported' })).toBeInTheDocument()
        expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument()
    })

    test('a sheet with no Phone column says so and sends nothing', async () => {
        const dialog = open()
        choose(
            xlsxFile([
                ['Business name', 'Type'],
                ['A Hotel', 'Hotel']
            ])
        )
        expect(await within(dialog).findByText(/The sheet needs these columns: Phone/)).toBeInTheDocument()
        expect(api.calls).toHaveLength(0)
        expect(within(dialog).queryByRole('button', { name: /Import \d/ })).not.toBeInTheDocument()
    })

    test('a sheet with only headings has no suppliers in it', async () => {
        const dialog = open()
        choose(xlsxFile([HEADINGS]))
        expect(await within(dialog).findByText('The sheet has no suppliers in it.')).toBeInTheDocument()
        expect(api.calls).toHaveLength(0)
    })

    test('a file that cannot be read says what to do', async () => {
        const dialog = open()
        const broken = new File(['not a spreadsheet'], 'notes.xlsx')
        broken.arrayBuffer = async () => {
            throw new Error('unreadable')
        }
        choose(broken)
        expect(await within(dialog).findByText(/Couldn’t read that file/)).toBeInTheDocument()
    })

    test('when every supplier is listed already, there is nothing to import', async () => {
        api.reply = payload => ({
            dryRun: true,
            added: 0,
            skipped: payload.rows.map(row => ({ row: row.row, reason: 'already in your suppliers' })),
            problems: []
        })
        const dialog = open()
        choose(xlsxFile([HEADINGS, ['A Hotel', 'Hotel', '', '9876543210', '', 'Manali']]))
        expect(
            await within(dialog).findByText(/0 suppliers ready to import · 1 already in your list/)
        ).toBeInTheDocument()
        expect(within(dialog).getByRole('button', { name: 'Nothing to import' })).toBeDisabled()
    })

    test('what the server refuses is shown, and the choice can be made again', async () => {
        api.fail = Object.assign(new Error('refused'), { data: { message: 'Import up to 2000 suppliers at a time' } })
        const dialog = open()
        choose(xlsxFile([HEADINGS, ['A Hotel', 'Hotel', '', '9876543210', '', 'Manali']]))
        expect(await within(dialog).findByText('Import up to 2000 suppliers at a time')).toBeInTheDocument()
        expect(within(dialog).getByRole('button', { name: 'Choose another file' })).toBeEnabled()
    })

    test('a long list of problems shows the first few and counts the rest', async () => {
        api.reply = () => ({
            dryRun: true,
            added: 1,
            skipped: [],
            problems: Array.from({ length: 15 }, (value, index) => ({
                row: index + 2,
                message: `Problem ${index + 2}`
            }))
        })
        const dialog = open()
        choose(xlsxFile([HEADINGS, ['A Hotel', 'Hotel', '', '9876543210', '', 'Manali']]))
        expect(await within(dialog).findByText('Row 2: Problem 2')).toBeInTheDocument()
        expect(within(dialog).getByText('Row 13: Problem 13')).toBeInTheDocument()
        expect(within(dialog).queryByText('Row 14: Problem 14')).not.toBeInTheDocument()
        expect(within(dialog).getByText('…and 3 more')).toBeInTheDocument()
    })

    test('headings that mean nothing here are named, so a mistyped column is noticed', async () => {
        const dialog = open()
        choose(
            xlsxFile([
                [...HEADINGS, 'Bank account'],
                ['A Hotel', 'Hotel', '', '9876543210', '', 'Manali', '123']
            ])
        )
        await waitFor(() => expect(within(dialog).getByText(/Not used: Bank account\./)).toBeInTheDocument())
    })
})
