var url = require("url"),
    fs = require("fs"),
    crypto = require("crypto"),
    User = require("./user").User,
    Room = require("./room").Room,
    Message = require("./message").Message,
    errorMsg = require("./errorMsg").errorMsg;

var userList = [],
    roomList = [],
    USER_MAX_SIZE = 50,
    ROOM_MAX_SIZE = 10,
    USER_TIMEOUT_LENGTH = 10*60*1000;

var isDebug = true; // default is false

/* ajax response status [start]
 *
 * 0 - normal
 * 1 - common error
 * 2 - error needs to re-login
 *
 * ajax response status [start] */

function createUser(name, roomId){
    var newItem, tmp;
    newItem = new User(name, null, roomId);
    if(userList.length === 0){
        newItem.setId(1);
        userList.push(newItem);
    }else if(userList.length >= USER_MAX_SIZE){
        console.warn('WARN: the user list reachs maximum.');
        return 0;
    }else{
        for(var i=0; i<userList.length; i++){
            if(i + 1 < userList[i].getSid()){
                newItem.setId(i+1);
                tmp = userList.splice(i);
                userList = userList.concat(newItem).concat(tmp);
                break;
            }
            if(i + 1 === userList.length){
                newItem.setId(userList.length+1);
                userList.push(newItem);
                break;
            }
        }
    }
    newItem.setSid(generateSid4User(newItem));
    console.log(newItem.getSid());
    return newItem;
}

function createRoom(userId){
    var newItem, tmp;
    newItem = new Room(userId, [userId]);
    if(roomList.length === 0){
        newItem.setId(1);
        roomList.push(newItem);
    }else if(roomList.length >= ROOM_MAX_SIZE){
        console.warn('WARN: the room list reachs maximum.');
        return 0;
    }else{
        for(var i=0; i<roomList.length; i++){
            if(i + 1 < roomList[i].getId()){
                newItem.setId(i+1);
                tmp = roomList.splice(i);
                roomList = roomList.concat(newItem).concat(tmp);
                break;
            }
            if(i + 1 === roomList.length){
                newItem.setId(roomList.length+1);
                roomList.push(newItem);
                break;
            }
        }
    }
    return newItem;
}

function getUser(sid){
    for(var i=0; i<userList.length; i++){
        if(userList[i].getSid() === sid){
            return userList[i];
        }
    }
    return null;
}

function removeUser(id){
    var done = false;
    for(var i=0; i<userList.length; i++){
        if(id === userList[i].getSid()){
            done = true;
        }
        if(done){
            userList[i] = userList[i+1];
        }
        if(i + 1 === userList.length){
            userList.pop();
            break;
        }
    }
    return done;
}

function getRoom(id){
    for(var i=0; i<roomList.length; i++){
        if(roomList[i].getId() === id){
            return roomList[i];
        }
    }
    return null;
}

function removeRoom(id){
    var done = false;
    for(var i=0; i<roomList.length; i++){
        if(id === roomList[i].getId()){
            done = true;
        }
        if(done){
            roomList[i] = roomList[i+1];
        }
        if(i + 1 === roomList.length){
            roomList.pop();
            break;
        }
    }
    return done;
}

function sendSysMsg(userLs, type, sender){
    var msgObj = {
        userIn: '###username###(###userid###) is in the chat room now.',
        userOut: '###username###(###userid###) just leaved the chat room.'
    },
    sid = sender.getSid();
    msg = msgObj[type].replace('###username###', sender.getName()).replace('###userid###', sender.getId());
    for(var i=0; i<userLs.length; i++){
        if(sid === userLs[i]){
            continue;
        }
        getUser(userLs[i]).pushMessage(new Message(null, null, msg, true));
    }
}

function logDatetime(){
    var d = new Date();
    return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()+':'+d.getMilliseconds();
}

