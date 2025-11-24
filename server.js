require('dotenv').config();

const port = process.env.PORT||3000;
const express = require('express');
const cors = require('cors');
const app = express()
app.use(cors());
app.use(express.json());

const pgp = require('pg-promise')()
const connectionString = process.env.DB_CONNECTION_STRING;
const db = pgp(connectionString)

const bcrypt = require('bcrypt');

//Environment Variables are always strings
const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);

const secret_code = process.env.JWT_SECRET;
const jwt = require('jsonwebtoken');
const {errors} = require('pg-promise');

const verifyToken = (req,res,next)=>{
    const authHeader = req.headers['authorization'];
    if(!authHeader){
        return res.status(403).json({error:'No token provided'})
    }
    try{
        const headertoken = authHeader.split(' ')[1];
        const decoded = jwt.verify(headertoken,secret_code)//
        req.user = decoded;
        next();
    }
    catch(error){
        return res.status(401).json({error:'Invalid Token'})
    }
};

app.get('/todos',verifyToken,async(req,res)=>{
    //SELECT ALL TODOS OF THE USER
    const username = req.user.username;
    try{
        const get_todos = await db.any('SELECT * FROM todos WHERE user_id = $1',username); //any returns NULL too
        res.status(200).json(get_todos);
    }
    catch(error){
        res.status(500).json({error:'Failed to fetch todos'})
    }
})

app.post('/todos',verifyToken,async(req,res)=>{
    //POST A NEW TODO
    const {title,completed} = req.body;
    const username = req.user.username;
    if(!title){
        console.error("Title is required");
        return res.status(400).json({error: "Title is required"});
    }
    try{
            const newTodo = await db.one('INSERT INTO todos (title,completed,user_id) VALUES ($1,$2,$3) RETURNING *',[title,completed,username])
            res.status(201).json(newTodo);
        }
        catch(error){
            console.error('Database error:',error);
            res.status(500).json({error:'Could not post to-do'})
        }
})

app.delete('/todos/:deleteId',verifyToken,async (req,res)=>{
    //DELETE TODOS
    const id = req.params.deleteId;
    const username = req.user.username;
    try{
        const deleteTodo = await db.oneOrNone('DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING *',[id,username]);
        if(deleteTodo)
            res.status(200).json({message:"Todo Deleted"});
        else
            res.status(404).json({error:"Todo with id not found"});
    }
    catch(error){
        console.error('Could not delete:',error);
        res.status(500).json({error:'Could not delete'})
    }
})

app.put('/todos/:id',verifyToken,async(req,res)=>{
    //  UPDATE TODO
    const id = req.params.id;
    const {title,completed} = req.body;
    const username = req.user.username;
    if(!title){
        console.error("Title is required")
        return res.status(400).json({error:"Title is required"})
    }
    if(typeof completed != 'boolean'){
        console.error("Completion status of task is required")
        return res.status(400).json({error:"Completion status of task is required"})
    }
    try{
        const updateTodo = await db.oneOrNone('UPDATE todos SET title = $1, completed = $2 WHERE id = $3 and user_id = $4 RETURNING *',[title,completed,id,username]);
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

app.post('/signup',async(req,res)=>{
    //SIGNUP PAGE
    const {username,password} = req.body;
    if(!password){
        return res.status(400).json({error:'Password cannot be null or empty'});
    }   
    else if(!username){
        return res.status(400).json({error:'Username cannot be null or empty'});
    }
    try{
        const username_not_unique = await db.oneOrNone('SELECT * FROM users WHERE username = $1',[username]);
        if(username_not_unique)
            return res.status(400).json({error:'Username already taken'})
        else
            console.log('Username is available');
        const hash = await bcrypt.hash(password,saltRounds);
        const user_signup = await db.oneOrNone('INSERT INTO users (username,password) VALUES ($1,$2) RETURNING username',[username,hash]);
        res.status(201).json(user_signup);
    }
    catch(error){
        res.status(500).json({error:'Database error. Cannot signup'});
    }
})

app.post('/login',async (req,res)=>{
    //LOGIN PAGE
    const {username,password} = req.body;
    if(!password){
        return res.status(400).json({error:'Password is required'});
    }   
    else if(!username){
        return res.status(400).json({error:'Username is required'});
    }
    try{
        const userRow = await db.oneOrNone('SELECT password FROM users WHERE username = $1',[username]);
        if(!userRow)
            return res.status(400).json({error:'Username not found'})
        else{
            const match= await bcrypt.compare(password,userRow.password);
            if(match){
                //login
                console.log('Password is Correct. Logging in!')
                const token = jwt.sign({username:username},secret_code,{expiresIn:'1h'})//
                return res.status(200).json({message:'Login Successful',token: token});
            }
            else{
                return res.status(400).json({error:'Password is Incorrect'})
            }
        }
    }
    catch(error){
        res.status(500).json({error:'Could not login'})
    }
})

app.listen(port,()=>{
    console.log(`Listening on port ${port}`)
})
