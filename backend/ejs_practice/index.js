import express from "express";
import bodyParser from "body-parser";
import {dirname} from "path";
import {fileURLToPath} from "url";

const app= express();
const __dirname = dirname(fileURLToPath(import.meta.url));
const port = 3000;

app.get("/",(req,res)=>{
    const d = new Date();
    res.render("home.ejs",{
        day: d.getDay()
    });
});

app.listen(port, ()=>{
    console.log("Listening to "+port);
});