function checkSsid(resp, cookie){
    var ssid, cks;

    if(cookie){
        cks = cookie.split(';');
        for(var i=0; i<cks.length; i++){
            cks[i] = cks[i].trim();
            if(cks[i].indexOf('ssid=')===0){
                ssid = cks[i].replace('ssid=', '');
                break;
            }
        }
    }

    if(ssid === global.chatroom.setupstamp){
        return true;
    }else{
        resp.writeHead(200,{"Content-Type":"text/plain"});
        resp.write(JSON.stringify({
            status: 2,
            errorMsg: errorMsg.loginTimeout
        }));
        resp.end();
        return false;
    }
}

function generateSid4User(user){
    if(!user || !user.getId()){
        return null;
    }
    var sha1 = crypto.createHash('sha1');
    sha1.update('userSeriesId');
    sha1.update(+new Date()+'');
    sha1.update(user.getId()+'');
    sha1.update(user.getName());
    sha1.update((Math.random()*10000).toString().substring(0,4));
    return sha1.digest('hex');
}

function userLeaveRoom(user, room){
    room.removeUser(user.getSid());
    removeUser(user.getSid());
    if(room.getUsers().length === 0){
        removeRoom(room.getId());
    }else{
        sendSysMsg(room.getUsers(), 'userOut', user);
    }
}

function userLoginCheckingJob(){
    var user, room;
    for(var i=0; i<userList.length; i++){
        user = userList[i];
        if(+new Date() - user.getLastConnTime() > USER_TIMEOUT_LENGTH){
            room = getRoom(user.getRoomId());
            userLeaveRoom(user, room);
        }
    }
}

function start(resp){
    console.log(logDatetime() + " - Request handler 'start' was called.");

    fs.readFile('./view/home.html', 'utf-8', function (err, data) {//读取内容
        if(err) throw err;
        resp.writeHead(200, {"Content-Type": "text/html", "Set-Cookie": "ssid="+global.chatroom.setupstamp});//注意这里
        resp.write(data);
        resp.end();
    });
}

function getIn(resp, req){
    console.log(logDatetime() + " - Request handler 'getIn' was called.");

    if(isDebug){
        console.log('DEBUG: '+url.parse(req.url, false).query);
        console.log('DEBUG: '+JSON.stringify(userList));
        console.log('DEBUG: '+JSON.stringify(roomList));
    }

    if(!checkSsid(resp, req.headers.cookie)){
        return ;
    }

    var params = url.parse(req.url, true).query,
        user, room;
    user = createUser(params.myName, null);
    if(!(user instanceof User)){
        resp.writeHead(200,{"Content-Type":"text/plain"});
        resp.write(JSON.stringify({
            status: 1,
            errorMsg: errorMsg.createUserFailed
        }));
        resp.end();
        return ;
    }
    if(params.newRoom === '1'){
        room = createRoom(user.getSid());
    }else{
        room = getRoom(+params.myRoomId);
    }
    if(!(room instanceof Room)){
        removeUser(user.getSid());
        resp.writeHead(200,{"Content-Type":"text/plain"});
        resp.write(JSON.stringify({
            status: 1,
            errorMsg: errorMsg.createRoomFailed
        }));
        resp.end();
        return ;
    }
    user.setRoomId(room.getId());
    room.addUser(user.getSid());
    sendSysMsg(room.getUsers(), 'userIn', user);
    resp.writeHead(200,{"Content-Type":"text/plain"});
    resp.write(JSON.stringify({
        status: 0,
        data: {
            roomId: room.getId(),
            userId: user.getId(),
            userSid: user.getSid(),
            myName: user.getName(),
        }
    }));
    resp.end();
    if(isDebug){
        console.log('DEBUG: '+JSON.stringify(userList));
        console.log('DEBUG: '+JSON.stringify(roomList));
        console.log('DEBUG: handler finished.');
    }
    return ;
}

