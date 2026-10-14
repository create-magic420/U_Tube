import express from 'express'
import cors from 'cors'
import cookieParsar from 'cookie-parser'
import userRouter from './routes/User.js'
import videoRouter from './routes/Video.js'
import commentRouter from './routes/Comment.js'
const app = express()


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" })) // how mch data get
app.use(express.urlencoded({ extended: true, limit: "16kb" })) //allow query data encoded
app.use(express.static("public")) // file data store in public file
app.use(cookieParsar())

app.use('/api/v1/users', userRouter)
app.use('/api/v1/videos', videoRouter)
app.use('/api/v1/comments', commentRouter)

export { app }