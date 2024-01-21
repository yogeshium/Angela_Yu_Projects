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

/*Get Route*/
app.get("/", async (req, res) => {
  let visitedCountryCodes= await allVisitedCountries();
  console.log(visitedCountryCodes);
  res.render("index.ejs",{countries:visitedCountryCodes, total: visitedCountryCodes.length});
});

/*Post Route*/
app.post("/add",async(req,res)=>{
    const countryName = req.body['countryName'];
    /*If input field is empty*/
    if(countryName.length==0)
    {
      let visitedCountryCodes= await allVisitedCountries();
      console.log(visitedCountryCodes);
      res.render("index.ejs",{countries:visitedCountryCodes, total: visitedCountryCodes.length});
    }
    else
    {
      const result = await db.query(`select * from countries where UPPER(country_name) LIKE $1||'%';`,[countryName.toUpperCase()]);
      /* If zero or multiple results came then such country name does not exists.
        Suppose input is like 'i' only, then there will be many countries whose name starts with 'i'.
        So we declare that this country name does not exist.
      */
      if(result.rowCount<1 || result.rowCount>1)
      {
        const message = `Country Named "${countryName}" does not exist.`;
        let visitedCountryCodes = await allVisitedCountries();
        res.render("index.ejs",{error:message,countries:visitedCountryCodes,total:visitedCountryCodes.length});
      }
      else{ 
        try{
          /*
            Inserting the found country in visited_countries list.
          */
          const sql = "INSERT INTO visited_countries SELECT $1, $2, $3 WHERE NOT EXISTS (SELECT id from visited_countries where UPPER(country_name) LIKE $4||'%');";
          const values=[result.rows[0].id,result.rows[0].country_name, result.rows[0].country_code,result.rows[0].id];
          const result1 = await db.query(sql,values);
          
          let visitedCountryCodes = await allVisitedCountries();
          res.render("index.ejs",{countries:visitedCountryCodes, total: visitedCountryCodes.length});
        }
        catch(err)
        {
          /*
            If there is any error found on inserting the country on visited_countries list then it means the country already exist. 
          */
          const message = `This country named '${result.rows[0].country_name}' is already listed as visited`;
          let visitedCountryCodes = await allVisitedCountries();
          console.log(visitedCountryCodes);
          res.render("index.ejs",{error:message,countries:visitedCountryCodes,total:visitedCountryCodes.length});
        } 
      }
    }
  });
  

  /*
    Quering for all country_codes of countries in visited_countries list.
    and return that list.
  */
  async function allVisitedCountries()
  {
    try{
      const result = await db.query("SELECT country_code FROM visited_countries;");
      console.log(result);
      let visitedCountryCodes=[];
      result.rows.forEach((countryCode)=>{
        visitedCountryCodes.push(countryCode.country_code);
      });
      return visitedCountryCodes;
    }
    catch(err){
        console.log(err);
    }
  }
  
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
  