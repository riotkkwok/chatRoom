function Message(senderId, senderName, content){
    this.senderId = senderId;
    this.senderName = senderName;
    this.content = content;
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

exports.Message = Message;