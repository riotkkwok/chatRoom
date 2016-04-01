# chatRoom

## 项目介绍
这是一个非常简易的聊天室网站。

初学nodejs，自己捣鼓的一个小项目，恰好因为多屏设备开发需要，经常都要把文字从PC／手机／Mac上相互copy，于是就产生了搞这么一个项目的想法。

项目还在完善中，持续更新…………

## 技术实现
基于HTML+CSS3+JS(jQuery)实现前端UI交互／数据请求的功能，后端使用nodejs。目前除了404页面以外，大部分功能都是在同一个页面上呈现。

### 服务器请求
/ or /start 
进入页面

/select
输入用户名，进入聊天室（ajax请求）

/send
发送消息（ajax请求）

/check
检查是否有消息需要接收（ajax请求）

/end
离开聊天室（ajax请求）

## 浏览器兼容
主要考虑移动端的iOS和Android，PC端的Firefox和Chrome，Mac端的Safari、Chrome和Firefox。

## 计划实现功能／改进
* 实现Websocket通信，且在不支持的浏览器继续使用ajax轮询
* 使用Session／cookie实现登陆状态保持
* 使用Express
* 使用Angular或Vue改写前端代码
* 支持图片发送
