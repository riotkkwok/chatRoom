function Message(senderId, content){
    this.senderId = senderId;
    this.content = content;
}

Message.prototype.getSenderId = function() {
    return this.senderId;
};

Message.prototype.getContent = function() {
    return this.content;
};

exports.Message = Message;