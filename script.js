// 1. Select the form and elements from the DOM
let tasks = [];
const taskForm = document.getElementById("task-form");
const taskTitle = document.getElementById("task-title");
const taskSubject = document.getElementById("task-subjects");
const taskDate = document.getElementById("task-date");
const taskPriority = document.getElementById("task-priority");
const taskList = document.getElementById("task-list");

const statusFilter = document.getElementById("status-filter");
const subjectFilter = document.getElementById("subject-filter");

// save tasks to browser
try{
    const savedTasks= JSON.parse(
        localStorage.getItem("study-tasks") || "[]"
    );
    if(Array.isArray(savedTasks)){
        tasks = savedTasks.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.title === "string" && 
            typeof task.subject === "string" && 
            typeof task.completed === "boolean"            
        );
    }
} catch {
    tasks= [];
}

// save task in local Storage

function saveTasks() {
    try{ 
        localStorage.setItem("study-tasks",JSON.stringify(tasks));
        return true;
    } catch{
        alert ("Could not save tasks. Check your browser storage.");
        return false;
    }
}

// Update the progress number and bar
function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter (task => task.completed).length;
    const pending = total - completed;
    const percentage = total === 0
    ? 0
    : Math.round ((completed / total)* 100);

    document.getElementById ("total-tasks").textContent = total;
    document.getElementById ("completed-tasks").textContent = completed;
    document.getElementById ("pending-tasks").textContent = pending;
    document.getElementById ("progress").textContent = percentage + "%";

    const progressBar = document.getElementById("progress-bar");

    if (progressBar) {
        progressBar.style.width= percentage + "%";
    }
}

// create a label for task details
function createTag(text, className =""){
    const tag = document.createElement("span");
    tag.className= "task-tag " + className;
    tag.textContent = text;
    return tag;
}

// Display task on the page
function renderTasks() {
    taskList.innerHTML ="";

    const filteredTasks= tasks.filter(task =>{
        const status = statusFilter.value.trim();
        const subject= subjectFilter.value.trim();

        const statusMatches =
        status === "ALL" ||
        status === "ALL" ||
        (status === "Pending" && !task.completed) ||
        (status === "Completed" && task.completed);

        const subjectMatches =
        subject === "ALL" || subject === task.subject;

        return statusMatches && subjectMatches        
    });

    // Show a message if no tasks are found
    if (filteredTasks.length === 0){
        const message = document.createElement("li");
        message.className ="empty-state";
        message.textContent= tasks.length === 0
        ? "No tasks yet. Add your first task!"
        : "No task match your filters.";

        taskList.appendChild(message);
        return;
    }
    filteredTasks.forEach (task =>{
        const item = document.createElement ("li");

        if (task.completed){
            item.classList.add("task-completed");
        }
        const top= document.createElement("div");
        top. className = "task-top";

        // Checkbox to complete or reopen a task
        const checkbox = document.createElement("input");
        checkbox.type= "checkbox";
        checkbox.checked = task.completed;
        checkbox.className = "task-check";
        checkbox.setAttribute ("aria-label", "Complete " + task.title);

        checkbox.addEventListener("change", () => {
            const previousValue = task.completed;
            task.completed= checkbox.checked;
            
            if (!saveTasks()) {
                task.completed = previousValue;
            }

            updateProgress();
            renderTasks ();
        });

        const content = document.createElement("div");
        content.className= "task-content";

        const title= document.createElement("div");
        title.className = "task-title";
        title.textContent = task.title;

        const details= document.createElement("div");
        details.className = "task-details";

        details.appendChild (createTag(task.subject));
        details.appendChild(
            createTag(task.priority, "priority-" + task.priority)
        );
        // Show the due date if selected 
        if (task.date) { 
            const dateTag = createTag("Due " + task.date);

            const today = new Date ();
            const todayString =[
                today.getFullYear(), 
                String(today.getMonth() + 1).padStart(2, "0"),
                String(today.getDate()).padStart(2, "0") 
            ].join("-");

            if (!task.completed && task.date< todayString){
                dateTag.classList.add ("overdue");
                dateTag.textContent += "(Overdue)";
            }
            details.appendChild(dateTag);
        }
        content.append(title, details);
        top.append(checkbox, content);

        //delete button
        const actions =document.createElement("div");
        actions.className = "task-actions";

        const deleteButton = document.createElement("button");
        deleteButton.type= "button";
        deleteButton.className="delete-button";
        deleteButton.textContent="Delete";

        deleteButton.addEventListener("click", () => {
            const oldTasks = tasks;
            tasks = tasks.filter(savedTask => savedTask.id !== task.id);

            if (!saveTasks()){
                tasks = oldTasks;
            }
            updateProgress();
            renderTasks();
        });
        actions.appendChild(deleteButton);
        item.append(top, actions);
        taskList.appendChild(item);
    });
}

// 2. Listen for the form submission (when the button is clicked)
taskForm.addEventListener("submit", event => {
  event.preventDefault(); // Stops the page from refreshing

  const title = taskTitle.value.trim();
  const subject = taskSubject.value.trim();
  const date= taskDate.value;
  const priority = taskPriority.value.trim();

  if (!title) {
    alert ("Please enter a task name.");
    taskTitle.focus();
    return;
  }

  if(
    date && 
    (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(new Date(date + "T00:00:00").getTime()) ||
    new Date(date + "T00:00:00").toISOString().slice(0, 10) !== date)
  ){
    alert ("Please select a valid due date.");
    return;
  }
  const task= {
    id: Date.now().toString()+ Math.random().toString(36).slice(2),
    title: title,
    subject: subject,
    date: date, 
    priority: priority, 
    completed: false
  };
  tasks.push (task);

  if (!saveTasks()){
    tasks.pop();
    return;
  }
  taskForm.reset();

  statusFilter.value = "ALL";
  subjectFilter.value = "ALL";

  updateProgress();
  renderTasks();
  taskTitle.focus();
});

statusFilter.addEventListener("change", renderTasks);
subjectFilter.addEventListener("change", renderTasks);

updateProgress();
renderTasks();