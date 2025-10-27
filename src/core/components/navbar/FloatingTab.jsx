import { motion } from 'framer-motion'

export default function FloatingTab({ activeTab }) {
    return (
        <motion.div
            initial={{ scale: 0.6, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.6, y: 30, opacity: 0 }}
            transition={{
                type: 'spring',
                stiffness: 280,
                damping: 22,
                mass: 1.2,
                velocity: 2
            }}
            style={{
                backgroundColor: '#f2f5f8',
                color: '#333333',
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)',
                whiteSpace: 'nowrap',
                border: 'none',
                transformOrigin: 'bottom center',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)'
            }}
        >
            {activeTab.label}
            {activeTab.count > 0 && (
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '22px',
                        height: '20px',
                        padding: '0 6px',
                        marginLeft: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor: '#333333',
                        borderRadius: '11px'
                    }}
                >
                    {activeTab.count > 99 ? '99+' : activeTab.count}
                </span>
            )}
        </motion.div>
    )
}
