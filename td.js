// ========================================
// 1. SELECT HTML ELEMENTS
// ========================================

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoDueDate = document.getElementById("todo-due-date");

const todoList = document.getElementById("todo-list");
const emptyMessage = document.getElementById("empty-message");
const noFilterResults = document.getElementById("no-filter-results");

const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

const taskCounter = document.getElementById("task-counter");
const completionCounter = document.getElementById("completion-counter");

const filterButtons = document.querySelectorAll(".filter-btn");
const themeToggle = document.getElementById("theme-toggle");


// ========================================
// 2. LOAD TASKS FROM LOCAL STORAGE
// ========================================

let todos = [];
let currentFilter = "all";
let editingId = null;

try {
    const savedTodos = localStorage.getItem("todos");
    const parsedTodos = savedTodos ? JSON.parse(savedTodos) : [];

    if (Array.isArray(parsedTodos)) {
        todos = parsedTodos
            .filter(todo =>
                todo &&
                typeof todo.id === "string" &&
                typeof todo.text === "string" &&
                typeof todo.completed === "boolean"
            )
            .map(todo => ({
                id: todo.id,
                text: todo.text,
                completed: todo.completed,
                dueDate:
                    typeof todo.dueDate === "string" &&
                    /^\d{4}-\d{2}-\d{2}$/.test(todo.dueDate) &&
                    isValidDate(todo.dueDate)
                        ? todo.dueDate
                        : ""
            }));
    }
} catch (error) {
    console.error("Unable to load saved tasks:", error);
    todos = [];
}


// ========================================
// 3. HELPER: VALIDATE A DATE
// ========================================

function isValidDate(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return false;
    }

    const [year, month, day] = dateString.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}


// ========================================
// 4. SAVE TASKS TO LOCAL STORAGE
// ========================================

function saveTodos() {
    try {
        localStorage.setItem("todos", JSON.stringify(todos));
        return true;
    } catch (error) {
        console.error("Unable to save tasks:", error);

        alert(
            "Your changes could not be saved. " +
            "Check your browser storage settings."
        );

        return false;
    }
}


// ========================================
// 5. GET TODAY'S DATE
// ========================================

function getToday() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ========================================
// 6. FORMAT A DUE DATE
// ========================================

function formatDate(dateString) {
    if (!isValidDate(dateString)) {
        return "";
    }

    const [year, month, day] = dateString.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}


// ========================================
// 7. UPDATE TASK COUNTERS
// ========================================

function updateCounters() {
    const remaining = todos.filter(
        todo => !todo.completed
    ).length;

    const completed = todos.filter(
        todo => todo.completed
    ).length;

    taskCounter.textContent =
        `${remaining} task${remaining === 1 ? "" : "s"} remaining`;

    completionCounter.textContent =
        `${completed} completed`;
}


// ========================================
// 8. FILTER TASKS
// ========================================

function getFilteredTodos() {
    if (currentFilter === "active") {
        return todos.filter(todo => !todo.completed);
    }

    if (currentFilter === "completed") {
        return todos.filter(todo => todo.completed);
    }

    return todos;
}


// ========================================
// 9. DISPLAY TASKS
// ========================================

function renderTodos() {
    // Clear the existing list.
    todoList.replaceChildren();

    // Update task counters.
    updateCounters();

    // Get tasks matching the selected filter.
    const filteredTodos = getFilteredTodos();

    // Display the correct empty-state message.
    emptyMessage.hidden = todos.length !== 0;

    noFilterResults.hidden = !(
        todos.length > 0 && filteredTodos.length === 0
    );

    // Create each task.
    filteredTodos.forEach(function (todo) {
        const li = document.createElement("li");

        li.className = "todo-item";

        if (todo.completed) {
            li.classList.add("completed");
        }

        // Checkbox.
        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.className = "todo-checkbox";
        checkbox.checked = todo.completed;

        checkbox.setAttribute(
            "aria-label",
            `Mark ${todo.text} as completed`
        );

        // Task details container.
        const details = document.createElement("div");

        details.className = "todo-details";

        // Task description.
        const span = document.createElement("span");

        span.className = "todo-text";
        span.textContent = todo.text;

        details.appendChild(span);

        // Due date.
        if (todo.dueDate) {
            const dateLabel = document.createElement("span");

            dateLabel.className = "todo-date";
            dateLabel.textContent = `Due: ${formatDate(todo.dueDate)}`;

            if (!todo.completed && todo.dueDate < getToday()) {
                dateLabel.textContent += " — Overdue";
                dateLabel.classList.add("overdue");
            } else if (
                !todo.completed &&
                todo.dueDate === getToday()
            ) {
                dateLabel.textContent += " — Due today";
                dateLabel.classList.add("due-today");
            }

            details.appendChild(dateLabel);
        }

        // Action buttons container.
        const actions = document.createElement("div");

        actions.className = "todo-actions";

        // Edit button.
        const editButton = document.createElement("button");

        editButton.type = "button";
        editButton.className = "edit-btn";
        editButton.textContent = "Edit";

        editButton.setAttribute(
            "aria-label",
            `Edit ${todo.text}`
        );

        // Delete button.
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.setAttribute(
            "aria-label",
            `Delete ${todo.text}`
        );

        // Mark task as completed or active.
        checkbox.addEventListener("change", function () {
            const previousState = todo.completed;

            todo.completed = checkbox.checked;

            if (!saveTodos()) {
                todo.completed = previousState;
            }

            renderTodos();
        });

        // Edit task.
        editButton.addEventListener("click", function () {
            startEditing(todo);
        });

        // Delete task.
        deleteButton.addEventListener("click", function () {
            deleteTodo(todo.id);
        });

        // Assemble the task.
        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        li.appendChild(checkbox);
        li.appendChild(details);
        li.appendChild(actions);

        todoList.appendChild(li);
    });
}


