const http = require('http')

http.get(
    {
        hostname: 'localhost',
        port: 131,
        path: '/v1/leads/generate-pdf/2/3',
        method: 'GET'
    },
    res => {
        console.log(`STATUS: ${res.statusCode}`)
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`)

        let size = 0
        res.on('data', chunk => {
            size += chunk.length
        })
        res.on('end', () => {
            console.log('Total bytes:', size)
        })
    }
)
