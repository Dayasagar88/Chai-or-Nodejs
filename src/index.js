import express from "express";
import connectDB from "./db/connectDB.js";
import dotenv from "dotenv"
import { app } from "./app.js";


dotenv.config();



connectDB().then(() => {
    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running on port ${process.env.PORT}`)
    })
}).catch((err) => {
    console.log(`DB connection error`, err)
})
 