var line = '====================',
    prefix = {
        debug: '[DEBUG] ',
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

function debug(s){
    var now = new Date, str;
    if(typeof s === 'object'){
        str = objString(s);
    }else{
        str = s;
    }
    console.log(prefix.debug + dateString() + ' -- ' +str);
    console.log(line);
}

function error(s){
    var now = new Date, str = s;
    if(typeof str === 'object'){
        str = objString(str);
    }
    console.log(prefix.error + dateString() + ' -- ' +str);
    console.log(line);
}

exports.logger = {
    debugLog: debug,
    errorLog: error
};