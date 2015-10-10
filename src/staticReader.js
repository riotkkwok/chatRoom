var url = require("url"),
    fs = require("fs");

var typeMap = {
    'css': 'text/css',
    'js': 'application/x-javascript',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
};

function readFile(resp, req){
    var filepath = url.parse(req.url, true).path,
        type = filepath.split('.').pop();
    console.log('load static file: '+ filepath);
    if(!/^\/static\//.test(filepath)){
        return404(resp);
        return;
    }
    fs.readFile('.'+filepath, 'binary', function (err, data) {//读取内容
        if(err){
            return404(resp);
            return;
        };
        resp.writeHead(200, {"Content-Type": typeMap[type]});//注意这里
        resp.write(data, 'binary');
        resp.end();
    });
}

function return404(resp){
    resp.writeHead(404, {"Content-Type": "text/plain"});
    resp.write('404 Not Found');
    resp.end();
}

exports.readFile = readFile;