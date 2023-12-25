import express from "express";
// import bodyParser from "body-parser";
// import morgan from "morgan";
import {dirname} from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const app=express();
const port=3000;

var logger=(req,res,next)=>{
    console.log("Requested url: "+req.url);
    next();
};

// app.use(bodyParser.urlencoded({extended:true}));

// app.post("/submit",(req,res)=>{
//     console.log(req.body);
// });
// app.use(morgan("combined"));

app.use(logger);

app.get("/",(req,res)=>{
    res.sendFile(__dirname+"/public/home.html");
});

app.listen(port,()=>{
    console.log(`Listening to the port ${port}`);
});