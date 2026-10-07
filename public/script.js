//  Find the form and the list on the webpage and keep them in variables form and list
const form = document.getElementById("task-form");
const list = document.getElementById("task-list");
const filter = document.getElementById("filter");
let selectedSubject = "all";

// Load saved tasks. If nothing is saved yet, start with an empty array
let tasks = JSON.parse(localStorage.getItem("tasks"))|| [];

// Save the tasks array into the browser
function saveTasks(){
    localStorage.setItem("tasks",JSON.stringify(tasks));
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
    tasks.forEach(function (t, index){      // do this for every task
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

        // The Done button
        const doneBtn = document.createElement("button");
        doneBtn.textContent = t.done ? "Undo" : "Done";
        doneBtn.addEventListener("click", function(){
            tasks[index].done = !tasks[index].done; // flip true <-> false
            saveTasks();
            renderTasks();
        });

        // The Delete Button
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent ="Delete";
        deleteBtn.classList.add("delete");
        deleteBtn.addEventListener("click",function(){
            tasks.splice(index,1);      // remove 1 task at this position
            saveTasks();
            renderTasks();

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
    renderTasks();      // redraw the list
    
    //  Empty the boxes so the user can type next task
    form.reset();
});
filter.addEventListener("change", function () {
    selectedSubject = filter.value;   // remember the choice
    renderTasks();                    // redraw with the filter
});

renderTasks();