function Message(sdrId, sdrName, ctt, sys, sdrSid){
    var senderId = sdrId,
    senderName = sdrName,
    content = ctt,
    isSys = !!sys,
    senderSid = sdrSid;

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

    this.getSenderSid = function() {
        return senderSid;
    };
}

exports.Message = Message;