// ========================================
// 10. ADD A NEW TASK
// ========================================

function addTodo(text, dueDate) {
    const newTodo = {
        id: crypto.randomUUID(),
        text: text,
        completed: false,
        dueDate: dueDate
    };

    todos.push(newTodo);

    if (!saveTodos()) {
        todos.pop();
        return false;
    }

    // Show the new task immediately.
    currentFilter = "all";
    updateActiveFilter();
    renderTodos();

    return true;
}


// ========================================
// 11. EDIT AN EXISTING TASK
// ========================================

function startEditing(todo) {
    editingId = todo.id;

    // Fill the form with existing values.
    todoInput.value = todo.text;
    todoDueDate.value = todo.dueDate || "";

    // Update button labels.
    submitBtn.textContent = "Update Task";
    cancelEditBtn.hidden = false;

    // Bring the form into view.
    todoInput.focus();

    todoForm.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


// ========================================
// 12. UPDATE A TASK
// ========================================

function updateTodo(id, text, dueDate) {
    const index = todos.findIndex(
        todo => todo.id === id
    );

    if (index === -1) {
        return false;
    }

    // Preserve the old task in case saving fails.
    const previousTodo = { ...todos[index] };

    todos[index] = {
        ...todos[index],
        text: text,
        dueDate: dueDate
    };

    if (!saveTodos()) {
        todos[index] = previousTodo;
        return false;
    }

    resetForm();
    renderTodos();

    return true;
}


// ========================================
// 13. CANCEL EDITING
// ========================================

function resetForm() {
    editingId = null;

    todoForm.reset();

    submitBtn.textContent = "Add Task";
    cancelEditBtn.hidden = true;
}

cancelEditBtn.addEventListener("click", function () {
    resetForm();
});


// ========================================
// 14. DELETE A TASK
// ========================================

function deleteTodo(id) {
    const index = todos.findIndex(
        todo => todo.id === id
    );

    if (index === -1) {
        return;
    }

    const deletedTodo = todos[index];

    // Remove the selected task.
    todos.splice(index, 1);

    if (!saveTodos()) {
        // Restore it if saving fails.
        todos.splice(index, 0, deletedTodo);
        renderTodos();
        return;
    }

    // If the deleted task was being edited,
    // reset the form.
    if (editingId === id) {
        resetForm();
    }

    renderTodos();
}


// ========================================
// 15. HANDLE FORM SUBMISSION
// ========================================

todoForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const text = todoInput.value.trim();
    const dueDate = todoDueDate.value;

    // Reject empty task descriptions.
    if (!text) {
        todoInput.focus();
        return;
    }

    // Validate an optional due date.
    if (dueDate && !isValidDate(dueDate)) {
        alert("Please enter a valid due date.");
        return;
    }

    // Update an existing task or create a new one.
    if (editingId !== null) {
        updateTodo(editingId, text, dueDate);
    } else {
        const added = addTodo(text, dueDate);

        if (added) {
            resetForm();
            todoInput.focus();
        }
    }
});


// ========================================
// 16. HANDLE FILTER BUTTONS
// ========================================

function updateActiveFilter() {
    filterButtons.forEach(function (button) {
        const isActive = button.dataset.filter === currentFilter;

        button.classList.toggle("active", isActive);

        button.setAttribute(
            "aria-pressed",
            String(isActive)
        );
    });
}

filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        currentFilter = button.dataset.filter;

        updateActiveFilter();
        renderTodos();
    });
});


// ========================================
// 17. DARK MODE
// ========================================

function applyTheme(theme) {
    const darkMode = theme === "dark";

    document.body.classList.toggle("dark-mode", darkMode);

    themeToggle.textContent = darkMode
        ? "☀️ Light"
        : "🌙 Dark";

    themeToggle.setAttribute(
        "aria-label",
        darkMode
            ? "Switch to light mode"
            : "Switch to dark mode"
    );
}


// Load the saved theme.
let savedTheme = "light";

try {
    savedTheme = localStorage.getItem("todo-theme") || "light";
} catch (error) {
    console.error("Unable to load theme:", error);
}

applyTheme(savedTheme === "dark" ? "dark" : "light");


// Toggle between themes.
themeToggle.addEventListener("click", function () {
    const isDark = document.body.classList.contains("dark-mode");

    const newTheme = isDark ? "light" : "dark";

    try {
        localStorage.setItem("todo-theme", newTheme);
    } catch (error) {
        console.error("Unable to save theme:", error);
    }

    applyTheme(newTheme);
});


// ========================================
// 18. INITIALIZE THE APPLICATION
// ========================================

updateActiveFilter();
renderTodos();