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
let rooms = [];
let words = ["pen","car","pencil","scooty","camera","computer"];

  
io.on("connection", (socket) => { 

  const randomWordReveal = (room) => {
    let wordArray = round[room].word.split('');
    let randomIndex = Math.floor(Math.random() * round[room].word.length);
     while(round[room].revealedIndexArray.includes(randomIndex)){
      randomIndex = Math.floor(Math.random() * round[room].word.length);
      if(round[room].revealedIndexArray.length >= round[room].word.length)
      break;
      console.log("--stuck---",round[room].revealedIndexArray,round[room].word.length);
     }
     return randomIndex;
  }
  
  
   
  /**Start clock */
  function triggerClock(io,room){
    timer[room]['id'] = setInterval(() => {
      timer[room]['time']++;
      io.sockets.in(room).emit('timer', timer[room]['time']);
      console.log(round[room].status, timer[room]['time'], round[room].word, round[room].status == "draw", timer[room]['time'] % round[room].word?.length === 0); 
      if(round[room].status == "draw" && timer[room]['time'] % Math.round(15 / round[room].word.length) === 0){
        console.log("reveal word>>>>>>>>>>>");
        round[room].revealedIndexArray.push(randomWordReveal(room));
        let hint='';
        let word = round[room].word.split('');
        for (let i = 0; i < round[room].word.length; i++) {
          if (round[room].revealedIndexArray.includes(i)) {
            hint += word[i];
          } else {
            hint += ' _ ';
          }
        }
        console.log(hint,"----hint");
        io.sockets.in(room).emit('revealWord', hint);
      }
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
      console.log("0000",data.id,"----",round[room].user);
      if(data.id !== round[room].user)
      io.sockets.to(data.id).emit('selecting',{currentUser:{name: round[room].name, id: round[room].user}});
    console.log(data.id);
    }); 
    io.sockets.to(round[room].user).emit('select', {list: ["car","phone","zoo"]});
    console.log('round[room].user',round[room].user);
    round[room].status = 'select';
  timer[room]['o_id'] = setTimeout(() => {
    triggerDraw(io,room);
    // stopClock(room);
    // round[room].word = words[1];
    // round[room].status = 'draw';
    // io.sockets.in(room).emit('draw');
    // triggerClock(io,room);
  }, 5000);
  }
  
  /***Trigger Drawing post word selection */
  function triggerDraw(io,room){
    stopClock(room);
    if(round[room].word === null)
    round[room].word = words[1];
    round[room].status = 'draw';
    io.sockets.emit('revealWord',new Array(round[room].word.length + 1).join(' _ '));
    player[room].forEach((data)=>{
      console.log("0000",data);
      if(data.id !== round[room].user)
      io.sockets.to(data.id).emit('drawing',round[room].word);
    });
    io.sockets.to(round[room].user).emit('draw',round[room].word);
    triggerClock(io,room);
    timer[room]['o_id'] = setTimeout(() => {
      triggerRoundEnd(io,room);
    },15000);
  }
  
  
  function triggerRoundEnd(io,room){ 
    stopClock(room);
    console.log(player[room]);
    io.sockets.in(room).emit('roundend',player[room]);  
    let index = player[room].map(data=>data.id).indexOf(round[room].user);
    console.log(index,"---index--",player[room].length);
    if(index + 1 === player[room].length)
    { 
      index = 0;
      round[room].number = round[room].number + 1;  
      io.sockets.in(room).emit("updateRoundNumber",round[room].number);
    }
  else
  index = index + 1;
 
  round[room].revealedIndexArray = [];
console.log("player room",player[room]);
    round[room].user = player[room][index].id;
    round[room].name = player[room][index].name;
console.log("player room",round[room]);  
    
  
    // round[room] = {
    //   number: 1,
    //   word: null,
    //   status: 'wait',
    //   user: socket.id,
    //   name: name,
    //   answerCount: [] 
    // };
  
    io.sockets.in(room).emit("updatePlayerList",player[room]);
    io.sockets.in(room).emit('updateHost',{id:round[room].user,name:round[room].name});
    if(round[room].number > 5){
      io.sockets.emit('endGame',player[room]);
    }
    else
    {
      setTimeout(()=>{
      round[room].word = null;
      triggerSelect(io,room);
    },3000);
  }
  }
 
console.log("--------------------------------------------------------------------------------------------------------------------");
  socket.join(socket.id);/**join user */

/**emit join once user joins the room */  
socket.on('createRoom',({name,room})=>{
  console.log("--------------------------------------------------------------------------------------------------------------------");
  if(rooms.includes(room)){
    io.sockets.in(socket.id).emit('dissolveRoom');
  return;
} 
console.log("creating new room");
console.log(socket.id);
io.sockets.in(socket.id).emit('allow',{id:true, mssg:'New Room created'});
  rooms.push(room);
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
 
  player[room].push({
    "id": socket.id,
    "name": name,
    "score": 0,
    "rank":null,
    "guess":false
  });

    /**setuproom */
    round[room] = {
      number: 1,
      word: null,
      status: 'wait',
      user: socket.id,
      name: name,
      answerCount: [],
      revealedIndexArray:[]
    }; 

    io.sockets.in(socket.id).emit('updateHost',{id:round[room].user,name:round[room].name});
    io.sockets.in(room).emit("updatePlayerList",player[room]);
    console.log("room created id - ",room);
    console.log("room added to rooms list - ",rooms);
    console.log("player added to player list - ",player[room]);
    console.log("create round deatils  - ",round[room]);
    console.log("--------------------------------------------------------------------------------------------------------------------");
});
 
/**emit join once user joins the room */  
socket.on('joinRoom',({name,room})=>{
  console.log("--------------------------------------------------------------------------------------------------------------------");
  console.log(rooms,rooms[room]);
  if(!rooms.includes(room)){
    io.sockets.in(socket.id).emit('dissolveRoom');
  return;
}  

  socket.join(room);/**join room */

  io.sockets.in(socket.id).emit('allow',{id:true, mssg:'Join Room'});

console.log("player joined room",socket.adapter.rooms);

  player[room].push({
    "id": socket.id,
    "name": name,
    "score": 0,
    "rank":null,
    "guess":false
  });

  console.log("player added to player list",player[room]);

  io.sockets.in(socket.id).emit('updateHost',{id:round[room].user,name:round[room].name});

  io.sockets.in(room).emit("updatePlayerList",player[room]);

//check if game is already started 
if(rooms[room] && player[room].length>=2){
  /**emit start game */
  io.sockets.to(socket.id).emit("startGame");
console.log(player[room].length,round[room].status,round[room].user);
/**if someone is already drawing */
  if(round[room].status === "draw"){
    console.log("id000",socket.id);
    /**emit to get latest drawing */console.log("getDraw");
    io.sockets.to(round[room].user).emit('getDraw',socket.id);

  }
}
console.log("--------------------------------------------------------------------------------------------------------------------");
});

socket.on("sendDraw",({newUser,drawing})=>{
  // console.log("newuser",newUser,drawing);
  socket.to(newUser).emit("updateDraw",drawing);
})
 

socket.on("requestStartGame",(room)=>{
  console.log("--------------------------------------------------------------------------------------------------------------------");
  if(rooms.includes(room) && player[room].length>=2){
    // io.sockets.in(room).emit("startGame");
    console.log("trigger select");
    triggerSelect(io,room);
  }else{

  }
  console.log("--------------------------------------------------------------------------------------------------------------------");
})

socket.on("getUpdatedPlayer",(room)=>{
  console.log("--------------------------------------------------------------------------------------------------------------------");
  if(rooms.includes(room)){
    io.sockets.in(room).emit("updatePlayerList",player[room]);
  }
  console.log("--------------------------------------------------------------------------------------------------------------------");
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

    if(round[room].number === 5){
    socket.to(room).emit('endGame',{player});
    clearInterval(timer[room]['id']);
    clearInterval(timer[room]['o_id']);
  }
  else
  {
  socket.to(room).emit('endRound',{player});
  setTimeout(() => {
    
  }, 2000);
}
  }
})





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

socket.on('wordSelected',({word,room})=>{
  clearInterval(timer[room]['id']);
  clearInterval(timer[room]['o_id']);
  round[room].word = word;
  console.log(round[room],"grfgvrgds");
  triggerDraw(io,room);

})

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
      let sendPing = false;
      console.log(mssg,round[room],"00000000000000");
      if(mssg === round[room].word && socket.id !== round[room].user)
      match = true;
      if(mssg === round[room].word && socket.id === round[room].user){}
      else
      io.sockets.in(room).emit('recieveChat',{senderId,senderName,mssg,match});
      console.log(player[room]);
      if(match && socket.id !== round[room].user)
      player[room] = player[room].map((data)=>{
        if(data.id === senderId){
          sendPing = true;
        return {...data,score: data['score'] + 1,guess:true}
      }
      else 
      return data;   
      })
      if(sendPing)
      io.sockets.in(room).emit("updatePlayerList",player[room]);
      console.log(player[room]);
    }) 


    socket.on('disconnecting',(reason)=>{ 
      console.log("><><><",socket.adapter.rooms);
      console.log(socket.rooms.values());
      const iterator1 = socket.rooms.values();
      iterator1.next();
      let room = iterator1.next().value;


      console.log("leave rooom-------",room);
      if(player[room]){
      player[room] = player[room].filter((data)=>data.id !== socket.id);
      io.sockets.in(room).emit("updatePlayerList",player[room]);
      console.log(player[room]);
      if(player[room].length === 1)
      io.sockets.in(room).emit("dissolveRoom");
      }
    })
  });

app.get("/",()=>{
    console.log("dfdfdf");
})

httpServer.listen(5000,()=>console.log("Backend is on"));
