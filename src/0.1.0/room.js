var MAX_SIZE = 5;

function Room(i, ul){
    id = i || null;
    users = ul || [];

    this.getId = function() {
        return id;
    };

    this.setId = function(i) {
        id = i;
    };

    this.getUsers = function() {
        return users;
    };

    this.addUser = function(ui) {
        var tmp;
        if(users.length + 1 >= MAX_SIZE){
            return 0;
        }
        for(var i=0; i<users.length; i++){
            if(users[i] === ui){
                return 0;
            }
            if(users[i] > ui){
                tmp = users.splice(i);
                users = users.concat(ui).concat(tmp);
                return 1;
            }
        }
        users.push(ui);
        return 1;
    };

    this.removeUser = function(ui) {
        var r = 0;
        for(var i=0; i<users.length; i++){
            if(users[i] === ui){
                r = 1;
            }
            if(r === 1){
                users[i] = users[i+1];
            }
        }
        if(r === 1){
            --users.length;
        }
        return r;
    };
}

exports.Room = Room;