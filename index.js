import express from 'express';
import cors from 'cors';
import {createServer} from "http";
import { Server } from "socket.io";

const app = express();
const isDev = app.settings.env === 'development';
const URL = isDev ? 'http://localhost:3000' : '';
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {cors: {origin: '*'}});
 

function countDownFunc(){
  return (timer,room)=>{
    let id = setInterval(()=>{
      console.log(timer,room);
  },timer);
  return id;
  }
};

let timer = {};
/**
 * room:{
 * id,
 * time,
 * o_id,
 * o_time
 * }
 */
let player = {};
/**
 * room:[
 * {
 * name:"abc",
 * score:60
 * }
 * ]
 */
let currentUser = {};
/**
 * room:{
 * user:player1,
 * image:""
 * }
 */
let round = {};
/**
 * room:{
 * number:2,
 * word:"car",
 * status:"select"/"draw"/"wait"
 * }
 */
let words = ["pen","car","pencil","scooty","camera","computer"];


/**Start clock */
function triggerClock(io,room){
  timer[room]['id'] = setInterval(() => {
    timer[room]['time']++;
    io.sockets.in(room).emit('timer', timer[room]['time']);
    },1000);
}

/**stop clock */
function stopClock(room){
  clearInterval(timer[room]['id']);
  timer[room]['time'] = 0;
}

/***Trigger Select status */
function triggerSelect(io,room){
  triggerClock(io,room);
  player[room].forEach((data)=>{
    console.log("0000",data);
    if(data.id !== round[room].user)
    io.sockets.to(data.id).emit('selecting',{currentUser:{name: round[room].name, id: round[room].user}});
  });
  io.sockets.to(round[room].user).emit('select', {list: ["car","phone","zoo"]});
  round[room].status = 'select';
timer[room]['o_id'] = setTimeout(() => {
  stopClock(room);
  round[room].word = words[1];
  round[room].status = 'draw';
  io.sockets.in(room).emit('draw');
  triggerClock(io,room);
}, 5000);
}

/***Trigger Drawing post word selection */
function triggerDraw(io,room){}


io.on("connection", (socket) => {

/**emit join once user joins the room */  
socket.on('join',({name,room})=>{
  console.log(name,room);
  socket.join(socket.id);/**join user */
  socket.join(room);/**join room */
  /**if user is the first user */
  if(!player[room]){
    player[room] = [];
    timer[room] = {
      id:null,
      time:0,
      o_id:null,
      o_time:0
    };
  }
  
  if(!player[room].some((d)=>d.id === socket.id))
  player[room].push({
    "id": socket.id,
    "name": name,
    "score": 0
  });
  console.log(player);

  if(player[room].length === 2){
    /**setuproom */
    round[room] = {
      number: 1,
      word: null,
      status: 'wait',
      user: socket.id,
      name: name,
      image: null,
      answerCount: []
    };
/**emit start game */
    io.sockets.in(room).emit("startGame");
    io.sockets.in(room).emit("updatePlayerList",player[room]);
/**emit select word to current user and selecting to other user */    
triggerSelect(io,room);
  };

if(player[room].length > 2){
  /**emit start game */
  io.sockets.to(socket.id).emit("startGame");
  io.sockets.in(room).emit("updatePlayerList",player[room]);
console.log(player[room].length,round[room].status,round[room].user);
/**if someone is already drawing */
  if(round[room].status === "draw"){
    console.log("id000",socket.id);
    /**emit to get latest drawing */console.log("getDraw");
    io.sockets.to(round[room].user).emit('getDraw',socket.id);

  }
}
});

socket.on("sendDraw",({newUser,drawing})=>{
  // console.log("newuser",newUser,drawing);
  socket.to(newUser).emit("updateDraw",drawing);
})


/**word is selected by the current user**/
socket.on('selected',({word})=>{
  clearInterval(timer[room]['id']);
  clearInterval(timer[room]['o_id']);
  timer[room]['time'] = 0;
  round[room].word = word;
  round[room].status = 'draw';
  triggerClock(room);
  timer[room]['id'] = setTimeout(() => {
    timer[room]['time']++;
    round[room].word = words[1];
    round[room].status = 'draw';
    io.sockets.in(room).emit('timer', {timer:timer[room]['time'], status: "showscore"});
    stopClock(room);
}, 30000);
});

/**submit answer */
socket.on('submitAnswer',({room, data})=>{
  if(data === round[room].word);
  round[room].answerCount.push(socket.id);
  if(round[room].answerCount === player[room].length){
    /**end draw*/
    /**check last round*/

    if(round[room].number === 5)
    socket.to(room).emit('endGame',{player});
  else
  {
  socket.to(room).emit('endRound',{player});
  setTimeout(() => {
    
  }, 2000);
}
  }
})




    console.log("server connected");
    socket.join(socket.id);
console.log('socket',socket.id);

    // let counter = 60;
    // let timer = setInterval(()=>{
    //     counter--;
    //     console.log("timer>>>>>>>>");
    //     socket.broadcast.emit('counter',counter);
    // },1000);

socket.on('join-room',(room)=>{
socket.join(room);
if(!timer[room]){

  console.log(timer);
  timer[room] = {};
  player[room] = [];
  image[room] = "";
  player[room].push(socket.id);
  console.log(player);
  console.log(timer);
  timer[room]['time'] = 0;
  console.log(timer);
}

console.log(io.sockets.adapter.rooms.get(room).size,"rooom");
console.log(`User joined room ${room}`);
console.log(image);
socket.to(room).emit('joined',image[room]);
});


socket.on('start-round',(room)=>{
  let counter = setInterval(()=>{},1000);

  console.log(a);
})


/**canvas drawing event */

    socket.on('beginPath', ({room,arg}) => {
      console.log("beginpath---");
      socket.to(room).emit('beginPath', arg)
    })
  
    socket.on('drawLine', ({room,arg}) => {
      console.log("drawline----");
      socket.to(room).emit('drawLine', arg)
    })

    /**chat events */
    socket.on("sendChat",({room,senderId,senderName,mssg})=>{  
      let match = false;
      if(mssg === round[room].word)
      match = true;
      io.sockets.in(room).emit('recieveChat',{senderId,senderName,mssg,match});
      console.log(player[room]);
      if(match)
      player[room] = player[room].map((data)=>{
        if(data.id === sender)
        return {...data,score: data['score'] + 1}
      else 
      return data;
      })
      console.log(player[room]);
    })


    socket.on('disconnecting',(reason)=>{
      console.log("><><><",socket.adapter.rooms);
      const iterator1 = socket.rooms.values();
      iterator1.next();
      let room = iterator1.next().value;


      console.log("leave rooom-------");
      if(player[room]){
      player[room] = player[room].filter((data)=>data.id !== socket.id);
      io.sockets.in(room).emit("updatePlayerList",player[room]);}
    })
  });

app.get("/",()=>{
    console.log("dfdfdf");
})

httpServer.listen(5000,()=>console.log("Backend is on"));
