$(function(){
    var _userId, _roomId, _userName;

    var msgHTML = '<li class="msg-item">'
        + '<div class="msg-wrapper">'
        + '<div class="msg-sender">'
        + '<span class="name">###username###</span>'
        + '<span class="uid">(###userid###)</span>'
        + '</div>'
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
        // TODO - validate
        $.ajax({
            url: '/select',
            data: {
                'newRoom': $('#newRoom').get(0).checked ? $('#newRoom').val() : '0',
                'myRoomId': $('#myRoomId').val(),
                'myName': $('#myName').val(),
            },
            dataType: 'json',
            success: function(rs){
                $('#newRoom').removeAttr('checked');
                $('#myRoomId').val('');
                $('#myName').val('');
                init(rs.data);
                // TODO
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
                'userId': _userId,
                'roomId': _roomId,
            },
            dataType: 'json',
            success: function(rs){
                toast('正在退出...');
                setTimeout(function(){
                    location.reload();
                }, 3000);
            },
            error: function(){
                toast('正在退出...');
                setTimeout(function(){
                    location.reload();
                }, 3000);
            }
        });
    });
    $('#myMsg').click(function(){
        ;
    });
    $('#submitBtn').click(function(){
        var content = $('#myMsg').val();
        // TODO - validate
        $('#myMsg').attr('readonly', true).addClass('freeze');
        $.ajax({
            url: '/send',
            data: {
                'sender': _userId,
                'content': $('#myMsg').val(),
            },
            dataType: 'json',
            success: function(rs){
                if(rs.data && rs.status === 0){
                    $('#myMsg').val('').removeAttr('readonly').removeClass('freeze');
                    $('#msgList').append(msgHTML
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
        _roomId = data.roomId;
        _userName = data.myName;
        $('#selectRoom').addClass('hidden');
        $('#roomId').text(data.roomId);
        $('#leaveBtn').removeClass('hidden');
        setInterval(checkMsg, 5000);
    }

    function toast(str){
        // TODO - 添加Deferred
        console.log('toast: '+str);
        $('#toast').addClass('show-toast').children('p').text(str);
        setTimeout(function(){
            $('#toast').removeClass('show-toast').children('p').text('');
        }, 3000);
    }

    function checkMsg(){
        $.ajax({
            url: '/check',
            data: {
                'userId': _userId,
            },
            dataType: 'json',
            success: function(rs){
                if(rs.data && rs.data.messages){
                    for(var i=0; i<rs.data.messages.length; i++){
                        $('#msgList').append(msgHTML
                            .replace('###username###', rs.data.messages[i].senderName)
                            .replace('###userid###', rs.data.messages[i].senderId)
                            .replace('###content###', rs.data.messages[i].content));
                    }
                }
            },
            error: function(){}
        })
    }
});