// Bring in the express library
const express = require("express");
const { DatabaseSync } = require("node:sqlite");
const bcrypt = require("bcryptjs");
const session = require("express-session");


// Create our app and open the database file
const app = express();
const db = new DatabaseSync("tasks.db");  // Open (or Create) the database file
const PORT = process.env.PORT || 4000;  // use the host's port, or 4000 on your computer

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  )
`);

// Create the tasks table if it does not exists yet
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  task TEXT NOT NULL,
  date TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) 
  )
`);

// Middleware: read JSON from the browser, and serve the "public" folder
app.use(express.json());   // lets the server read JSON sent by the browser
app.use(express.static("public"));  // Serve the files inside the "public" folder to the browser

// Sessions: remember who is logged in using a cookie
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,   // JS in the page can not read the cookie
      sameSite: "lax",
      maxAge: 1000*60*60*24*7   // Stays logged in for 7 days
    }
  })
);

// Middelware:  runs before a route , and blocks user who are not logged in
function requireLogin(req, res, next){
  if(!req.session.userId){
    return res.status(401).json({message: "Please log in"});
  }
  next();     // logged in, so continue to the real route
}


// When the browser asks for the home page "/", reply with some text
app.get("/hello",function(req,res){
    res.send("Hello from my server!");
});

// Read: only my tasks
app.get("/api/tasks", requireLogin, function( req, res){
  const tasks = db
    .prepare("SELECT * FROM tasks WHERE user_id=?")
    .all(req.session.userId);
  res.json(tasks);
});

// Create: add a task that belong to me 
app.post("/api/tasks", requireLogin, function(req,res){
  const subject = (req.body.subject || "").trim();
  const task = (req.body.task || "").trim();
  const date = req.body.date || "";

  // Check the input before saving anything
  if (
    !subject ||
    !task ||
    subject.length > 50 ||
    task.length > 200 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return res
      .status(400)
      .json({ message: "Subject, task and a valid date (YYYY-MM-DD) are required" });
  }
  const result = db
  .prepare("INSERT INTO tasks (user_id,subject, task, date) VALUES (?,?,?,?)")
  .run(req.session.userId,subject, task, date);
res.status(201).json({
  id: Number(result.lastInsertRowid),
  subject,
  task,
  date,
  done:0
});
});


// DELETE: remove a task only if it is mine
app.delete("/api/tasks/:id", requireLogin,function(req,res){
  db.prepare("DELETE FROM tasks WHERE id = ? AND user_id=?")
    .run(Number(req.params.id), req.session.userId);
  res.json({ message: "Task deleted" });
});


// UPDATE: flip done on a task
app.put("/api/tasks/:id", requireLogin, function (req, res){
  const id = Number(req.params.id);
  const result = db
    .prepare("UPDATE tasks SET done = NOT done WHERE id = ? AND user_id=?")
    .run(id,req.session.userId);

  if( result.changes === 0) return res.status(404).json({ message: "Task not found" });

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  res.json(task);
});


// SIGN UP: create a new user
app.post("/api/signup", function (req, res){
  const email = (req.body.email || "").trim().toLowerCase();
  const password = req.body.password || "";
  
  // check the input
  if(!email || password.length <6){
    return res
    .status(400)
    .json({ message: "Email and a password of at least 6 characters are required" });
  }

  // Is this eamil already used?
  const existing = db.prepare("SELECT id FROM users WHERE email =?").get(email);
  if(existing){
    return res.status(409).json({ message: "Email already registered" });
  }

  // Scramble the password, then save only the scrambled version
  const hash = bcrypt.hashSync(password,10);
  const result = db
    .prepare("INSERT INTO users (email, password_hash) VALUES (?,?)")
    .run(email,hash);
  res.status(201).json({ id: Number(result.lastInsertRowid), email });
});


// LOG IN
app.post("/api/login", function(req, res){
  const email = (req.body.email || "").trim().toLowerCase();
  const password = req.body.password || "";

  const user = db.prepare("SELECT *FROM users WHERE email =?").get(email);

  // Same message for both mistakes, so attackers can't tell which email exists
  if(!user || !bcrypt.compareSync(password, user.password_hash)){
    return res.status(401).json({message: "Invalid email or password" });
  
  }
  
  req.session.userId = user.id;   // remember this user in the session
  res.json({ id: user.id, email : user.email});

});


// WHO AM I: tells the page who is logged in
app.get("/api/me", function(req ,res){
  if(!req.session.userId){
    return res.status(401).json({message: "Not logged in"});
  }
  const user = db
    .prepare("SELECT id, email FROM users WHERE id =?")
    .get(req.session.userId);
  res.json(user);
});

// LOG OUT
app.post("/api/logout", function(req, res){
  req.session.destroy(function() {
    res.json({message: "Logged out" });
  });
});

// Start the server 
app.listen(PORT ,function(){
    console.log("Server running at http://localhost:"+ PORT);
});