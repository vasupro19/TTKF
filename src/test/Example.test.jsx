import { screen, render } from '@testing-library/react'
import { expect, test } from 'vitest'

function FirstTest() {
    return (
        <div>
            <h2> First test </h2>
        </div>
    )
}

test('Example component rendered successfully', () => {
    render(<FirstTest />)

    const element = screen.getByText(/first test/i)

    expect(element).toBeInTheDocument()
})
