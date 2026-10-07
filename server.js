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

// Start the server 
app.listen(PORT ,function(){
    console.log("Server running at http://localhost:"+ PORT);
});