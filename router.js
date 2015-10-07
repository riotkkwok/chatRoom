function route(handle, pathname, resp, req){
    console.log('About to route a request for '+ pathname);
    if(typeof handle[pathname] === 'function'){
        try{
            handle[pathname](resp, req);
        }catch(e){
            console.log("Runtime error found: " + e);
            resp.writeHead(500, {"Content-Type": "text/plain"});
            resp.write("500 Server Error");
            resp.end();
        }
    }else{
        console.log("No request handler found for " + pathname);
        resp.writeHead(404, {"Content-Type": "text/plain"});
        resp.write("404 Not Found");
        resp.end();
    }
}

exports.route = route;