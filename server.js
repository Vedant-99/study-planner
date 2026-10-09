// Bring in the express library
const express = require("express");
const { DatabaseSync } = require("node:sqlite");


// Create our app and open the database file
const app = express();
const db = new DatabaseSync("tasks.db");  // Open (or Create) the database file
const PORT = 4000;  // Choose a "door number" (port) where the server listens


// Create the tasks table if it does not exists yet
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  task TEXT NOT NULL,
  date TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0 
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  )
`);
// Middleware: read JSON from the browser, and serve the "public" folder
app.use(express.json());   // lets the server read JSON sent by the browser
app.use(express.static("public"));  // Serve the files inside the "public" folder to the browser


// When the browser asks for the home page "/", reply with some text
app.get("/hello",function(req,res){
    res.send("Hello from my server!");
});

// Read: get all tasks
app.get("/api/tasks", function( req, res){
  const tasks = db.prepare("SELECT * FROM tasks").all();
  res.json(tasks);
});

// Create: add a task
app.post("/api/tasks", function(req,res){
  const {subject, task, date} = req.body;
  const result = db
  .prepare("INSERT INTO tasks (subject, task, date) VALUES (?,?,?)")
  .run(subject, task, date);
res.status(201).json({
  id: Number(result.lastInsertRowid),
  subject,
  task,
  date,
  done:0
});
});


// DELETE: remove a task
app.delete("/api/tasks/:id", function(req,res){
  db.prepare("DELETE FROM tasks WHERE id = ?").run(Number(req.params.id));
  res.json({ message: "Task deleted" });
});


// UPDATE: flip done on a task
app.put("/api/tasks/:id", function (req, res){
  const id = Number(req.params.id);
  const result = db.prepare("UPDATE tasks SET done = NOT done WHERE id = ?").run(id);
  if( result.changes === 0) return res.status(404).json({ message: "Task not found" });
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  res.json(task);
});



// Start the server 
app.listen(PORT ,function(){
    console.log("Server running at http://localhost:"+ PORT);
});