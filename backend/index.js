const express = require('express')
const app = express()
app.use(express.json())
const db = require('./db');

let persons=[
    { 
      "id": "1",
      "name": "Arto Hellas", 
      "number": "040-123456"
    },
    { 
      "id": "2",
      "name": "Ada Lovelace", 
      "number": "39-44-5323523"
    },
    { 
      "id": "3",
      "name": "Dan Abramov", 
      "number": "12-43-234345"
    },
    { 
      "id": "4",
      "name": "Mary Poppendieck", 
      "number": "39-23-6423122"
    }
]

app.get('/',(req,res)=>{
  res.send('<h1>HELLOWORLD</h1>')
})

app.post('/api/persons',(req,res)=>{
  const person = req.body
  res.json(person)
})

app.get('/api/persons',(req,res)=>{
  res.json(persons)
})

app.get('/info',(req,res)=>{
  const time=new Date().toString()

  res.send(`
    <p>phonebook has info for ${persons.length} people</p>
    <p>${time}</p>
  `)
})

app.get('/api/persons/:id',(req,res)=>{
  const id=req.params.id
  const person=persons.find(p=>p.id===id)
  
  if(person){
    res.json(person)
  }else{
    res.status(400).end()
  }
})

const PORT=3000
app.listen(PORT,()=>{
  console.log(`Server running on port ${PORT}`)
})