function send(resp, req){
    console.log(logDatetime() + " - Request handler 'send' was called.");

    if(isDebug){
        console.log('DEBUG: '+url.parse(req.url, false).query);
        console.log('DEBUG: '+JSON.stringify(userList));
        console.log('DEBUG: '+JSON.stringify(roomList));
    }

    if(!checkSsid(resp, req.headers.cookie)){
        return ;
    }

    var params = url.parse(req.url, true).query,
        user, room, userLs;
    if(!params.sender || !params.content){
        resp.writeHead(200,{"Content-Type":"text/plain"});
        resp.write(JSON.stringify({
            status: 1,
            errorMsg: errorMsg.invalidSenderContent
        }));
        resp.end();
        return ;
    }
    user = getUser(params.sender);
    if(!user){
        resp.writeHead(200,{"Content-Type":"text/plain"});
        resp.write(JSON.stringify({
            status: 1,
            errorMsg: errorMsg.senderNotFound
        }));
        resp.end();
        return ;
    }else{
        user.setLastConnTime(+new Date());
    }
    room = getRoom(user.getRoomId());
    if(!room){
        resp.writeHead(200,{"Content-Type":"text/plain"});
        resp.write(JSON.stringify({
            status: 1,
            errorMsg: errorMsg.chatRoomNotFound
        }));
        resp.end();
        return ;
    }
    userLs = room.getUsers();
    for(var i=0; i<userLs.length; i++){
        if(user.getSid() === userLs[i]){
            continue;
        }
        getUser(userLs[i]).pushMessage(new Message(user.getId(), user.getName(), params.content, false, user.getSid()))
    }
    resp.writeHead(200,{"Content-Type":"text/plain"});
    resp.write(JSON.stringify({
        status: 0,
        data: {}
    }));
    resp.end();
    if(isDebug){
        console.log('DEBUG: userList '+JSON.stringify(userList));
        console.log('DEBUG: roomList '+JSON.stringify(roomList));
        console.log('DEBUG: handler finished.');
    }
    return ;
}

function check(resp, req){
    // console.log("Request handler 'check' was called.");

    if(!checkSsid(resp, req.headers.cookie)){
        return ;
    }

    var params = url.parse(req.url, true).query,
        user, room, msgLs, msgLsObj;
    user = getUser(params.userSid);
    if(user === null){
        resp.writeHead(200,{"Content-Type":"text/plain"});
        resp.write(JSON.stringify({
            status: 2,
            errorMsg: errorMsg.userNotFound
        }));
        resp.end();
        return ;
    }else{
        user.setLastConnTime(+new Date());
    }
    msgLsObj = user.popAllMessage();
    msgLs = [];
    for(var i=0; i<msgLsObj.length; i++){
        msgLs.push({
            'senderId': msgLsObj[i].getSenderId(),
            'senderName': msgLsObj[i].getSenderName(),
            'content': msgLsObj[i].getContent(),
            'isSys': msgLsObj[i].getIsSys(),
        });
    }
    resp.writeHead(200,{"Content-Type":"text/plain"});
    resp.write(JSON.stringify({
        status: 0,
        data: {
            messages: msgLs
        }
    }));
    resp.end();

    if(isDebug && msgLs.length>0){
        console.log('DEBUG: check - '+JSON.stringify(msgLs));
    }

    return ;
}

function end(resp, req){
    console.log(logDatetime() + " - Request handler 'end' was called.");

    if(isDebug){
        console.log('DEBUG: '+url.parse(req.url, false).query);
        console.log('DEBUG: '+JSON.stringify(userList));
        console.log('DEBUG: '+JSON.stringify(roomList));
    }

    if(!checkSsid(resp, req.headers.cookie)){
        return ;
    }

    var params = url.parse(req.url, true).query,
        user, room;
    user = getUser(params.userSid);
    room = getRoom(+params.roomId);
    if(user === null){
        resp.writeHead(200,{"Content-Type":"text/plain"});
        resp.write(JSON.stringify({
            status: 2,
            errorMsg: errorMsg.userNotFound
        }));
        resp.end();
        return ;
    }
    userLeaveRoom(user, room);
    resp.writeHead(200,{"Content-Type":"text/plain"});
    resp.write(JSON.stringify({
        status: 0,
        data: {}
    }));
    resp.end();
    if(isDebug){
        console.log('DEBUG: '+JSON.stringify(userList));
        console.log('DEBUG: '+JSON.stringify(roomList));
        console.log('DEBUG: handler finished.');
    }
    return ;
}

setInterval(function(){
    userLoginCheckingJob();
}, 10000);

exports.start = start;
exports.getIn = getIn;
exports.send = send;
exports.check = check;
exports.end = end;