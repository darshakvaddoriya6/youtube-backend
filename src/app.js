import express from 'express';
import cors from "cors"
import cookieParser from 'cookie-parser';

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: ture
}))
app.use(express.jason({limit: "16kb"}))
app.use(express.urlencoded({extended: ture,limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser()) 


export default {app};