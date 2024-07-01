// app.js
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const connection = require('./db');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', (req, res) => {
  const { 'login-user': uname, 'login-txtpassword': pwd } = req.body;
  
  const sql = "SELECT * FROM tbluseraccount WHERE username = ?";
  connection.query(sql, [uname], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      res.sendStatus(500);
      return;
    }
    
    if (results.length === 0) {
      res.send("<script>alert('Username not existing.'); window.location.href='/';</script>");
      return;
    }
    
    const user = results[0];
    const hashedPass = user.password;
    
    if (!bcrypt.compareSync(pwd, hashedPass)) {
      res.send("<script>alert('Incorrect password'); window.location.href='/';</script>");
      return;
    }
    
    req.session.username = user.username;
    req.session.profile = user.pictureid;
    req.session.id = user.userid;
    
    res.redirect('/match');
  });
});

app.get('/match', (req, res) => {
  if (!req.session.username) {
    res.redirect('/');
    return;
  }
  res.send('Welcome to the match page!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
