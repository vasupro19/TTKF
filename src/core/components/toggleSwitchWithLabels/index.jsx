/* eslint-disable */
import React from 'react'
import PropTypes from 'prop-types'
import styles from './toggleSwitchWithLabels.module.css'

const ToggleSwitchWithLabels = ({ name, checked, onChange, noText = 'No', yesText = 'Yes' }) => {
    return (
        <label className={styles.toggleSwitch}>
            <span className={styles.labelText}>{noText}</span>
            <div className={styles.switchWrapper}>
                <input type='checkbox' name={name} checked={checked} onChange={onChange} className={styles.input} />
                <div className={styles.background}>
                    <div className={styles.handle}></div>
                </div>
            </div>
            <span className={styles.labelText}>{yesText}</span>
        </label>
    )
}

ToggleSwitchWithLabels.propTypes = {
    name: PropTypes.string.isRequired,
    checked: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
}

export default ToggleSwitchWithLabels
