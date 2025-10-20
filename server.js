const port = 3000
const express = require('express');
const app = express()

//.json middleware
app.use(express.json());

let todos = [];

app.get('/todos',(req,res)=>{
    res.send(todos);
})

app.post('/todos',(req,res)=>{
    todos.push(req.body);
    res.send('To-do added')
})

app.delete('/todos/:deleteId',(req,res)=>{
    delete todos[req.params.deleteId];
    res.send('Last To-do Deleted')
})

app.listen(port,()=>{
    console.log(`Listening on port ${port}`)
})
