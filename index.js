
const {readFile, readFileSync}=require('fs');

const express=require('express');

const app= express();

const exphbs = require('express-handlebars');

const bodyParser= require('body-parser');



const mysql = require('mysql2/promise');
const { Connector } = require('@google-cloud/cloud-sql-connector');
const connector = new Connector();

let pool;
let logeduser;
let logedprofileid;
let logedusername;
async function createConnectionPool() {
    const clientOpts = await connector.getOptions({
        instanceConnectionName: 'teknopidu:us-central1:nico',
        ipType: 'PUBLIC',
      });
      pool = await mysql.createPool({
        ...clientOpts,
        user: 'abadiano',
        password: 'jerwin123',
        database: 'AbadianoCarreon',
      });
    
}




async function executeQuery(query) {
    if (!pool) {
        await createConnectionPool();
    }

    try {
        const conn = await pool.getConnection();
        const [result] = await conn.query(query);
        console.table(result);
        await conn.release(); // Release the connection back to the pool
        return result;


    } catch (err) {
        console.error('Error executing query:', err);
    }
}
executeQuery(`SELECT * FROM tbluser`).catch(err => {
    console.error('Error creating connection pool: ', err);
  });
  executeQuery(`SELECT * FROM tbluseraccount`).catch(err => {
    console.error('Error creating connection pool: ', err);
  });






app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars'); // Set handlebars as the view engine

//mw
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static('public'));

app.get('/',(request,response)=>{
    readFile('public/index.html','utf8',(err,html)=>{
        if(err){
            response.status(500).send("sorry");
        }
        response.send(html);
    });
});
app.post('/users',async(request,response)=>{
    const headContent = exphbs.handlebars.compile(`
        {{{> head}}}
    `)();
    const bodyContent = exphbs.handlebars.compile(`
        {{{> body}}}
    `)();

    response.render('users',{
        head: headContent,
        body: bodyContent,
        profileid:logedprofileurl,
        username:logedusername,
        status:"Active now"

    });

});


app.post('/login',async(request,response)=>{

    // const [result]=executeQuery("SELECT * FROM tbluseraccount WHERE ");
  
    console.log(request.body);
    let username=request.body['login-user'];
    let password=request.body['login-password'];
    const conn = await pool.getConnection();

    const [existingUser] = await conn.query('SELECT * FROM tbluseraccount WHERE username = ? AND password = ?', [username, password]);


    if (existingUser.length > 0) {
        logeduser=existingUser[0].userid;
        logedusername=existingUser[0].username;

        const [userprofile] = await conn.query('SELECT * FROM tblpictures WHERE userid = ?' , [existingUser[0].userid]);
    
        logedprofileurl=userprofile[0].url;
   
        response.render('match',{
            stuff: "this is stuff",
            profileid:logedprofileurl,
            username:logedusername

        });

    }
    console.log(logeduser);
    
  
    
});

app.post('/register', async (request, response) => {
    // Extract data from the request body
    const { txtfirstname, txtlastname, txtage, txtgender, txtcourse, txtemail, 'txtusername': username, 'txtpassword': password, checkPassword } = request.body;

    try {
        const conn = await pool.getConnection();

        // Start a transaction

        // Check if the username already exists
        const [existingUser] = await conn.query('SELECT * FROM tbluseraccount WHERE username = ?', [username]);

        if (existingUser.length > 0) {
            response.status(400).send('Username already exists');
            return;
        }
            console.log("user doesnt exist");
        // Insert into tbluser
        const [userResult] = await conn.query(
            'INSERT INTO tbluser (firstname, lastname, gender, age) VALUES (?, ?, ?, ?)',
            [txtfirstname, txtlastname, txtgender, txtage]
        );
        const userId = userResult.insertId;
        logeduser=userId;
        console.log("user added");


        // Insert into tbluseraccount
        await conn.query(
            'INSERT INTO tbluseraccount (email, username, password, userid) VALUES (?, ?, ?, ?)',
            [txtemail, username, password, userId]
        );
        console.log("useraccount added");


        // Insert into tblpreference
        await conn.query(
            'INSERT INTO tblpreference (userid, preferedcourse, preferedgender, preferedminimumage, preferedmaximumage) VALUES (?, ?, ?, ?, ?)',
            [userId, 'defaultCourse','df', 18, 30]
        );
        console.log("preference added");


        // Insert into tblpictures
        await conn.query(
            'INSERT INTO tblpictures (userid) VALUES (?)',
            [userId]
        );
        console.log("pictures added");


        // Commit the transaction
        await conn.commit();
        conn.release();

        // Render a response
        executeQuery(`SELECT * FROM tbluser`).catch(err => {
            console.error('Error creating connection pool: ', err);
          });
        response.redirect('index.html');

    } catch (err) {
        console.error('Error executing query:', err);
        response.status(500).send('Internal Server Error');
    }
});


app.listen(process.env.PORT||3000,()=>console.log("App available on http://localhost:3000"));