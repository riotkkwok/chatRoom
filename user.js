function User(name, id, roomId){
    this.name = name || 'anonymous';
    this.id = id || null;
    this.roomId = id || null;
    this.messages = [];
}

User.prototype.getName = function() {
    return this.name;
};

User.prototype.getId = function() {
    return this.id;
};

User.prototype.setId = function(id) {
    this.id = id;
};

User.prototype.getRoomId = function() {
    return this.roomId;
};

User.prototype.setRoomId = function(roomId) {
    this.roomId = roomId;
};

User.prototype.pushMessage = function(msg){
    this.messages.push(msg);
}

User.prototype.popAllMessage = function(){
    var result = this.messages;
    this.messages = [];
    return result;
}

// TODO - 添加series id

exports.User = User;