const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
app.use(session({secret: 'keyboard cat', resave: false, saveUninitialized: true,cookie: { path: '/', httpOnly: true, maxAge: 30 * 30000 },rolling: true}));
var sess;
const port = 3000;
var MainController = require('./controllers/main');
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
app.use(bodyParser.json());      
app.use(bodyParser.urlencoded({extended: true}));

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.get('/', function (req, res)
{
    res.render('index.html', {authorized: typeof(req.session.access_token) != 'undefined' ? true : false});
});

app.post('/generate_signature/', function(req, res){
  MainController.getSignature(req, res); 
})

app.get('/authorize', function(req, res) 
{
  MainController.getAuthCode(req, res);
});
app.get('/getAccessToken', function(req, res) 
{
  MainController.getAccessToken(req, res);
});

app.get('/create_meeting', function(req, res) 
{
  MainController.createMeeting(req, res);
});

app.post('/meetings_webhook', function(req, res) 
{
  console.log(req.session);
  console.log('EVENT WORKED');
  var webHookInfo = req.body;
  switch(webHookInfo.event)
  {
    case 'meeting.created':
      console.log("Meeting created Event");
    break;
    case 'meeting.ended':
      console.log("Meeting ended Event");
    break;
    case 'meeting.started':
      console.log("Sending message to chat with link of aww board");
    break;
  }
  res.sendStatus(200);
});

