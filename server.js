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
        res.status(200).json(todos);
    }
    catch(error){
        res.status(500).json({error:'Failed to fetch todos'})
    }
})

app.post('/todos',async (req,res)=>{
    const {title} = req.body;
    if(!title){
        console.error("Title is required");
        return res.status(400).json({error: "Title is required"});
    }
    try{
            const newTodo = await db.one('INSERT INTO todos (title,completed) VALUES ($1,$2) RETURNING *',[title,false])
            res.status(201).json(newTodo);
        }
        catch(error){
            console.error('Database error:',error);
            res.status(500).json({error:'Could not post to-do'})
        }
})

app.delete('/todos/:deleteId',async (req,res)=>{
    const id = req.params.deleteId;
    try{
        const deleteTodo = await db.oneOrNone('DELETE FROM todos WHERE id = $1 RETURNING *',[id]);
        if(deleteTodo)
            res.status(204).json(deleteTodo);
        else
            res.status(404).json({error:"Todo with id not found"});
    }
    catch(error){
        console.error('Could not delete:',error);
        res.status(500).json({error:'Could not delete'})
    }
})

app.put('/todos/:id',async(req,res)=>{
    const id = req.params.id;
    const {title,completed} = req.body;
    if(!title){
        console.error("Title is required")
        return res.status(400).json({error:"Title is required"})
    }
    if(typeof completed != 'boolean'){
        console.error("Completion status of task is required")
        return res.status(400).json({error:"Completion status of task is required"})
    }
    try{
        const updateTodo = await db.oneOrNone('UPDATE todos SET title = $1, completed = $2 WHERE id = $3 RETURNING *',[title,completed,id]);
        if(updateTodo)
            res.status(200).json(updateTodo);
        else
            res.status(404).json({error:'Todo not found'});
    }
    catch(error){
        console.error('Could not update todo ',error)
        res.status(500).json({error:'Internal Server Error'})
    }
})

app.listen(port,()=>{
    console.log(`Listening on port ${port}`)
})
