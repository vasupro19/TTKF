import PropTypes from 'prop-types'
import styles from './KeyboardButton.module.css'

export default function KeyboardButton({ text }) {
    return (
        <button className={styles.button} type='button'>
            {text}
        </button>
    )
}
KeyboardButton.propTypes = {
    text: PropTypes.string
}
