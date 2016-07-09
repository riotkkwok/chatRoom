function Img(fileName){
    this.expiry = genExpiry();
    this.name = genName(fileName);
    this.type = this.name.indexOf('.')>=0 ? this.name.split('.').pop() : undefined;

    this.getName = function(){
        return this.name;
    }
    this.getType = function(){
        return this.type;
    }
    this.getExpiry = function(){
        return this.expiry;
    }
}

function genName(fileName){
    var result = '', chars = 'abcdefghijklmnopqrstuvwxyz0123456789', 
        fileType = fileName.split('.');
    if(fileType <= 1){
        return null;
    }
    fileType = fileType.pop();
    for(var i=0; i<16; i++){
        result += chars[parseInt(Math.random() * chars.length, 10)];
    }
    return result+'_'+(+new Date)+'.'+fileType;
}

function genExpiry(){
    var now = new Date();
    now.setMinutes(now.getMinutes()+2);
    return now;
}

exports.Img = Img;