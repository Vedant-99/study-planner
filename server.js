// Bring in the express library
const express = require("express");

// Create our app
const app = express();

// Choose a "door number" (port) where the server listens
const PORT = 4000;

// Serve the files inside the "public" folder to the browser
app.use(express.static("public"));

// When the browser asks for the home page "/", reply with some text
app.get("/hello",function(req,res){
    res.send("Hello from my server!");
});

// For now, tasks live in a list inside the server (a database comes later)
let tasks = [
  { id: 1, subject: "DBMS", task: "ACID Properties", date: "2026-10-12", done: false },
  { id: 2, subject: "CN", task: "IP4", date: "2026-10-15", done: false }
];

// When someone asks for /api/tasks, send back the tasks as JSON
app.get("/api/tasks", function (req, res) {
  res.json(tasks);
});

// Start the server 
app.listen(PORT ,function(){
    console.log("Server running at http://localhost:"+ PORT);
});