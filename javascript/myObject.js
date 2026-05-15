let person = {
    name: '홍길동',
    phone: '010-0000-1111',
    call: function() {
        alert('call')
    }
}

let arr = []
arr['name'] = '홍길동'
arr['phone'] = '010-0000-0000'

const newPerson = function(name, phone) {
    let p = {
        name,
        phone
    }
    return p
}

function Person(name, phone) {
    this.name = name
    this.phone = phone
    this.call = () => {
        alert('call')
    }
}

class Person2 {
    constructor(name, phone) {
        this._name = name
        this._phone = phone
    }

    // getter
    get name() { // get 키워드 붙이면(getter 메서드) .name 으로 호출 가능
        return this._name
    }

    get phone() {
        return this.phone
    }

    // setter
    set name() {
        this._name = name
    }

    set phone() {
        this.phone = phone
    }

    call() {
        alert('class Person call()')
    }
}

class Teacher extends Person2 {
    constructor(name, phone, major) {
        super(name, phone)
        this._major = major
    }
}