// Event listener that runs once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    // Retrieve stored tasks from localStorage (if any) or set to an empty array if no tasks are found
    const storedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = storedTasks;  // Assign the retrieved tasks to the tasks array
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dueDate').min = today;
    
    updateTaskList();  // Update the displayed task list
    updateStats();  // Update the task statistics (completed/total tasks)
});

let tasks = [];  // Array to hold task objects
let editingIndex = null;  // Index of the task currently being edited (null if not editing)

// Function to save tasks to localStorage
const saveTasks = () => {
    localStorage.setItem('tasks', JSON.stringify(tasks));  // Convert tasks array to a string and store it in localStorage
};

// Function to add a new task or update an existing task (if editing)
const addTask = (e) => {
    if (e) e.preventDefault();  // Prevent form submission behavior (page reload)
    const taskInput = document.getElementById('taskInput');
    const dueDateInput = document.getElementById('dueDate');
    const text = taskInput.value.trim();  // Get the task input value and remove extra spaces
    const dueDate = dueDateInput.value;

    if (text && dueDate) {  // Ensure both task text and due date are provided
        if (editingIndex !== null) {
            // If editing an existing task, update its text and reset completion status
            tasks[editingIndex].text = text;
            tasks[editingIndex].dueDate = dueDate;
            tasks[editingIndex].completed = false; // Reset task completion when editing
            editingIndex = null;  // Clear the editing index
            document.getElementById('taskForm').classList.remove('editing');  // Remove the "editing" class from the form
        } else {
            // If not editing, add a new task to the tasks array
            tasks.push({ 
                text: text, 
                completed: false,
                dueDate: dueDate 
            });
        }

        taskInput.value = "";  // Clear the task input field
        dueDateInput.value = ""; // Clear the due date input
        updateTaskList();  // Update the task list UI
        saveTasks();  // Save the updated tasks to localStorage
    } else {
        alert("Please enter both task text and a due date.");  // Alert user if due date is missing
    }
};

// Function to toggle the completion status of a task
const toggleTaskComplete = (index) => {
    tasks[index].completed = !tasks[index].completed;  // Toggle completion status
    updateTaskList();  // Update the task list UI
    saveTasks();  // Save the updated tasks to localStorage
};

// Function to delete a task
const deleteTask = (index) => {
    // If deleting the task that is currently being edited, cancel edit mode
    if (editingIndex === index) {
        editingIndex = null;
        document.getElementById('taskInput').value = "";  // Clear the task input field
        document.getElementById('dueDate').value = ""; // Clear the due date input
        document.getElementById('taskForm').classList.remove('editing');  // Remove the "editing" class from the form
    }
    tasks.splice(index, 1);  // Remove the task from the tasks array
    updateTaskList();  // Update the task list UI
    saveTasks();  // Save the updated tasks to localStorage
};

// Function to enable task editing (populate input field with task text)
const editTask = (index) => {
    const taskInput = document.getElementById('taskInput');
    const dueDateInput = document.getElementById('dueDate');
    taskInput.value = tasks[index].text;  // Set the input field to the task's text
    dueDateInput.value = tasks[index].dueDate || ""; // Set the due date if it exists
    editingIndex = index;  // Set the index of the task being edited
    taskInput.focus();  // Focus on the input field for easy editing
    document.getElementById('taskForm').classList.add('editing');  // Add the "editing" class to the form for visual indication
};

// Function to format date for display
const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// Function to calculate days remaining
const getDaysRemaining = (dueDate) => {
    if (!dueDate) return "";
    const today = new Date();
    const due = new Date(dueDate);
    // Reset time components to compare only dates
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    return `${diffDays} days left`;
};

// Function to update task statistics (completed vs total tasks) and progress bar
const updateStats = () => {
    const completedTasks = tasks.filter(task => task.completed).length;  // Count completed tasks
    const totalTasks = tasks.length;  // Get the total number of tasks
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;  // Calculate progress as percentage
    const progressBar = document.getElementById('progress');

    // Update the width of the progress bar based on completion percentage
    progressBar.style.width = `${progress}%`;
    // Update the displayed task count (e.g., "3/5")
    document.getElementById('numbers').innerText = `${completedTasks}/${totalTasks}`;

    // If all tasks are completed, trigger the confetti animation
    if (tasks.length && completedTasks === totalTasks) {
        blackconfetti();  // Trigger confetti when all tasks are completed
    }
};

// Function to update the task list in the UI
const updateTaskList = () => {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';  // Clear the current task list
    
    // Sort tasks by due date (nearest first) and completion status
    tasks.sort((a, b) => {
        // Completed tasks go to the bottom
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
        
        // Then sort by due date (earliest first)
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });

    tasks.forEach((task, index) => {
        const listItem = document.createElement('li');
        const daysRemaining = task.dueDate ? getDaysRemaining(task.dueDate) : "";
        const isOverdue = daysRemaining.includes("Overdue");

        listItem.innerHTML = `
        <div class="taskItem">
           <div class="task ${task.completed ? "completed" : ""} ${isOverdue ? "overdue" : ""}">
             <input type="checkbox" class="checkbox" ${task.completed ? "checked" : ""} onclick="toggleTaskComplete(${index})"/>
             <div class="task-content">
               <p>${task.text}</p>
               <div class="task-meta">
                 ${task.dueDate ? `
                   <span class="due-date">${formatDate(task.dueDate)}</span>
                   <span class="days-remaining ${isOverdue ? "overdue" : ""}">${daysRemaining}</span>
                 ` : ''}
               </div>
             </div>
           </div>
           <div class="icons">
             <img src="./img/edit.png" onclick="editTask(${index})" alt="Edit" title="Edit Task"/>
             <img src="./img/bin.png" onclick="deleteTask(${index})" alt="Delete" title="Delete Task"/>
           </div>
         </div>
        `;
        
        taskList.appendChild(listItem);
    });
    
    updateStats();
};

// Event listener to handle task form submission
document.getElementById('taskForm').addEventListener('submit', addTask);

// Optional: Add task when the Enter key is pressed in the task input field
document.getElementById('taskInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask(e);  // Add task when Enter key is pressed
    }
});

// Function to trigger confetti effect when all tasks are completed
const blackconfetti = () => {
    const defaults = {
        spread: 360,
        ticks: 50,
        gravity: 0,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["star"],
        colors: ["FFE400", "FFBD00", "E89400", "FFCA6C", "FDFFB8"],  // Confetti colors
    };
    
    // Function to shoot confetti particles
    function shoot() {
        confetti({
            ...defaults,
            particleCount: 40,
            scalar: 1.2,
            shapes: ["star"],
        });
    
        confetti({
            ...defaults,
            particleCount: 10,
            scalar: 0.75,
            shapes: ["circle"],
        });
    }
    
    // Trigger confetti in intervals to create a visual effect
    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
};
