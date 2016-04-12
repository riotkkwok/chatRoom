var line = '====================',
    prefix = {
        debug: '[DEBUG] ',
        warn: '[WARN]',
        error: '[ERROR] '
    };

function dateString(d){
    var date = d;
    if(!date){
        date = new Date;
    }
    return date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds()+'.'+date.getMilliseconds();
}

function objString(o){
    var result = '{ ';
    if(o instanceof Array){
        for(var i=0; i<o.length; i++){
            result += (objString(o[i])+', ');
        }
    }else{
        for(var key in o){
            if(o.hasOwnProperty(key)){
                if(typeof o[key] === 'function' && /^(get)|(is)/.test(key)){
                    result += (key + ':' + o[key]()+', ');
                }else if(typeof o[key] === 'number' || typeof o[key] === 'string'){
                    result += (o[key]+', ');
                }
            }
        }
    }
    return result+' }';
}

function log(s, type){
    var now = new Date, str = s;
    if(typeof str === 'object'){
        str = objString(str);
    }
    console.log(prefix[type] + dateString() + ' -- ' +str);
    console.log(line);
}

function debug(s){
    log(s, 'debug');
}

function warn(s){
    log(s, 'warn');
}

function error(s){
    log(s, 'error');
}

exports.logger = {
    debugLog: debug,
    warnLog: warn,
    errorLog: error
};