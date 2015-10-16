function Message(senderId, senderName, content, isSys){
    this.senderId = senderId;
    this.senderName = senderName;
    this.content = content;
    this.isSys = !!isSys;
}

Message.prototype.getSenderId = function() {
    return this.senderId;
};

Message.prototype.getSenderName = function() {
    return this.senderName;
};

Message.prototype.getContent = function() {
    return this.content;
};

Message.prototype.getIsSys = function() {
    return this.isSys;
};

exports.Message = Message;