import { useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { Box, Tab, Tabs, Typography } from '@mui/material'
import MainCard from '@core/components/extended/MainCard'
import ServiceLedgerTable from '@/app/views/tables/transactions'
import { openSnackbar } from '@app/store/slices/snackbar'
import GuestPaymentsTab from './GuestPaymentsTab'
import SupplierPaymentsTab from './SupplierPaymentsTab'

const TABS = [
    { key: 'guest', label: 'Guest payments' },
    { key: 'supplier', label: 'Supplier payments' },
    { key: 'balances', label: 'Supplier balances' }
]

/**
 * Transactions, for accounts: guest payments to verify (and everything already decided), payments made to
 * suppliers, and what each supplier is still owed (the ledger this page used to be). The tab is in the address
 * (?tab=), so a link or a reload keeps it.
 */
function TransactionsPage() {
    const dispatch = useDispatch()
    const [params, setParams] = useSearchParams()
    const tab = TABS.some(item => item.key === params.get('tab')) ? params.get('tab') : 'guest'

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

    return (
        <MainCard content={false} sx={{ py: '2px' }}>
            <Box sx={{ px: 2, pt: 2 }}>
                <Typography variant='h3'>Transactions</Typography>
                <Tabs
                    value={tab}
                    onChange={(event, value) => setParams(value === 'guest' ? {} : { tab: value }, { replace: true })}
                    aria-label='Transactions'
                    sx={{ mt: 1 }}
                >
                    {TABS.map(item => (
                        <Tab key={item.key} value={item.key} label={item.label} sx={{ textTransform: 'none' }} />
                    ))}
                </Tabs>
            </Box>
            {tab === 'balances' ? (
                <ServiceLedgerTable />
            ) : (
                <Box sx={{ p: 2 }}>
                    {tab === 'guest' ? <GuestPaymentsTab notify={notify} /> : <SupplierPaymentsTab notify={notify} />}
                </Box>
            )}
        </MainCard>
    )
}

export default TransactionsPage
