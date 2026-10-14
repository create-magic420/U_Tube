import dotenv from 'dotenv'
import connectDB from './db/index.js'
import { app } from './app.js'

dotenv.config({ path: './.env' })


app.on('error', (error) => {
    console.error('Err', error)
})
connectDB().then(() => {
    app.listen(process.env.PORT || 8000)
    console.log('Server is running on', process.env.PORT || 8000);

}).catch((err) => {
    console.error('mongo dv connection faild', err)
})