//To see how the final website should work, run "node solution.js".
//Make sure you have installed all the dependencies with "npm i".
//The password is ILoveProgramming

import express from "express";
import bodyParser from "body-parser";
import {dirname} from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

var isPasswordCorrect=false;

app.use(bodyParser.urlencoded({extended:true}));

function authenticate(req,res,next){
    let password = req.body["password"];
    if(password==="ILoveProgramming")
        isPasswordCorrect = true;
    // else
    //     isPasswordCorrect=false;
    next();
}

app.use(authenticate);

app.get("/",(req,res)=>{
    res.sendFile(__dirname + "/public/index.html");
});

app.post("/check",(req,res)=>{
    if(isPasswordCorrect)
        res.sendFile(__dirname + "/public/secret.html");
    else  
        res.redirect("/");
});

app.listen(port, ()=>
{
    console.log("Listening to "+port);
});