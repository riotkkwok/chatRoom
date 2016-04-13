var url = require("url"),
    fs = require("fs"),
    formidable = require("formidable"),
    crypto = require("crypto"),
    User = require("./user").User,
    Room = require("./room").Room,
    Message = require("./message").Message,
    errorMsg = require("./errorMsg").errorMsg,
    Img = require("./img").Img,
    logger = require("./logger").logger;

var userList = [],
    roomList = [],
    imgList = [],
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
 * ajax response status [start] 
 */

function createUser(name, roomId){
    var newItem, tmp;
    newItem = new User(name, null, roomId);
    logger.debugLog('createUser()');
    logger.debugLog(userList);
    if(userList.length === 0){
        newItem.setId(1);
        userList.push(newItem);
    }else if(userList.length >= USER_MAX_SIZE){
        logger.warnLog('the user list reachs maximum.');
        return 0;
    }else{
        for(var i=0; i<userList.length; i++){
            if(i + 1 < userList[i].getId()){
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
    logger.debugLog(userList);
    return newItem;
}

function createRoom(userId){
    var newItem, tmp;
    newItem = new Room(userId, [userId]);
    if(roomList.length === 0){
        newItem.setId(1);
        roomList.push(newItem);
    }else if(roomList.length >= ROOM_MAX_SIZE){
        logger.warnLog('the room list reachs maximum.');
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

function imgCheckingJob(){
    var img;
    for(var i=0; i<imgList.length; i++){
        img = imgList[i];
        if(+new Date() > +img.getExpiry()){
            fs.unlink('./tmp/'+img.getName(), function(){
                imgList.shift();
            })
        }
    }
}

function start(resp){
    logger.debugLog("Request handler 'start' was called.");

    fs.readFile('./view/home.html', 'utf-8', function (err, data) {//读取内容
        if(err) throw err;
        resp.writeHead(200, {"Content-Type": "text/html", "Set-Cookie": "ssid="+global.chatroom.setupstamp});//注意这里
        resp.write(data);
        resp.end();
    });
}

function getIn(resp, req){
    logger.debugLog("Request handler 'getIn' was called.");

    if(isDebug){
        logger.debugLog(url.parse(req.url, false).query);
        logger.debugLog(userList);
        logger.debugLog(roomList);
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
        logger.errorLog('getIn() '+errorMsg.createUserFailed);
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
        logger.errorLog('getIn() '+errorMsg.createRoomFailed);
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
        logger.debugLog(userList);
        logger.debugLog(roomList);
        logger.debugLog('handler finished.');
    }
    return ;
}

function send(resp, req){
    logger.debugLog("Request handler 'send' was called.");

    if(isDebug){
        logger.debugLog(url.parse(req.url, false).query);
        logger.debugLog(userList);
        logger.debugLog(roomList);
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
        logger.errorLog('send() '+errorMsg.invalidSenderContent);
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
        logger.errorLog('send() '+errorMsg.senderNotFound);
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
        logger.errorLog('send() '+errorMsg.chatRoomNotFound);
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
        logger.debugLog(userList);
        logger.debugLog(roomList);
        logger.debugLog('handler finished.');
    }
    return ;
}

function sendImg(resp, req){
    logger.debugLog("Request handler 'sendImg' was called.");

    if(isDebug){
        logger.debugLog(url.parse(req.url, false).query);
        logger.debugLog(userList);
        logger.debugLog(roomList);
    }

    if(!checkSsid(resp, req.headers.cookie)){
        return ;
    }

    var form = new formidable.IncomingForm();
    form.parse(req,function(error, fields, files){
        if(isDebug){
            logger.debugLog(error);
            logger.debugLog(fields);
            logger.debugLog(files);
        }

        var params = fields,
            user, room, userLs;
        if(!params.sender && !params.fileName){
            resp.writeHead(200,{"Content-Type":"text/html"});
            resp.write("<script type=\"text/javascript\">"+
                "window.parent.uploadListener('"+JSON.stringify({
                    status: 1,
                    errorMsg: errorMsg.invalidSenderContent
                }) +"', true)"+
                "</script>");
            resp.end();
            logger.errorLog('sendImg() '+errorMsg.invalidSenderContent);
            return ;
        }
        user = getUser(params.sender);
        if(!user){
            resp.writeHead(200,{"Content-Type":"text/html"});
            resp.write("<script type=\"text/javascript\">"+
                "window.parent.uploadListener('"+JSON.stringify({
                    status: 1,
                    errorMsg: errorMsg.senderNotFound
                }) +"', true)"+
                "</script>");
            resp.end();
            logger.errorLog('sendImg() '+errorMsg.senderNotFound);
            return ;
        }else{
            user.setLastConnTime(+new Date());
        }
        room = getRoom(user.getRoomId());
        if(!room){
            resp.writeHead(200,{"Content-Type":"text/html"});
            resp.write("<script type=\"text/javascript\">"+
                "window.parent.uploadListener('"+JSON.stringify({
                    status: 1,
                    errorMsg: errorMsg.chatRoomNotFound
                }) +"', true)"+
                "</script>");
            resp.end();
            logger.errorLog('sendImg() '+errorMsg.chatRoomNotFound);
            return ;
        }

        var img = new Img(params.fileName);
        imgList.push(img);
        fs.renameSync(files.file.path, "./tmp/"+ img.getName());

        userLs = room.getUsers();
        for(var i=0; i<userLs.length; i++){
            if(user.getSid() === userLs[i]){
                continue;
            }
            getUser(userLs[i]).pushMessage(new Message(user.getId(), user.getName(), img.getName(), false, user.getSid(), true))
        }

        // resp.writeHead(500,{"Content-Type":"text/plain"});
        resp.writeHead(200,{"Content-Type":"text/html"});
        resp.write("<script type=\"text/javascript\">"+
            "window.parent.uploadListener('"+img.getName() +"')"+
            "</script>");
        resp.end();
    });
}

function showImg(resp, req){
    logger.debugLog("Request handler 'showImg' was called.");

    var params = url.parse(req.url, true).query,
        fileName = params.n,
        typeMap = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
        };;
    fs.readFile('./tmp/'+fileName, 'binary', function (err, data) {//读取内容
        if(err){
            // return404(resp);
            resp.writeHead(404, {"Content-Type": "text/plain"});
            resp.write('404 Not Found');
            resp.end();
            logger.errorLog('showImg() '+'404 Not Found'+' - '+err);
            return;
        };
        resp.writeHead(200, {"Content-Type": typeMap[fileName.split('.').pop()]});//注意这里
        resp.write(data, 'binary');
        resp.end();
    });
}

function check(resp, req){
    // logger.debugLog("Request handler 'check' was called.");

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
        logger.errorLog('check() '+errorMsg.userNotFound);
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
            'isImg': msgLsObj[i].getIsImg(),
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
        logger.debugLog(msgLs);
    }

    return ;
}

function end(resp, req){
    logger.debugLog("Request handler 'end' was called.");

    if(isDebug){
        logger.debugLog(url.parse(req.url, false).query);
        logger.debugLog(userList);
        logger.debugLog(roomList);
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
        logger.errorLog('end() '+errorMsg.userNotFound);
        return ;
    }
    userLeaveRoom(user, room);
    resp.writeHead(200,{"Content-Type":"text/plain", "Set-Cookie": "ssid=; expires="+(new Date(0).toGMTString())});
    resp.write(JSON.stringify({
        status: 0,
        data: {}
    }));
    resp.end();
    if(isDebug){
        logger.debugLog(userList);
        logger.debugLog(roomList);
        logger.debugLog('handler finished.');
    }
    return ;
}

/* init method */
!function(){
    fs.readdir('./tmp', function(err, files){
        if(err){
            return;
        }
        for(var i=0; i<files.length; i++){
            fs.unlink('./tmp/'+files[i]);
        }
    });
    setInterval(function(){
        userLoginCheckingJob();
        imgCheckingJob();
    }, 10000);
}();

exports.start = start;
exports.getIn = getIn;
exports.send = send;
exports.sendImg = sendImg;
exports.showImg = showImg;
exports.check = check;
exports.end = end;