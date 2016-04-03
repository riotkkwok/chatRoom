function Img(){
    this.expiry = genExpiry();
    this.name = genName();

    this.getName = function(){
        return this.name;
    }
    this.getExpiry = function(){
        return this.expiry;
    }
}

function genName(){
    var result = '', chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for(var i=0; i<16; i++){
        result += chars[parseInt(Math.random() * chars.length, 10)];
    }
    return result+'_'+(+new Date);
}

function genExpiry(){
    var now = new Date();
    now.setMinutes(now.getMinutes()+2);
    return now;
}

exports.Img = Img;