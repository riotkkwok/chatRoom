$(function(){
    var _userId, _userSid, _roomId, _userName, _checkTS, _errCount = 0, _loadingState = false;

    var __DEBUG = /debug=1/.test(location.search);

    var msgHTML = '<li class="msg-item ###me###">'
        + '<div class="msg-wrapper">'
        + '<div class="msg-sender">'
        + '<span>###username###</span>'
        + '<span>(###userid###)</span>'
        + '</div>'
        + '<div class="msg-content">###content###</div>'
        + '</div>'
        + '</li>',
    sysMsgHTML = '<li class="msg-item sys">'
        + '<div class="msg-wrapper">'
        + '<div class="msg-content sys">###content###</div>'
        + '</div>'
        + '</li>',
    linkHTML = '<a class="msg-link" href="###link###">###link###</a>';

    animateLoading();

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
        debugLog('name: '+$('#myName').val());
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
            error: function(xhr){
                var d = toast('临时工把服务器扔了，正在地毯式搜索......');
                d.done(fatalErrorHandler);
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
                    renderMsg({
                        sender: _userName,
                        senderId: _userId,
                        content: content,
                        isMe: true
                    });
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

    $(window).on('resize', calcMsgBoxHeight);

    calcMsgBoxHeight();

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
        debugLog('sid: '+_userSid);
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
                if(rs.data && rs.status === 0){
                    _errCount = 0;
                    if(rs.data.messages){
                        for(var i=0; i<rs.data.messages.length; i++){
                            if(rs.data.messages[i].isSys){
                                $('#msgList').append(sysMsgHTML
                                    .replace('###content###', rs.data.messages[i].content));
                                debugLog('sys msg: '+rs.data.messages[i].content);
                            }else{
                                renderMsg({
                                    sender: rs.data.messages[i].senderName,
                                    senderId: rs.data.messages[i].senderId,
                                    content: rs.data.messages[i].content,
                                    isMe: false
                                });
                                debugLog('get msg: '+rs.data.messages[i].content);
                            }
                        }
                    }else{
                        debugLog('no msg.');
                    }
                }else{
                    _errCount++;
                    toast(rs.errorMsg || '服务器连接失败，正在重试！');
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

    function fatalErrorHandler(){
        location.href = '/static/html/404.html';
    }

    function calcMsgBoxHeight(){
        var winH = $(window).height(), tmpH = 100;
        tmpH = Math.max(winH - $('.header').height() - $('.my-box').get(0).clientHeight, tmpH);
        $('.msg-box').height(tmpH);
        _loadingState = true;
    }

    function animateLoading(){
        var d1 = $.Deferred(), d2 = $.Deferred();
        d1.done(function(){
            $('#loadingBar').removeClass('loadingAnim2').addClass('loadingAnim3');
            setTimeout(function(){
                d2.resolve();
            }, 200);
        });
        d2.done(function(){
            $('#initLoading').addClass('hidden');
            $('#main').removeClass('invisible');
        });
        setTimeout(function(){
            $('#loadingBar').removeClass('loadingAnim1').addClass('loadingAnim2');
            var its = setInterval(function(){
                if(_loadingState){
                    clearInterval(its);
                    d1.resolve();
                }
            }, 1000)
        }, 4000);
        $('#loadingBar').addClass('loadingAnim1');
    }

    function renderMsg(options){
        var re = /http(?:s)?:\/\/(?:(?:\w|[^\x00-\xff])*(?:\.|\/|\?|\&|\=|\%)?)*/g, 
            msgStr = options.content, links;
        links = msgStr.match(re);
        if(links){
            for(var i=0; i<links.length; i++){
                msgStr = msgStr.replace(links[i], linkHTML.replace(/###link###/g, links[i]));
            }
        }
        $('#msgList').append(msgHTML
            .replace('###me###', options.isMe ? 'me' : '')
            .replace('###username###', options.sender || '')
            .replace('###userid###', options.senderId || '')
            .replace('###content###', msgStr));
        $('.msg-box').scrollTop($('#msgList').height());
    }

    function debugLog(str){
        if(__DEBUG){
            console.log('['+(+new Date)+'] '+str);
        }
    }

    // TODO - error handler
});