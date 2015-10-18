function Message(sdrId, sdrName, ctt, sys){
    var senderId = sdrId,
    senderName = sdrName,
    content = ctt,
    isSys = !!sys;

    this.getSenderId = function() {
        return senderId;
    };

    this.getSenderName = function() {
        return senderName;
    };

    this.getContent = function() {
        return content;
    };

    this.getIsSys = function() {
        return isSys;
    };
}

exports.Message = Message;