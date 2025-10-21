const port = 3000
const express = require('express');
const app = express()

//.json middleware
app.use(express.json());

const pgp = require('pg-promise')()
const connectionString = 'postgres://postgres:postgres@localhost:5432/mydb';
const db = pgp(connectionString)

app.get('/todos',async(req,res)=>{
    try{
        const todos = await db.any('SELECT * FROM todos'); //any returns NULL too
        res.send(todos);
    }
    catch(error){
        res.status(500).json({error:'Failed to fetch todos'})
    }
})


app.post('/todos',async (req,res)=>{
    const {title,completed} = req.body;
    try{
        const newTodo = await db.one('INSERT INTO todos (title,completed) VALUES ($1,$2) RETURNING *',[title,completed])
        res.status(201).json(newTodo);
    }
    catch(error){
        console.error('Database error:',error);
        res.status(600).json({error:'Could not post to-do'})
    }
})

app.delete('/todos/:deleteId',async (req,res)=>{
    const id = req.params.deleteId;
    try{
        const deleteTodo = await db.one('DELETE FROM todos WHERE id = $1 RETURNING *',[id]);
        res.status(201).json(deleteTodo);
    }
    catch(error){
        console.error('Could not delete. Error:',error);
    }
})

app.listen(port,()=>{
    console.log(`Listening on port ${port}`)
})
