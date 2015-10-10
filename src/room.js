var MAX_SIZE = 5;

function Room(id, userLs){
    this.id = id || null;
    this.users = userLs || [];
}

Room.prototype.getId = function() {
    return this.id;
};

Room.prototype.setId = function(id) {
    this.id = id;
};

Room.prototype.getUsers = function() {
    return this.users;
};

Room.prototype.addUser = function(userId) {
    var tmp;
    if(this.users.length + 1 >= MAX_SIZE){
        return 0;
    }
    for(var i=0; i<this.users.length; i++){
        if(this.users[i] === userId){
            return 0;
        }
        if(this.users[i] > userId){
            tmp = this.users.splice(i);
            this.users = this.users.concat(userId).concat(tmp);
            return 1;
        }
    }
    this.users.push(userId);
    return 1;
};

Room.prototype.removeUser = function(userId) {
    var r = 0;
    for(var i=0; i<this.users.length; i++){
        if(this.users[i] === userId){
            r = 1;
        }
        if(r === 1){
            this.users[i] = this.users[i+1];
        }
    }
    if(r === 1){
        --this.users.length;
    }
    return r;
};

exports.Room = Room;