function User(n, i, ri){
    var name = n || 'anonymous',
    id = i || null,
    roomId = ri || null,
    messages = [];

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
    }

    this.popAllMessage = function(){
        var result = messages;
        messages = [];
        return result;
    }

    // TODO - 添加series id
}

exports.User = User;