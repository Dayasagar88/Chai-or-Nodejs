import express from "express";
import {quotes} from "./data.js"

const app = express();

app.get("/", (_, res) => {
    res.send("Server is ready!")
})

app.get("/api/qoutes", (_, res) => {
    res.send(quotes)
})

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server listen at ${port}`);
})