var http = require("http");
var url = require("url");
var crypto = require("crypto");

function start(route, handle){
    function onRequest(req, resp){
        var pathname = url.parse(req.url).pathname;
        route(handle, pathname, resp, req);
    }

    http.createServer(onRequest).listen(8888);
    console.log("Server has started.");
    var sha1 = crypto.createHash('sha1');
    sha1.update('setupstamp'+(+new Date())+(Math.random()*10000).toString().substring(0,4));
    global.chatroom = {
        setupstamp: sha1.digest('hex')
    };
    // console.log(global.chatroom.setupstamp);
}

function getIPAdress(){  
    var interfaces = require('os').networkInterfaces();  
    for(var devName in interfaces){  
        var iface = interfaces[devName];  
        for(var i=0;i<iface.length;i++){  
            var alias = iface[i];  
            if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
                console.log(alias.address);
                return alias.address;
            }  
        }  
    }  
}

exports.start = start;
exports.getIPAdress = getIPAdress;