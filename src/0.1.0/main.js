var server = require("./server");
var router = require("./router");
var reqHandlers = require("./requestHandlers");
var staticReader = require("./staticReader");

var handle = {};
handle['/'] = reqHandlers.start;
handle['/start'] = reqHandlers.start;
handle['/select'] = reqHandlers.getIn;
handle['/send'] = reqHandlers.send;
handle['/sendImg'] = reqHandlers.sendImg;
handle['/showImg'] = reqHandlers.showImg;
handle['/check'] = reqHandlers.check;
handle['/end'] = reqHandlers.end;
handle.staticReader = staticReader.readFile;


server.start(router.route, handle);
server.getIPAdress();