import express from 'express';
var app = express();
var port = 3000;

app.get("/",(req,res)=>{
    res.send("Hello There");
});
app.post("/register",(req,res)=>{
    console.log(req);
    res.sendStatus(200);
});
app.put("/users/replace",(req,res)=>{
    res.sendStatus(200);
});
app.patch("/users/update",(req,res)=>{
    res.sendStatus(200);
});
app.delete("/users/delete",(req,res)=>{
    res.sendStatus(200);
});


app.get("/contact",(req,res)=>{
    res.send("This is Contact page");
})
app.listen(port,()=>{
    console.log(`Listening to the Port: ${port}`)
});