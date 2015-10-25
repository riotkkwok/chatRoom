$(function(){
    var _userId, _userSid, _roomId, _userName, _checkTS, _errCount = 0;

    var msgHTML = '<li class="msg-item ###me###">'
        + '<div class="msg-wrapper">'
        + '<div class="msg-sender">'
        + '<span>###username###</span>'
        + '<span>(###userid###)</span>'
        + '</div>'
        + '<div class="msg-content">###content###</div>'
        + '</div>'
        + '</li>',
    msgHTML2 = '<li class="msg-item sys">'
        + '<div class="msg-wrapper">'
        + '<div class="msg-content sys">###content###</div>'
        + '</div>'
        + '</li>',
    sysMsgHTML = '<li class="msg-item sys">'
        + '<div class="msg-wrapper">'
        + '<div class="msg-content">###content###</div>'
        + '</div>'
        + '</li>';

    /* 信息输入框 [start] */
    $('#newRoom').click(function(){
        if(this.checked){
            $('#roomRow').addClass('hidden');
        }else{
            $('#roomRow').removeClass('hidden');
        }
    });
    $('#submitInfo').click(function(){
        if(!userInfoValidate()){
            return;
        }
        $.ajax({
            url: '/select',
            data: {
                'newRoom': $('#newRoom').get(0).checked ? $('#newRoom').val() : '0',
                'myRoomId': $('#myRoomId').val(),
                'myName': $('#myName').val(),
            },
            dataType: 'json',
            success: function(rs){
                if(rs.data && rs.status === 0){
                    $('#newRoom').removeAttr('checked');
                    $('#myRoomId').val('');
                    $('#myName').val('');
                    init(rs.data);
                }else{
                    $('#myRoomId').val('');
                    $('#myName').val('');
                    toast(rs.errorMsg || '发送失败，请重试！');
                }
            },
            error: function(){
                $('#selectRoom').addClass('hidden');
                // TODO
            }
        })
    });
    /* 信息输入框 [end] */

    /* 聊天窗口 [start] */
    $('#leaveBtn').click(function(){
        $.ajax({
            url: '/end',
            data: {
                'userSid': _userSid,
                'roomId': _roomId,
            },
            dataType: 'json',
            success: cb,
            error: cb
        });
        function cb(){
            var d = toast('正在退出...');
            d.done(function(){
                location.reload();
            });
        }
    });
    $('#myMsg').click(function(){
        ;
    });
    $('#submitBtn').click(function(){
        var content = $('#myMsg').val();
        if(!messageValidate()){
            return;
        }
        $('#myMsg').attr('readonly', true).addClass('freeze');
        $.ajax({
            url: '/send',
            data: {
                'sender': _userSid,
                'content': $('#myMsg').val(),
            },
            dataType: 'json',
            success: function(rs){
                if(rs.data && rs.status === 0){
                    $('#myMsg').val('').removeAttr('readonly').removeClass('freeze');
                    $('#msgList').append(msgHTML
                        .replace('###me###', 'me')
                        .replace('###username###', _userName)
                        .replace('###userid###', _userId)
                        .replace('###content###', content));
                }else{
                    $('#myMsg').removeAttr('readonly').removeClass('freeze');
                    toast(rs.errorMsg || '发送失败，请重试！');
                }
            },
            error: function(){
                $('#myMsg').removeAttr('readonly').removeClass('freeze');
                toast('发送失败，请重试！');
            }
        });
    });
    /* 聊天窗口 [end] */

    function init(data){
        _userId = data.userId;
        _userSid = data.userSid;
        _roomId = data.roomId;
        _userName = data.myName;
        $('#selectRoom').addClass('hidden');
        $('#roomId').text(data.roomId);
        $('#leaveBtn').removeClass('hidden');
        $('#username').text(_userName+'('+_userId+')');
        _checkTS = setInterval(checkMsg, 5000);
    }

    function toast(str){
        console.log('toast: '+str);
        var def = $.Deferred();
        $('#toast').addClass('show-toast').children('p').text(str);
        setTimeout(function(){
            $('#toast').removeClass('show-toast').children('p').text('');
            def.resolve();
        }, 3000);
        return def;
    }

    function checkMsg(){
        if(_errCount >= 12){
            clearInterval(_checkTS);
            $('#confirmBtn').one('click', function(){
                location.reload();
                $('#prompt').addClass('hidden');
            });
            $('#promptMsg').text('You\'re disconnented with the server, please re-enter.');
            $('#prompt').removeClass('hidden');
        }
        $.ajax({
            url: '/check',
            data: {
                'userSid': _userSid,
            },
            dataType: 'json',
            success: function(rs){
                if(rs.data && rs.data.messages){
                    if(rs.status === 0){
                        _errCount = 0;
                    }
                    for(var i=0; i<rs.data.messages.length; i++){
                        if(rs.data.messages[i].isSys){
                            $('#msgList').append(msgHTML2
                                .replace('###content###', rs.data.messages[i].content));
                        }else{
                            $('#msgList').append(msgHTML
                                .replace('###me###', '')
                                .replace('###username###', rs.data.messages[i].senderName||'')
                                .replace('###userid###', rs.data.messages[i].senderId||'')
                                .replace('###content###', rs.data.messages[i].content));
                        }
                    }
                }
            },
            error: function(){
                _errCount++;
            }
        })
    }

    function userInfoValidate(){
        var errorMsg = {
            userNameMaxLength: 'User name should not be more than 20 charaters.',
            roomIdNull: 'Room ID should not be blank.',
            roomIdNumeric: 'Room ID should be numeric.',
            roomIdMax: 'Room ID should not be larger than 50.'
        };
        var nameVal = $('#myName').val(), 
            roomVal = $('#myRoomId').val(), 
            isNew = $('#newRoom').get(0).checked,
            msg;
        if(nameVal.length > 20){
            msg = errorMsg.userNameMaxLength;
            // TODO - input warning
        }
        if(!isNew){
            if(roomVal.length === 0){
                msg = errorMsg.roomIdNull;
                // TODO - input warning
            }else if(!/^[1-9][0-9]*$/.test(roomVal)){
                msg = errorMsg.roomIdNumeric;
                // TODO - input warning
            }else if(parseInt(roomVal, 10) > 50){
                msg = errorMsg.roomIdMax;
                // TODO - input warning
            }
        }
        if(msg){
            toast(msg);
            return false;
        }else{
            return true;
        }
    }

    function messageValidate(){
        var errorMsg = {
            userInvalid: 'User is invalid, please re-login.',
            contentNull: 'Content should not be blank.',
        };
        var content =  $('#myMsg').val(), msg;
        if(content.length === 0){
            msg = errorMsg.contentNull;
            // TODO - textarea warning
        }
        if(!_userSid){
            msg = errorMsg.userInvalid;
            // TODO - textarea warning
        }
        if(msg){
            toast(msg);
            return false;
        }else{
            return true;
        }
    }
});