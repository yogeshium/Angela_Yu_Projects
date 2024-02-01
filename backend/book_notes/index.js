import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { v4 as uuidv4 } from 'uuid';
import axios from "axios";

const db=new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "book_notes",
    password: "yogesh password",
    port: 5432,
});
db.connect();

var userId = "7ac47af1-c7fd-47a5-8cdf-2e1f9cbf51d9";

const app = express();
const port = 3000;
const apiURL = "https://covers.openlibrary.org/b/isbn/";

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));


//Route - Get all books for that user
app.get("/book",async (req,res)=>{
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
    res.render("home.ejs",{data: data,user:user,filterBy:filterBy})
});

//Route - See a particular book
app.get("/book/:id",async (req,res)=>{
    let bookId = req.params.id;
    let data = await getBookDetail(userId,bookId);
    data.date_read=formatDate(data.date_read);
    data.imgLink=`${apiURL}${data.isbn}-M.jpg`
    data.wholeImageLink=`${apiURL}${data.isbn}-L.jpg`
    res.render("book.ejs",{data: data});
});

//Routes - Editing Book
app.get("/edit/:id",async(req,res)=>{
    let bookId = req.params.id; 
    let data = await getBookDetail(userId,bookId); 
    data.date_read= formatDate(data.date_read);
    res.render("add_edit.ejs",{data: data,toEdit:true});
});

app.post("/edit", async(req,res)=>{
    let data = req.body;
    data.book_author = await capitalize(data.book_author);
    // console.log(data);
    await updateData(data);
    res.redirect(`/book/${data.book_id}`);
});


//Route - New Book
app.get("/new",(req,res)=>{
    let data = {
        reader_id: userId,
    }  ;
    res.render("add_edit.ejs",{data:data});
});

app.post("/new",async(req,res)=>{
    let data = req.body;
    data.book_id = await makeBookId(data.book_name+" By "+data.book_author);
    data.book_name=await capitalize(data.book_name);
    data.book_author = await capitalize(data.book_author);
    // console.log(data.book_id);
    //check if this book_id already exist in reader_book table
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

app.listen(port,()=>{
    console.log(`Listening to ${port}`);``
});