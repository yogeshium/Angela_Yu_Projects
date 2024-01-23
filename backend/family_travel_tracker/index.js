import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

/* Database connection */
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "country_tour",
    password: "yogesh password",
    port: 5432
});
db.connect();


app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));


/* Routes */
app.get("/",async(req,res)=>{
    const users = await getAllUsers();
    // const users = [];
    if(users.length>0)
    {
        const visitedCodes = await getVisitedCountries(users[0].id);
        res.render("home.ejs",{users:users,color:users[0].color,total:visitedCodes.length,countries:visitedCodes,userID:1});
    }
    else
    {
        res.render("home.ejs",{users:[],color:"",total:0,countries:[]});
    }
});
   
app.post("/user",async(req,res)=>{
    
    if(req.body.user){
      const users = await getAllUsers();
      const userID = req.body.user;
      if(users.length>0)
      {
          const visitedCodes = await getVisitedCountries(userID);
          res.render("home.ejs",{users:users,color:users[userID-1].color,total:visitedCodes.length,countries:visitedCodes,userID:userID});
      }
      else
      {
          res.render("home.ejs",{users:[],color:"",total:0,countries:[]});
      }
    }
    else{
      res.render("new.ejs");
    }
});

app.post("/add",async(req,res)=>{
    const countryName = req.body['country'];
    const userID = req.body.user;
    const users= await getAllUsers();
    /*If input field is empty*/
    if(countryName.length==0)
    {
      let visitedCountryCodes= await getVisitedCountries(userID);
      res.render("home.ejs",{users: users,color: users[userID-1].color,countries:visitedCountryCodes, total: visitedCountryCodes.length,userID:userID});
    }
    else
    {
      const result = await db.query(`select * from country where UPPER(country_name) LIKE $1||'%';`,[countryName.toUpperCase()]);
      /* If zero or multiple results came then such country name does not exists.
        Suppose input is like 'i' only, then there will be many countries whose name starts with 'i'.
        So we declare that this country name does not exist.
      */
      if(result.rowCount<1 || result.rowCount>1)
      {
        const message = `Country Named "${countryName}" does not exist.`;
        let visitedCountryCodes = await getVisitedCountries(userID);
        res.render("home.ejs",{error:message,users: users,color: users[userID-1].color,countries:visitedCountryCodes,total:visitedCountryCodes.length,userID:userID});
      }
      else{ 
        const countryID = result.rows[0].id; 
        const result_count = await db.query("SELECT * FROM visited WHERE country_id=$1 and person_id=$2",[countryID,userID]);
        if(result_count.rowCount==0)
        {
            /*  Inserting the found country in visited list. */
            await db.query("INSERT INTO visited VALUES($1,$2);",[countryID,userID]);
            let visitedCountryCodes = await getVisitedCountries(userID);
            res.render("home.ejs",{users: users,color: users[userID-1].color,countries:visitedCountryCodes, total: visitedCountryCodes.length,userID:userID});
        }
        else
        {
          /*
            If there is any error found on inserting the country on visited list then it means that country is already visited by that user (data already exists). 
          */
          const msg = `This country named '${result.rows[0].country_name}' is already listed as visited`;
          let visitedCountryCodes = await getVisitedCountries(userID);
          res.render("home.ejs",{error:msg,users: users,color: users[userID-1].color,countries:visitedCountryCodes,total:visitedCountryCodes.length,userID:userID});
        }
        
      }
    }
});


app.post("/new",async(req,res)=>{
    if(req.body.name && req.body.color)
    { 
       
      const userName=req.body.name, userColor = req.body.color;
      const result_count = await db.query("SELECT count(*) FROM person;");
      const userID=parseInt(result_count.rows[0].count)+1;
      // console.log(userID);
      const result = await db.query("INSERT INTO person VALUES($1, $2, $3);",[userID,userName,userColor]);
      // console.log(result);
      res.redirect("/"); 
    }
}); 


app.listen(port, ()=>{
    console.log(`Listening to port: ${port}`);
});


async function getVisitedCountries(id)
{
    const sql = "select country_code from country Join visited On country.id=visited.country_id and visited.person_id=$1;";
    const values=[id];
    const result = await db.query(sql,values);
    let visitedCodes=[];
    result.rows.forEach((code)=>{
        visitedCodes.push(code.country_code);
    });
    // console.log(visitedCodes);
    return visitedCodes;
}

async function getAllUsers()
{
    const resultPerson = await db.query("select * from person;");
    const users = resultPerson.rows;
    return users; 
}

// style="background-color: <%= user.color %>;"
// style="background-color: <%= color %>;"