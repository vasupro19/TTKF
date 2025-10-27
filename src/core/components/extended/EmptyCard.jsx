import React from 'react'
import MainCard from './MainCard'

function EmptyCard({ children }) {
    return (
        <MainCard
            content={false}
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                padding: 4,
                boxShadow: 3,
                borderRadius: 2,
                backgroundColor: 'white',
                width: '100%',
                maxWidth: '600px',
                margin: '0 auto'
            }}
        >
            {children}
        </MainCard>
    )
}

export default EmptyCard
