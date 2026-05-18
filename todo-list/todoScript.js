// 할일 목록 저장하는 배열
let todos = []
let todoId = 0

const addTodo = function() {
    let todoInput = document.getElementById('todoInput')
    let text = todoInput.value

    if(text === '') {
        alert('할일을 입력하세요')
        todoInput.focus()
        return
    }

    let todo = {
        // id: new Date(),
        id: ++todoId,
        text,
        completed: false
    }
    todos.push(todo)

    // 입력폼 clear
    todoInput.value = ''

    // <div id='widitlist" > 
    renderTodos()
}

const toggleTodo = function(id) {
    todos = todos.map(function(todo) {
        if(todo.id == id)
            todo.completed = !todo.completed
        return todo
    })

    renderTodos()
}

const renderTodos = function() {
    const todoList = document.getElementById('todolist')
    todoList.innerHTML = ''
    todos.forEach(function(todo) {
        const liTag = document.createElement('li')

        // class에 complete 추가
        if(todo.completed)
            liTag.classList.add('complete')

        const text = `<h3>${todo.text}</h3>
        <button onclick='toggleTodo("${todo.id}")'>${!todo.completed ? '완료' : '취소'}</button>
        `
        
        liTag.innerHTML = text
        todoList.appendChild(liTag)
    })
}

window.onload = function() {
    let addBtn = document.getElementById('addBtn')
    addBtn.addEventListener('click', addTodo)
}