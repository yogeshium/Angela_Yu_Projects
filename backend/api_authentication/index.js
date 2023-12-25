import express from "express";
import axios from "axios";

const app = express();
const port = 3000;
const API_URL = "https://secrets-api.appbrewery.com/";

//TODO 1: Fill in your values for the 3 types of auth.
const yourUsername = "yogesh";
const yourPassword = "yogesh";

app.get("/", (req, res) => {
  res.render("index.ejs", { content: "API Response." });
});

app.get("/noAuth", async(req, res) => {
  try{
    const response = await axios.get(API_URL+"random");
    res.render("index.ejs",{content:JSON.stringify(response.data)});
  }
  catch(error){
    console.error(error.message);
  }
});

app.get("/basicAuth", async (req, res) => {
    try{
      const response = await axios.get(API_URL+"all?page=2", {
        auth: {
          username: yourUsername,
          password: yourPassword,
        },
      });

      res.render("index.ejs",{content:JSON.stringify(response.data)});
    }
    catch(error){
      console.error(error.message);
    }
  
});

app.get("/apiKey", async(req, res) => {
  try{
    const response = await axios.get(API_URL+"generate-api-key");
    const yourAPIKey = response.data.apiKey;
    try{
      const response2 = await axios.get(API_URL+"filter",{
        params: {
          apiKey: yourAPIKey,
          score: 5,
        },
      });

      res.render("index.ejs",{content: JSON.stringify(response2.data)});
    }
    catch(error){
      console.log(error.message);
    }
  }
  catch(error)
  {
    console.error(error.message);
  }
});

app.get("/bearerToken", async (req, res) => {

  try{
    const response1 = await axios.post(API_URL+"get-auth-token",{
      username:"yogesh",
      password: "yogesh ",
    });
    const tokenBeared = response1.data.token;
    console.log(tokenBeared);
    try{
      const response2 = await axios.get(API_URL+"secrets/1",{
        headers: {
          Authorization : `Bearer ${tokenBeared}`
        },
      });

      res.render("index.ejs",{content: JSON.stringify(response2.data)});
      
    }
    catch(error)
    {
      console.log(error.message);
    }
  }
  catch(error)
  {
    console.log(error.message);
  }

});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
