/* eslint-disable */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Grid, Divider, TextField, Typography } from '@mui/material'
import { AccessTime } from '@mui/icons-material'

import MainCard from '@core/components/extended/MainCard'
import IdentityCard from '@core/components/IdentityCard'
import CustomFileUpload from '@/core/components/forms/CustomFileUpload'
import ManageViewJobTable from '@/app/views/tables/ManageViewJobs'
import { useDispatch } from 'react-redux'

function Index() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState(0)

    // New job data to be distributed between components
    const newJobData = {
        id: 8,
        job_id: 'JOB008',
        progress_bar: '60%',
        status: 'Part Completed',
        created_by: 'Fiona Blue',
        created_at: '27-01-2025 17:30',
        assigned_to: 'George Red',
        no_of_bins: 4,
        total_qty: 100,
        pending_qty: 40,
        started_at: '27-01-2025 18:00',
        completed_at: '27-01-2025 18:45'
    }

    // Identity card shows primary job identity details
    const identityCardData = [
        { label: 'Job ID', value: newJobData.job_id },
        { label: 'Created By', value: newJobData.created_by },
        { label: 'Created At', value: newJobData.created_at },
        { label: 'Assigned To', value: newJobData.assigned_to }
    ]

    // Details data used for read-only text fields
    const detailsData = [
        { label: 'Progress', value: newJobData.progress_bar },
        { label: 'Status', value: newJobData.status },
        { label: 'No of Bins', value: newJobData.no_of_bins },
        { label: 'Total Qty', value: newJobData.total_qty },
        { label: 'Pending Qty', value: newJobData.pending_qty },
        { label: 'Started At', value: newJobData.started_at },
        { label: 'Completed At', value: newJobData.completed_at }
    ]

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue)
    }

    return (
        <MainCard sx={{ py: '1px' }} contentSX={{ px: '2px', py: 1.5 }}>
            <Grid
                container
                gap={4}
                sx={{
                    border: '1px solid',
                    borderColor: 'grey.borderLight',
                    px: 1,
                    py: 1,
                    borderRadius: '8px'
                }}
            >
                <Grid container xs={12} md={3.6} spacing={2}>
                    <Grid item xs={12} md={6} lg={12} sx={{ mb: 2 }}>
                        <IdentityCard data={identityCardData} showProfileImage={false} />
                    </Grid>
                </Grid>
                <Grid md={8.3} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
                        {/* You can uncomment the Tabs component if needed */}
                        <Box sx={{ p: 1, pt: 2 }}>
                            <Grid container spacing={2}>
                                {detailsData.map((field, index) => (
                                    <Grid item xs={12} sm={4} key={index}>
                                        <TextField
                                            fullWidth
                                            label={field.label}
                                            value={field.value}
                                            InputProps={{ readOnly: true }}
                                            sx={{
                                                '& input': {
                                                    backgroundColor: '#fff',
                                                    p: '10px 6px',
                                                    height: '20px',
                                                    color:
                                                        field.label === 'Gate Entry Status' &&
                                                        field.value === 'Completed'
                                                            ? 'secondary.dark'
                                                            : 'unset'
                                                },
                                                '& .MuiInputBase-root.MuiOutlinedInput-root': {
                                                    backgroundColor: 'white'
                                                },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'gray'
                                                },
                                                flexGrow: 1
                                            }}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={12} md={6} lg={12}>
                    <Divider
                        sx={{
                            mt: '-2rem',
                            borderColor: '#BCC1CA',
                            mb: '1rem',
                            boxShadow: '1px 1px 4px #00000054'
                        }}
                    />
                    <ManageViewJobTable />
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default Index
