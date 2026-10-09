//  Find the form and the list on the webpage and keep them in variables form and list
const form = document.getElementById("task-form");
const list = document.getElementById("task-list");
const filter = document.getElementById("filter");
let selectedSubject = "all";
let tasks = []; // starts empty -> the server will fill it


// Ask the server for all the tasks, then draw them
async function loadTasks() {
  const response = await fetch("/api/tasks");
  if (!response.ok) {          // for example 401: not logged in
    tasks = [];
    renderTasks();
    return;
  }
  tasks = await response.json();
  renderTasks();
}

// Fill the dropdown with subject we have:
function updateFilterOptions(){
    const subjects = [];
    tasks.forEach(function(t){
        if(!subjects.includes(t.subject)){      //only add each subject once
            subjects.push(t.subject);
        }
    });
    if(!subjects.includes(selectedSubject)){
        selectedSubject = "all";
    }
    filter.innerHTML ='<option value ="all">ALL subjects</option>';
    subjects.forEach(function(s){
        const option = document.createElement("option");
        option.value = s;
        option.textContent = s;
        filter.appendChild(option);
    });
    filter.value = selectedSubject; // Keep the current choice selected.
}

// Draw all tasks on the page
function renderTasks(){
    list.innerHTML ="";     // Empty the list first
    updateFilterOptions();
    const today = new Date().toLocaleDateString("en-CA");        // gives today's date like 2026-10-07
    
    tasks.sort(function(a,b){
        return a.date.localeCompare(b.date);
    });
    tasks.forEach(function (t){      // do this for every task
         if (selectedSubject !== "all" && t.subject !== selectedSubject) {
         return;   // skip this task, go to the next one
        }
        const li = document.createElement("li");
        if(t.date < today && !t.done){
            li.classList.add("overdue");
        }

        // The text part
        const text = document.createElement("span");
        text.textContent = `${t.subject} - ${t.task} (due ${t.date})`;
        if(t.done){
            text.classList.add("done");     // adds CSS class "done"
        }

        // The Done button : Tell the server to flip done then reload
        const doneBtn = document.createElement("button");
        doneBtn.textContent = t.done ? "Undo" : "Done";
        doneBtn.addEventListener("click", async function(){
            await fetch("/api/tasks/" +t.id, { method: "PUT"});
            loadTasks();
        });

        // The Delete Button :  tell the server to delete then reload
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent ="Delete";
        deleteBtn.classList.add("delete");
        deleteBtn.addEventListener("click", async function(){
            await fetch("/api/tasks/"+ t.id, {method: "DELETE"});
            loadTasks();
        });
        

        // Put both buttons in one box so they sit together
        const actions = document.createElement("div");
        actions.classList.add("actions");
        actions.appendChild(doneBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(text);
        li.appendChild(actions);
        list.appendChild(li);
    });
}


//  When the form is submitted, we run this function
form.addEventListener("submit", async function(event){
    // Prevents/Stops the page from reloading
    event.preventDefault();

    // Read what user typed in each input box
    const subject = document.getElementById("subject").value;
    const task = document.getElementById("task").value;
    const date = document.getElementById("date").value;

    await fetch("/api/tasks",{
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ subject: subject, task: task, date: date})
    });
    
    //  Empty the boxes so the user can type next task
    form.reset();
    loadTasks();
});
filter.addEventListener("change", function () {
    selectedSubject = filter.value;   // remember the choice
    renderTasks();                    // redraw with the filter
});

loadTasks(); // first load when the page opens