var url = require("url"),
    fs = require("fs"),
    User = require("./user").User,
    Room = require("./room").Room,
    Message = require("./message").Message,
    errorMsg = require("./errorMsg").errorMsg;

var userList = [],
    roomList = [],
    USER_MAX_SIZE = 50,
    ROOM_MAX_SIZE = 10;

var isDebug = true; // default is false

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
            if(i + 1 < userList[i].id){
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
            if(i + 1 < roomList[i].id){
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

function getUser(id){
    for(var i=0; i<userList.length; i++){
        if(userList[i].id === id){
            return userList[i];
        }
    }
    return null;
}

function removeUser(id){
    var done = false;
    for(var i=0; i<userList.length; i++){
        if(id === userList[i].id){
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
        if(roomList[i].id === id){
            return roomList[i];
        }
    }
    return null;
}

function removeRoom(id){
    var done = false;
    for(var i=0; i<roomList.length; i++){
        if(id === roomList[i].id){
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

function sendSysMsg(userLs, type, name, id){
    var msgObj = {
        userIn: '###username###(###userid###) is in the chat room now.',
        userOut: '###username###(###userid###) just leaved the chat room.'
    },
    msg = msgObj[type].replace('###username###', name).replace('###userid###', id);
    for(var i=0; i<userLs.length; i++){
        if(id === userLs[i]){
            continue;
        }
        getUser(userLs[i]).pushMessage(new Message(null, null, msg, true));
    }
}

function start(resp){
    console.log("Request handler 'start' was called.");

    fs.readFile('./view/home.html', 'utf-8', function (err, data) {//读取内容
        if(err) throw err;
        resp.writeHead(200, {"Content-Type": "text/html"});//注意这里
        resp.write(data);
        resp.end();
    });
}

function getIn(resp, req){
    console.log("Request handler 'getIn' was called.");

    if(isDebug){
        console.log('DEBUG: '+url.parse(req.url, false).query);
        console.log('DEBUG: '+JSON.stringify(userList));
        console.log('DEBUG: '+JSON.stringify(roomList));
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
        room = createRoom(user.getId());
    }else{
        room = getRoom(+params.myRoomId);
    }
    if(!(room instanceof Room)){
        removeUser(user.getId());
        resp.writeHead(200,{"Content-Type":"text/plain"});
        resp.write(JSON.stringify({
            status: 1,
            errorMsg: errorMsg.createRoomFailed
        }));
        resp.end();
        return ;
    }
    user.setRoomId(room.getId());
    room.addUser(user.getId());
    sendSysMsg(room.getUsers(), 'userIn', user.getName(), user.getId());
    resp.writeHead(200,{"Content-Type":"text/plain"});
    resp.write(JSON.stringify({
        status: 0,
        data: {
            roomId: room.getId(),
            userId: user.getId(), // TODO - 用series id替换user id
            myName: user.getName(),
        }
    }));
    resp.end();
    if(isDebug){
        console.log('DEBUG: handler finished.');
        console.log('DEBUG: '+JSON.stringify(userList));
        console.log('DEBUG: '+JSON.stringify(roomList));
    }
    return ;
}

function send(resp, req){
    console.log("Request handler 'send' was called.");

    if(isDebug){
        console.log('DEBUG: '+url.parse(req.url, false).query);
        console.log('DEBUG: '+JSON.stringify(userList));
        console.log('DEBUG: '+JSON.stringify(roomList));
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
    user = getUser(+params.sender);
    if(!user){
        resp.writeHead(200,{"Content-Type":"text/plain"});
        resp.write(JSON.stringify({
            status: 1,
            errorMsg: errorMsg.senderNotFound
        }));
        resp.end();
        return ;
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
        if(user.getId() === userLs[i]){
            continue;
        }
        getUser(userLs[i]).pushMessage(new Message(user.getId(), user.getName(), params.content))
    }
    resp.writeHead(200,{"Content-Type":"text/plain"});
    resp.write(JSON.stringify({
        status: 0,
        data: {}
    }));
    resp.end();
    if(isDebug){
        console.log('DEBUG: handler finished.');
        console.log('DEBUG: '+JSON.stringify(userList));
        console.log('DEBUG: '+JSON.stringify(roomList));
    }
    return ;
}

function check(resp, req){
    // console.log("Request handler 'check' was called.");

    var params = url.parse(req.url, true).query,
        user, room, msgLs, msgLsObj;
    user = getUser(+params.userId);
    if(user === null){
        resp.writeHead(200,{"Content-Type":"text/plain"});
        resp.write(JSON.stringify({
            status: 1,
            errorMsg: errorMsg.userNotFound
        }));
        resp.end();
        return ;
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
        console.log('DEBUG: '+JSON.stringify(msgLs));
    }

    return ;
}

function end(resp, req){
    console.log("Request handler 'end' was called.");

    if(isDebug){
        console.log('DEBUG: '+url.parse(req.url, false).query);
        console.log('DEBUG: '+JSON.stringify(userList));
        console.log('DEBUG: '+JSON.stringify(roomList));
    }

    var params = url.parse(req.url, true).query,
        user, room;
    user = getUser(+params.userId);
    room = getRoom(+params.roomId);
    if(user === null){
        resp.writeHead(200,{"Content-Type":"text/plain"});
        resp.write(JSON.stringify({
            status: 1,
            errorMsg: errorMsg.userNotFound
        }));
        resp.end();
        return ;
    }
    room.removeUser(user.getId());
    removeUser(user.getId());
    if(room.getUsers().length === 0){
        removeRoom(room.getId());
    }else{
        sendSysMsg(room.getUsers(), 'userOut', user.getName(), user.getId());
    }
    resp.writeHead(200,{"Content-Type":"text/plain"});
    resp.write(JSON.stringify({
        status: 0,
        data: {}
    }));
    resp.end();
    if(isDebug){
        console.log('DEBUG: handler finished.');
        console.log('DEBUG: '+JSON.stringify(userList));
        console.log('DEBUG: '+JSON.stringify(roomList));
    }
    return ;
}

exports.start = start;
exports.getIn = getIn;
exports.send = send;
exports.check = check;
exports.end = end;