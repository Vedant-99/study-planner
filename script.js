//  Find the form and the list on the webpage and keep them in variables form and list
const form = document.getElementById("task-form");
const list = document.getElementById("task-list");

// Load saved tasks. If nothing is saved yet, start with an empty array
let tasks = JSON.parse(localStorage.getItem("tasks"))|| [];

// Save the tasks array into the browser
function saveTasks(){
    localStorage.setItem("tasks",JSON.stringify(tasks));
}

// Draw all tasks on the page
function rendorTasks(){
    list.innerHTML ="";     // Empty the list first
    tasks.forEach(function (t, index){      // do this for every task
        const li = document.createElement("li");

        // The text part
        const text = document.createElement("span");
        text.textContent = `${t.subject} - ${t.task} (due ${t.date})`;
        if(t.done){
            text.classList.add("done");     // adds CSS class "done"
        }

        // The Done button
        const doneBtn = document.createElement("button");
        doneBtn.textContent = t.done ? "Undo" : "Done";
        doneBtn.addEventListener("click", function(){
            tasks[index].done = !tasks[index].done; // flip true <-> false
            saveTasks();
            rendorTasks();
        });

        li.appendChild(text);
        li.appendChild(doneBtn);
        list.appendChild(li);
    });
}

//  When the form is submitted, we run this function
form.addEventListener("submit",function(event){
    // Prevents/Stops the page from reloading
    event.preventDefault();

    // Read what user typed in each input box
    const subject = document.getElementById("subject").value;
    const task = document.getElementById("task").value;
    const date = document.getElementById("date").value;

    // Add one task object into array
    tasks.push({ subject: subject, task: task , date: date, done: false });

    saveTasks();        // save taks to browser
    rendorTasks();      // redraw the list
    
    //  Empty the boxes so the user can type next task
    form.reset();
});

rendorTasks();