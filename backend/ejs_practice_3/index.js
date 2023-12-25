import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
var count = -1;

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  if(count===-1)
    res.render("index.ejs");
  else
    res.render("index.ejs",{letterCount:count});
});

app.post("/submit", (req, res) => {
    count =  req.body["fName"].length + req.body["lName"].length;
    res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
