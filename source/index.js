const express=require('express')
const http=require('http')
const path=require('path')
const socketio=require('socket.io')
const Filter=require('bad-words')
const {generateMessage,generateLocation}=require('./utils/message')
const {addUser,removeUser,getUser, getUsersInRoom}=require('./utils/users')
const app=express()
const server=http.createServer(app)
const io=socketio(server)

const port=process.env.PORT||3000
const public_directory=path.join(__dirname,'../public')
app.use(express.static(public_directory))
app.get('',(req,res)=>{
    res.send('index')
})
//server (emit) -> client (receive) --acknowledgement-->server
//client (emit) -> server (receive) --acknowledgement-->client
io.on('connection',(socket)=>{
    
   // socket.emit('message',generateMessage('Welcome !'))
    //socket.broadcast.emit('message',generateMessage('A new user has joined'))
    socket.on('join',({username,room},callback)=>{
      const { error,user }=  addUser({id:socket.id,username,room})
     if(error)
     {
      return  callback(error)
     }
      socket.join(user.room)

     socket.emit('message',generateMessage('Admin','Welcome !'))
     socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`))
     io.to(user.room).emit('roomdata',{
         room:user.room,
         users: getUsersInRoom(user.room)
     }) 
     callback()
    })
    //////////////////////////////////
    socket.on('sendMessage',(message,callback)=>{
        const user=getUser(socket.id)

        const filter=new Filter()
        if(filter.isProfane(message))
        {
            return callback("Profanity is not allowed")
        }
        if(user)
        {
            io.to(user.room).emit('message',generateMessage(user.username,message))
            callback()
        }
       
    })
    //////////////////////////////////////////
    socket.on('sendLocation',(location,callback)=>{
     // console.log(location)
     // io.emit('message',`Location: ${location.lat}, ${location.long}`)
    const user=getUser(socket.id)
      if(user)
      {
        io.to(user.room).emit('locationmessage',generateLocation(user.username,`https://google.com/maps?q=${location.lat},${location.long}`))
        callback()
      }
    
    })
    ////////////////////////////////////////////////
    socket.on('disconnect',()=>{
    const user=removeUser(socket.id)
    if(user)
    {
        io.to(user.room).emit('message',generateMessage(`${user.username} has left`))
        io.to(user.room).emit('roomdata',{
            room:user.room,
            users: getUsersInRoom(user.room)
        })
    }
       
    })
})
server.listen(port,()=>{
    console.log('server is on '+port)
})

