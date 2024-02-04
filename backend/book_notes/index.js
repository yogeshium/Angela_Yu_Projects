import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from "bcrypt";
import passport from "passport";
import {Strategy} from "passport-local";
import session from "express-session";
import env from "dotenv";


env.config();
const app = express();
const port = 3000;
const apiURL = process.env.APIURL;
const saltRounds=10;

//Database Connect
const db=new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT
});
db.connect();


app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:false}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie:{
        maxAge: 1000*60*60,
    }
}));
app.use(passport.initialize());
app.use(passport.session());



app.get("/",async(req,res)=>{
    if(req.isAuthenticated()){
        res.redirect("/book");
    }
    else{
        res.redirect("/login");
    }
});


//Route - Get all books for that user
app.get("/book",async (req,res)=>{
    
    if(req.isAuthenticated()){
        let userId=req.user.reader_id;
        let filterBy="";
        if(!isEmpty(req.query))
        {
            filterBy=req.query['filter-by'];
        }
        let user = await getUser(userId);
        let data= await getAllBooksOfUser(userId,filterBy);
        for(let i=0;i<data.length;i++)
        {
            data[i].date_read=formatDate(data[i].date_read);
            data[i].imgLink= `${apiURL}${data[i].isbn}-S.jpg`;
        }
        res.render("home.ejs",{data: data,user:user,filterBy:filterBy});
    }
    else{
        res.redirect("/login");
    }
    
});

//Route - See a particular book
app.get("/book/:id",async (req,res)=>{
    if(req.isAuthenticated()){
        let userId = req.user.reader_id;
        let bookId = req.params.id;
        let data = await getBookDetail(userId,bookId);
        data.date_read=formatDate(data.date_read);
        data.imgLink=`${apiURL}${data.isbn}-M.jpg`
        data.wholeImageLink=`${apiURL}${data.isbn}-L.jpg`
        res.render("book.ejs",{data: data});
    }
    else{
        res.redirect("/login");
    }
});

//Routes - Editing Book
app.get("/edit/:id",async(req,res)=>{
    if(req.isAuthenticated()){
        let userId = req.user.reader_id;
        let bookId = req.params.id; 
        let data = await getBookDetail(userId,bookId); 
        data.date_read= formatDate(data.date_read);
        res.render("add_edit.ejs",{data: data,toEdit:true});
    }
    else{
        res.redirect("/login");
    }
});

app.post("/edit", async(req,res)=>{
    let data = req.body;
    data.book_author = await capitalize(data.book_author);
    await updateData(data);
    res.redirect(`/book/${data.book_id}`);
});


//Route - New Book
app.get("/new",async (req,res)=>{
    if(req.isAuthenticated()){
        let userId=req.user.reader_id;
        const result = await getUser(userId);
        let data = {
            reader_id: userId,
            reader_name: result.reader_name,
        }  ;
        res.render("add_edit.ejs",{data:data});
    }
    else{
        res.redirect("/login");
    }
});

app.post("/new",async(req,res)=>{
    let data = req.body;
    data.book_id = await makeBookId(data.book_name+" By "+data.book_author);
    data.book_name=await capitalize(data.book_name);
    data.book_author = await capitalize(data.book_author);
    let result = await checkForBookIdExistInreader_book(data.book_id,data.reader_id);
    if(result){
        res.render("add_edit.ejs",{invalid:true,data:{reader_id:data.reader_id}});
    }
    else{
        await addData(data);
        res.redirect("/book");
    }
});

//Get All books for that user
async function getAllBooksOfUser(userId,filterBy)
{
    let sql="";
    let sqldata=[userId];
    if(filterBy.length)
    {
        sql=`select reader_book.reader_id as reader_id, book.book_id as book_id, book.book_name as book_name, book.book_author as author , reader_book.summary as summary, reader_book.rating as rating, reader_book.date_read as date_read , book.isbn as isbn FROM reader_book JOIN book ON reader_book.book_id = book.book_id and reader_book.reader_id=$1 ORDER BY ${filterBy};`;
    }
    else
    {
        sql="select reader_book.reader_id as reader_id, book.book_id as book_id, book.book_name as book_name, book.book_author as author , reader_book.summary as summary, reader_book.rating as rating, reader_book.date_read as date_read , book.isbn as isbn FROM reader_book JOIN book ON reader_book.book_id = book.book_id and reader_book.reader_id=$1;";
    }
    let result = await db.query(sql,sqldata);
    // console.log(result.rows);
    return result.rows;
}

//Get book full detail for a book
async function getBookDetail(userId,bookId)
{
    const sql="select reader_book.reader_id as reader_id, book.book_id as book_id, reader.reader_name as reader_name, book.book_name as book_name,book.book_author as author , reader_book.summary as summary, reader_book.rating as rating, reader_book.date_read as date_read , book.isbn as isbn, reader_book.notes as book_notes FROM reader_book JOIN book ON reader_book.book_id = book.book_id JOIN reader ON reader_book.reader_id = reader.reader_id and reader_book.reader_id=$1 and reader_book.book_id=$2;";
    const sqldata=[userId,bookId];
    let result = await db.query(sql,sqldata);
    // console.log(result.rows[0]);
    return result.rows[0];
}

//Get reader name from readerId
async function getUser(userId)
{
    const result = await db.query("SELECT reader_name FROM reader where reader_id=$1;",[userId]);
    return result.rows[0];
}

