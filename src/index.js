import express from "express";
import connectDB from "./db/connectDB.js";
const app = express();
import dotenv from "dotenv"


dotenv.config();


const port = process.env.PORT || 3000;

app.listen(port, async () => { 
    try {
        await connectDB();
        console.log(`Server listen at ${port}`);
    } catch (error) {
        console.log("port error : ",error);
    }  
})                           