const API = {
    BASE_URL:'https://todo-app-brev.onrender.com',

    getToken(){
        return localStorage.getItem('authToken');
    },
    //const id = document.getElementById('deleteTodoIdInput').value;

    async request(endpoint,options={}){
        const token = this.getToken();
        const config = {
            headers:{
                'Content-Type':'application/json',
                ...(token&&{'Authorization':'Bearer '+token})
            },
            ...options
        };
        const response = await fetch(`${this.BASE_URL}${endpoint}`,config);
        
        if(response.status===204)
            return{success:true}

        const data = await response.json();

        if(!response.ok){
            throw new Error(data.error||'Request failed')
        }
        return data;
    },
    async signup(username,password){
        return this.request('/signup',{
            method:'POST',
            body: JSON.stringify({username,password})
        });
    },
    async login(username,password){
        return this.request('/login',{
            method:'POST',
            body: JSON.stringify({username,password})
        });
    },
    async getTodos(){
        return this.request('/todos',{
            method:'GET',
        });
    },
    async addTodos(title,completed){
        return this.request(`/todos`,{
            method:'POST',
            body: JSON.stringify({title,completed})
        });
    },
    async updateTodos(id,title,completed){
        return this.request(`/todos/${id}`,{
            method:'PUT',
            body: JSON.stringify({title,completed})
        });
    },
    async deleteTodo(id){
        return this.request(`/todos/${id}`,{
            method:'DELETE'
        });
    }

}        
        
const yourTodosContainer = document.getElementById('yourTodosContainer');
const TodoActionsContainer = document.getElementById('TodoActionsFieldset');
const LoginContainer = document.getElementById('LoginFieldset');
const SignUpContainer = document.getElementById('SignUpFieldset');
    try{
        const token = localStorage.getItem('authToken')
        if(!token){
            yourTodosContainer.style.display = 'none';
            TodoActionsContainer.style.display = 'none';
            LoginContainer.style.display = 'block';
            SignUpContainer.style.display = 'block';
        }
        else{
            yourTodosContainer.style.display = 'block';
            TodoActionsContainer.style.display = 'block';
            LoginContainer.style.display = 'none';
            SignUpContainer.style.display = 'none';
            getTodos();
        }
    }
    catch(error){
        console.log(error);
    }

function displayError(data,containerID){
    const container = document.getElementById(containerID);
    container.innerHTML = "";

    const heading = document.createElement('h3');
    heading.textContent= 'Error';
    container.appendChild(heading);

    const p = document.createElement('p');
    p.textContent=data;
    container.appendChild(p);
}

function displaySuccess(message,containerID){
    const container = document.getElementById(containerID);
    container.innerHTML = "";

    const heading = document.createElement('h3');
    heading.textContent=message;
    container.appendChild(heading);
}

async function signup(){
    const username = document.getElementById('signup_username').value;
    const password = document.getElementById('signup_password').value;
    try{
        const data = await API.signup(username,password);
        displaySuccess('Signup Successful','signupAlertContainer');
    }
    catch(error){
        displayError(error.message,'signupAlertContainer')
    }
}

async function login(){
    //display whether password is correct or not
    const username = document.getElementById('login_username').value;
    const password = document.getElementById('login_password').value;
    try{
        const data = await API.login(username,password);
        localStorage.setItem('authToken',data.token);
        displaySuccess(data.message,'loginAlertContainer');
        console.log(data);
    }
    catch(error){
        displayError(error.message,'loginAlertContainer');
    }
    window.location.reload(); 
}

function logout(){
    console.log("Logging Out...")
    localStorage.removeItem('authToken');
    window.location.reload();
}

async function getTodos(){
    
    try{
        const data = await API.getTodos();
        console.log(data);
        
        const container = document.getElementById('todosContainer');
        container.innerHTML = '';
        if(data.length===0){
            container.innerHTML ='<p>No Todos yet!</p>';
            return;
        }

        data.forEach(function(todo) {
            const p = document.createElement('p');
            p.textContent=`Id: ${todo.id} Title: ${todo.title} Completion Status: ${todo.completed}`;
            container.appendChild(p);
        });
    }
    catch(error){
        displayError(error.message,'todosContainer');
        return;
    }
}

async function addTodos(){

    const title = document.getElementById('addTodoTitleInput').value;
    const completed = document.getElementById('addTodoCompletion').value == 'true';

    try{
        const data = await API.addTodos(title,completed);
        console.log(data);
        displaySuccess('New Todo Created!','addTodoContainer');
    }
    catch(error){
        displayError(error.message,'addTodoContainer')
    }

    getTodos();
}

async function updateTodos(){
    const id = document.getElementById('updateTodoID').value;
    const title = document.getElementById('updateTodoTitleInput').value;
    const completed = document.getElementById('updateTodoCompletion').value == 'true';
    try{
        const data = await API.updateTodos(id,title,completed);
        console.log(data);
        displaySuccess('New Todo Created!','updateTodoContainer');

        const container = document.getElementById('updateTodoContainer');
        const p = document.createElement('p');
        p.textContent = `Updated todo:- Title:${data.title} Completion Status:${data.completed}`;
        container.appendChild(p);
        getTodos();
    }
    catch(error){
        displayError(error.message,'updateTodoContainer');
    }  
}
async function deleteTodo(){
    const id= document.getElementById('deleteTodoIdInput').value;
    try{
        const data = await API.deleteTodo(id); 
        displaySuccess('Todo Deleted','deleteTodoAlertContainer');
        getTodos();
    }
    catch(error){
        displayError(error.message,'deleteTodoAlertContainer');
    }    
}