//Update book
async function updateData(data){
    
    await db.query("UPDATE reader_book SET rating=$1, date_read=$2, summary=$3, notes=$4 WHERE reader_id=$5 and book_id=$6",[data.rating,data.date_read,data.summary,data.notes,data.reader_id,data.book_id]);
    await db.query("UPDATE book SET book_author=$1,isbn=$2 WHERE book_id=$3;",[data.book_author,data.isbn,data.book_id]);
    return true;
}

//Add new book 
async function addData(data)
{
    // console.log(data);
    const result = await checkForBookIdExistInbook(data.book_id);
    if(!result)
        await db.query("INSERT INTO book values($1,$2,$3,$4);",[data.book_id,data.book_name,data.book_author,data.isbn]);
    await db.query("INSERT INTO reader_book values($1,$2,$3,$4,$5,$6);",[data.book_id,data.reader_id,data.rating,data.date_read,data.summary,data.notes]);
}

//Check if this book_id and reader_id is already in reader_book or not
async function checkForBookIdExistInreader_book(bookId,readerId)
{
    let result = await db.query("SELECT COUNT(*) FROM reader_book WHERE book_id=$1 and reader_id=$2;",[bookId,readerId]);
    if(result.rows[0].count>0)
        return true;
    else 
        return false;
}

//check if this book_id is in book or not
async function checkForBookIdExistInbook(bookId)
{
    let result = await db.query("SELECT COUNT(*) FROM book WHERE book_id=$1;",[bookId]);
    // console.log(result);
    if(result.rows[0].count==='1')
        return true;
    else 
        return false;
}

//convert timestamp to date which is acceptable by input[date]
function formatDate(d)
{
    let year = d.getFullYear().toString();
    let month=(d.getMonth()+1).toString();
    if(month.length<=1)
        month = "0"+month;
    let date= d.getDate().toString();

    return year+"-"+month+"-"+date;
}

//To make book id from book name and book author
async function makeBookId(book_name)
{
    let words = book_name.split(' ');
    let book_id = "";
    for(let i=0;i<words.length;i++)
    {
        book_id += words[i].charAt(0).toUpperCase() + words[i].slice(1);
    }
    // console.log(book_id);
    return book_id;
}

async function capitalize(book_name)
{
    let words = book_name.split(' ');
    let name = "";
    for(let i=0;i<words.length;i++)
    {
        name += words[i].charAt(0).toUpperCase() + words[i].slice(1) + " ";
    }
    return name.slice(0,-1);
}

//To Check object for empty
function isEmpty(obj) {
    for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) return false;
    }
    return true;
  }



//Route - logout
app.get("/logout", (req, res) => {
req.logout(function (err) {
    if (err) {
    return next(err);
    }
    res.redirect("/");
});
});


//Route - Register
app.get("/register",(req,res)=>{
    if(req.isAuthenticated()){
        req.logout();
    }
    res.render("register.ejs");
});
app.post("/register",async (req,res)=>{
    const readerName= req.body.name;
    const readerEmail = req.body.email;
    const readerPassword= req.body.password;

    try{
        const checkExistence = await db.query("SELECT * FROM reader WHERE email=$1;",[readerEmail]);
        if(checkExistence.rows.length>0)
        {
            res.render("register.ejs",{warning:"This Email Already Exists"});
        }
        else{
            bcrypt.hash(readerPassword,saltRounds,async (err,hash)=>{
                if(err){
                    console.log("Error while doing hashing : ",err);
                }
                else{
                    const readerId= uuidv4();
                    const result = await db.query("INSERT INTO reader VALUES($1,$2,$3,$4) RETURNING *;",
                    [readerId,readerName,readerEmail,hash]);
                    const reader = result.rows[0];
                    req.login(reader,(e)=>{
                        if(e){
                            console.log("Error on login _ register: ",e);                        }
                        else{
                            console.log("Successfully registered and loged In");
                            res.redirect("/book");
                        }
                        
                    });
                }
            });
        }
    }
    catch(err){
        console.log("Problem arises while quering : ",err);
    }
});


//Route - Login
app.get("/login",(req,res)=>{
    if(req.isAuthenticated())
        res.redirect("/book");
    else
    {
        if(req.session.messages)
        {
            const msg= req.session.messages[0];
            delete req.session.messages;
            res.render("login.ejs",{warning: msg});
        }
        else{
            res.render("login.ejs");
        }
    }
       
});

app.post("/login",passport.authenticate("local",{
    successRedirect:"/book",
    failureRedirect: "/login",
    failureMessage: true,
})
);


passport.use("local",new Strategy(
        {
            usernameField: 'email', 
            passReqToCallback: true
        },
        async function verify(req,email,password,cb){
        try{
            const result = await db.query("SELECT * FROM reader where email=$1",[email]);
            if(result.rows.length>0){
                const reader=result.rows[0];
                const storedHashedPassword=reader.password;
                
                bcrypt.compare(password,storedHashedPassword,(err,valid)=>{
                    if(err){
                        console.log("Error occured while comparing: ",err);
                        return cb(err);
                    }
                    else{
                        if(valid){
                            return cb(null,reader);
                        }
                        else{
                            req.session.messages=[];
                            return cb(null,false,{
                                message: "Password Incorret",
                            });
                        }
                    }
                });
            }
            else{
                req.session.messages=[];
                return cb(null,false,{
                    message: "Email Does not exist",
                });
            }
        }
        catch(err)
        {
            console.log("Error in performing query: ",err);
        }
    }
));

passport.serializeUser((user, cb) => {
    cb(null, user);
  });
  
  passport.deserializeUser((user, cb) => {
    cb(null, user);
  });




app.listen(port,()=>{
    console.log(`Listening to ${port}`);
});