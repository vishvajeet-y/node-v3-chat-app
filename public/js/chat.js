const socket=io()
//Elements
const $messageForm=document.querySelector('#message-form')
const $messageFormInput=document.querySelector('input')
const $messageFormButton=document.querySelector('button')
const $sendLocation=document.querySelector('#send-location')
const $message=document.querySelector('#message')
//Template
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationTemplate=document.querySelector('#location-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML
//Options
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})
const autoscroll=()=>{
//New message element
const $newMessage=$message.lastElementChild
//Height of new message
const newMessageStyle=getComputedStyle($newMessage)
const newMessageMargin=parseInt(newMessageStyle.marginBottom)
const newMessageHeight=$newMessage.offsetHeight+newMessageMargin
//console.log(newMessageMargin)
//Visible height
const VisibleHeight=$message.offsetHeight
//Height of messages container
const containerHeight=$message.scrollHeight
//How far have i scrolled?
const scrollOffset=$message.scrollTop+VisibleHeight
if(containerHeight-newMessageHeight<=scrollOffset)
{
 $message.scrollTop=$message.scrollHeight
}
 
}
socket.on('message',(message)=>{
    console.log(message)
    const html=Mustache.render(messageTemplate,{
        username:message.username,
        createdAt:moment(message.createdAt).format('h:mm a'),
        message:message.text
    })
    $message.insertAdjacentHTML('beforeend',html)
    autoscroll()
})
socket.on('locationmessage',(msg)=>{
    console.log(msg)
    const loc=Mustache.render(locationTemplate,{
        username:msg.username,
        location:msg.url,
        createdAt:moment(msg.createdAt).format('h:mm a')
    })
    $message.insertAdjacentHTML('beforeend',loc)
    autoscroll()
})
socket.on('roomdata',({room,users})=>{
const html=Mustache.render(sidebarTemplate,{
    room,users
})
document.querySelector('#sidebar').innerHTML=html
})


$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    //disable
    $messageFormButton.setAttribute('disabled','disabled')
    const input=e.target.elements.message
   // console.log(input.value)
    socket.emit('sendMessage',input.value,(error)=>{
        //enable
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value=''
       $messageFormInput.focus()
        if(error)
        {
            return console.log(error)
        }
        console.log('The message was delivered')
    })
})



$sendLocation.addEventListener('click',()=>{
  
  if(!navigator.geolocation)
  {
      return alert('Geolocation is not setup')
  } 
  $sendLocation.setAttribute('disabled','disabled')
  navigator.geolocation.getCurrentPosition((position)=>{
 //console.log(position.coords)
 const location={
     lat:position.coords.latitude,
     long:position.coords.longitude
 }
// console.log(location)
 socket.emit('sendLocation',location,()=>{
     $sendLocation.removeAttribute('disabled')
     console.log('Location is shared')
 })
})
})
socket.emit('join',{username,room},(error)=>{
   if(error)
   {
       alert(error)
       location.href='/'
   }
})