// 할일 목록 저장하는 배열
let todos = []
let todoId = 0
let currentFilter = 'all' // 현재 선택된 탭(전체)
let searchQuery = ''

const addTodo = function() {
    // 할일
    let todoInput = document.getElementById('todoInput')
    let text = todoInput.value

    // 카테고리
    // let category = document.getElementById("category")
    let category = document.querySelector('#category')
    let priority = document.querySelector('#priority')
    let dueDate = document.querySelector('#dueDate')

    if(text === '') {
        alert('할일을 입력하세요')
        todoInput.focus()
        return
    }

    let todo = {
        // id: new Date(),
        id: ++todoId,
        text,
        category: category.value,
        priority: priority.value,
        dueDate: dueDate ? dueDate.value : '',
        completed: false,
        created: new Date()
    }
    todos.push(todo)

    // 입력폼 clear
    todoInput.value = ''
    if(dueDate) dueDate.value = ''
    
    if(category && category.options.length > 0) category.value = category.options[0].value;
    if(priority && priority.options.length > 0) priority.value = priority.options[1].value;

    searchQuery = ''
    const searchInput = document.getElementById('searchKeyword')
    if(searchInput) searchInput.value = ''

    //  <div id="todolist"></div> todos 내용으로 업데이트(render)
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

const deleteTodo = function(id) {
    todos = todos.filter(function(todo) {
        return todo.id != id
    })
    renderTodos()
}

const changeFilter = function(filterType, element) {
    currentFilter = filterType

    const tabButtons = document.querySelectorAll('#filterTab .nav-link');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('text-secondary');
    });

    element.classList.add('active')
    element.classList.remove('text-secondary')

    renderTodos()
}

const calculateDDay = function(dateString) {
    if(!dateString) return '';

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const targetDate = new Date(dateString)
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return `<span class="badge bg-danger">D-Day</span>`;
    if (diffDays < 0) return `<span class="badge bg-dark">기한 만료</span>`;
    return `<span class="badge bg-outline-dark border border-dark text-dark">D-${diffDays}</span>`;
}

const handleSearch = function() {
    // 키워드 검색
    const inputVal = document.getElementById('searchKeyword').value.trim().toLowerCase()
    searchQuery = inputVal
    renderTodos()
}

const renderTodos = function() {
    const todoList = document.getElementById('todolist')
    let priority = document.getElementById('priority')
    todoList.innerHTML = ''

    // 탭 조건 필터링
    let filteredTodos = todos.filter(function(todo) {
        if(currentFilter === 'active') return !todo.completed
        if(currentFilter === 'completed') return todo.completed
        return true
    })

    // [전체/진행중/완료] 탭 내에서 키워드 검색
    if(searchQuery !== '') {
        filteredTodos = filteredTodos.filter(function(todo) {
            return todo.text.toLowerCase().includes(searchQuery)
        })
    }

    // 정렬 조건
    const sortTypeElement = document.getElementById('sortType')
    const sortType = sortTypeElement ? sortTypeElement.value : 'latest' // default가 최신순

    // 정렬 방식 적용
    const sortedTodos = [...filteredTodos].sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed - b.completed;
        }

        if (sortType === 'latest') return b.id - a.id;
        if (sortType === 'alphabet') return a.text.localeCompare(b.text);
        if (sortType === 'dueDate') {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
        return 0;
    })
    
    sortedTodos.forEach(function(todo) {
        const itemBox = document.createElement('div')
        
        itemBox.classList.add('card', 'mb-3', 'shadow-sm')

        if(todo.completed) {
            itemBox.classList.add('complete', 'bg-light', 'text-muted') 
        }

        let priorityColor = 'bg-secondary';
        if(todo.priority.includes('높음')) priorityColor = 'bg-danger';
        if(todo.priority.includes('보통')) priorityColor = 'bg-warning text-dark';
        if(todo.priority.includes('낮음')) priorityColor = 'bg-success';

        const dDayTag = todo.completed ? '' : calculateDDay(todo.dueDate)
        const dateText = todo.dueDate ?
            `<small class="text-secondary ms-2">${todo.dueDate}</small>`
            : `<small class="text-muted text-opacity-50 ms-2">마감일 없음</small>`

        const text = `
            <div class="card-body d-flex justify-content-between align-items-center py-3">
                <div>
                    <div class="d-flex align-items-center mb-2">
                        <h5 class="card-title todo-title mb-0 fw-bold">${todo.text}</h5>
                        ${dateText}
                    </div>
                    <div class="d-flex gap-1 align-items-center">
                        <span class="badge bg-secondary-subtle text-secondary-emphasis">${todo.category}</span>
                        <span class="badge ${priorityColor}">${todo.priority}</span>
                        ${dDayTag}
                    </div>
                </div>
                <div class="d-flex gap-1">
                    <button class="btn ${!todo.completed ? 'btn-outline-success' : 'btn-secondary'} 
                            btn-sm fw-bold text-center" style="width: 75px;" onclick='toggleTodo("${todo.id}")'>
                            ${!todo.completed ? '✓ 완료' : '↩ 취소'}
                    </button>
                    <button class="btn btn-outline-danger btn-sm fw-bold text-center" style="width: 75px;" onclick='deleteTodo("${todo.id}")'>
                        ✕ 삭제
                    </button>
                </div>
            </div>
        `
        
        itemBox.innerHTML = text
        todoList.appendChild(itemBox)
    })
}

window.onload = function() {
    let addBtn = document.getElementById('addBtn')
    addBtn.addEventListener('click', addTodo)
}