import MainCard from '@/core/components/extended/MainCard'
import { Box } from '@mui/material'
import React from 'react'
import CustomTabsView from './CustomTabsView'
import FiltersSection from './FiltersSection'

export default function StorageWiseInventory() {
    return (
        <MainCard content={false}>
            <Box
                sx={{
                    paddingTop: 0.5,
                    paddingBottom: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    minHeight: 'calc(100vh - 72px)' // Adjust height to fit the view
                }}
            >
                <FiltersSection />
                <CustomTabsView />
            </Box>
        </MainCard>
    )
}
