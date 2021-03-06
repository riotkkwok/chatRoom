function User(n, i, ri, si){
    var name = n || 'anonymous',
    id = i || null,
    roomId = ri || null,
    messages = [],
    sid = si,
    createTime = (+new Date()),
    lastConnTime = createTime;

    this.getName = function() {
        return name;
    };

    this.getId = function() {
        return id;
    };

    this.setId = function(i) {
        id = i;
    };

    this.getRoomId = function() {
        return roomId;
    };

    this.setRoomId = function(ri) {
        roomId = ri;
    };

    this.pushMessage = function(msg){
        messages.push(msg);
    };

    this.popAllMessage = function(){
        var result = messages;
        messages = [];
        return result;
    };

    this.getSid = function(){
        return sid;
    };

    this.setSid = function(si){
        sid = si;
    };

    this.getCreateTime = function(){
        return createTime;
    };

    this.setLastConnTime = function(lct){
        lastConnTime = lct;
    };

    this.getLastConnTime = function(){
        return lastConnTime;
    };
}

exports.User = User;