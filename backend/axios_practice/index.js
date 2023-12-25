import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Step 1: Make sure that when a user visits the home page,
//   it shows a random activity.You will need to check the format of the
//   JSON data from response.data and edit the index.ejs file accordingly.
app.get("/", async (req, res) => {
  let apiURL = "https://bored-api.appbrewery.com/random";
  try {
    const response = await axios.get(apiURL);
    const result = response.data;
    console.log(result);
    res.render("index.ejs", { data: result });
  } catch (error) {
    console.error("Failed to make request:", error.message);
    res.render("index.ejs", {
      error: error.message,
    });
  }
});

app.post("/", async (req, res) => {
  console.log(req.body);
  let apiURL = "https://bored-api.appbrewery.com/filter?";
  if(req.body.type && req.body.participants)
      apiURL = apiURL+"type="+req.body.type+"&participants="+req.body.participants;
  else if(req.body.type)
    apiURL = apiURL+"type="+req.body.type;
  else
    apiURL = apiURL+"participants="+req.body.participants;
  
  console.log(apiURL);
  try{
      const response = await axios.get(apiURL);
      const result = response.data;
      console.log(result);
      res.render("index.ejs",{data: result[Math.floor(Math.random() * result.length)]});
    }
    catch(error)
    {
      console.log(error.message);
      if(error.response.status === 404)
        res.render("index.ejs", {error: "No activities that match your criteria."});
    }

});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
