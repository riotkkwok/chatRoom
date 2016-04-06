function Message(sdrId, sdrName, ctt, sys, sdrSid, img){
    var senderId = sdrId,
    senderName = sdrName,
    content = ctt,
    isSys = !!sys,
    isImg = !!img,
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

    this.getIsImg = function() {
        return isImg;
    }

    this.getSenderSid = function() {
        return senderSid;
    };
}

exports.Message = Message;