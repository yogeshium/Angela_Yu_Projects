import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "yogesh password",
  port: 5432
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

var visitedCountryCodes=[];

app.get("/", async (req, res) => {
  const result = await db.query("SELECT country_code FROM visited_countries;");
  // visitedCountryCodes=[];
  result.rows.forEach((countryCode)=>{
    visitedCountryCodes.push(countryCode.country_code);
  });
  // console.log(countries);
  res.render("index.ejs",{countries:visitedCountryCodes, total: visitedCountryCodes.length});
});

app.post("/add",async(req,res)=>{
    const countryName = req.body['countryName'];
    try{
      const result = await db.query(`select * from countries where UPPER(country_name)=$1;`,[countryName.toUpperCase()]);
      // console.log(result.rows);
      
      try{
        const sql = "INSERT INTO visited_countries SELECT $1, $2, $3 WHERE NOT EXISTS (SELECT id from visited_countries where UPPER(country_name) LIKE '%'||$4||'%');";
        const values=[result.rows[0].id,result.rows[0].country_name, result.rows[0].country_code,result.rows[0].id];
        const result1 = await db.query(sql,values);
        visitedCountryCodes.push(result.rows[0].country_code)
        res.render("index.ejs",{countries:visitedCountryCodes, total: visitedCountryCodes.length});
      }
      catch(err)
      {
        const message = `This country named '${result.rows[0].country_name} is already listed as visited`;
        res.render("index.ejs",{error:message,countries:visitedCountryCodes,total:visitedCountryCodes.length});
      } 
    }
    catch(err) 
    {
      const message = `Country Named "${countryName}" does not exist.`;
      // console.log(err);
      res.render("index.ejs",{error:message,countries:visitedCountryCodes,total:visitedCountryCodes.length});
    }
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
