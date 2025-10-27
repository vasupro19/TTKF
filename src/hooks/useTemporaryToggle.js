import { useState, useRef } from 'react'

function useTemporaryToggle(initial = false) {
    const [value, setValue] = useState(initial)
    const timeoutRef = useRef(null)

    function toggle(delay = 400) {
        setValue(prev => {
            const newValue = !prev
            clearTimeout(timeoutRef.current)
            timeoutRef.current = setTimeout(() => {
                setValue(prev2 => !prev2) // revert back
            }, delay)
            return newValue
        })
    }

    return [value, toggle]
}

export default useTemporaryToggle
