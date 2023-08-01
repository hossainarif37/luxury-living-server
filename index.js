const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000

app.use(express.json())
app.use(cors())

app.get('/users', (req, res) => {
    res.send({ name: 'Md Arif', email: 'onexboyarif6833@gmail.com' })
})

app.get('/', (req, res) => {
    res.send('Luxury Living Server Side')
})

app.listen(port, () => {
    console.log(`Luxury Living listening on port ${port}`)
})