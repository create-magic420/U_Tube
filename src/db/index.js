import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

const connectDB = async () => {

    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log('MongoDB Connected host', connectionInstance?.connection?.host);

    } catch (error) {
        console.error('connectDB Error 123', error)
    }
}

export default connectDB