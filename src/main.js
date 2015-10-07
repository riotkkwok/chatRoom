var server = require("./server");
var router = require("./router");
var reqHandlers = require("./requestHandlers");

var handle = {};
handle['/'] = reqHandlers.start;
handle['/start'] = reqHandlers.start;
handle['/select'] = reqHandlers.getIn;
handle['/send'] = reqHandlers.send;
handle['/check'] = reqHandlers.check;
handle['/end'] = reqHandlers.end;

server.start(router.route, handle);