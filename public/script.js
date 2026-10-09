//  Find the form and the list on the webpage and keep them in variables form and list
const form = document.getElementById("task-form");
const list = document.getElementById("task-list");
const filter = document.getElementById("filter");
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authSubmit = document.getElementById("auth-submit");
const authMessage = document.getElementById("auth-message");
const authToggle = document.getElementById("auth-toggle");
const userEmail = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");
let isSignupMode = false;   // false = log in, true = sign up
let selectedSubject = "all";
let tasks = []; // starts empty -> the server will fill it


// Ask the server for all the tasks, then draw them
async function loadTasks() {
  const response = await fetch("/api/tasks");
  if (response.status === 401) {   // not logged in
    showAuth();
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

// Show the login screen
function showAuth() {
  authSection.classList.remove("hidden");
  appSection.classList.add("hidden");
}

// Show the planner for a logged-in user
function showApp(user) {
  userEmail.textContent = user.email;
  appSection.classList.remove("hidden");
  authSection.classList.add("hidden");
  loadTasks();
}

// On page load: ask the server who is logged in
async function checkLogin() {
  const response = await fetch("/api/me");
  if (response.ok) {
    showApp(await response.json());
  } else {
    showAuth();
  }
}

// Switch between "Log in" and "Sign up"
authToggle.addEventListener("click", function (event) {
  event.preventDefault();
  isSignupMode = !isSignupMode;
  authTitle.textContent = isSignupMode ? "Create account" : "Log in";
  authSubmit.textContent = isSignupMode ? "Sign up" : "Log in";
  authToggle.textContent = isSignupMode
    ? "Already have an account? Log in"
    : "New here? Create an account";
  authMessage.textContent = "";
});

// Submit the login / sign-up form
authForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, password: password })
  };
  authMessage.textContent = "";

  // For sign-up: create the account first, then log in below
  if (isSignupMode) {
    const signupResponse = await fetch("/api/signup", options);
    const signupData = await signupResponse.json();
    if (!signupResponse.ok) {
      authMessage.textContent = signupData.message;
      return;
    }
  }

  const loginResponse = await fetch("/api/login", options);
  const loginData = await loginResponse.json();
  if (!loginResponse.ok) {
    authMessage.textContent = loginData.message;
    return;
  }

  authForm.reset();
  showApp(loginData);
});

// Log out
logoutBtn.addEventListener("click", async function () {
  await fetch("/api/logout", { method: "POST" });
  tasks = [];
  showAuth();
});

checkLogin();   // runs when the page opens