var request = require('request');
var config = require('../config');
module.exports = {
    /**
     * Get Authorization code 
     * @param {*} req 
     * @param {*} res 
     */
    getAuthCode: function(req, res)
    {
        var strAuthCode = req.query.code;
        console.log("Auth Code: ", strAuthCode)
        if(strAuthCode && strAuthCode != "")
        {
            this.getAccessToken(strAuthCode, req, res);
        }
    },
    /**
     * Get Access token with autoization code
     * ref https://marketplace.zoom.us/docs/guides/auth/oauth
     * @param {*} req 
     * @param {*} res 
     */
    getAccessToken: function(authCode, req, res) {
        var options = {
                method: 'POST',
                url: 'https://api.zoom.us/oauth/token',
                qs: {
                grant_type: 'authorization_code',             
                code: authCode,
                redirect_uri: config.zoom_redirect_url,
                },
                headers: {
                    Authorization: 'Basic ' + Buffer.from(config.client_id + ':' + config.client_secret).toString('base64')
                }
            }
          
            //Request access token only one time per user, after other request it will be reset and the old access token will not work anymore
            request(options, function(error, response, body) {
                if (error) throw new Error(error); 
                var access_token = JSON.parse(body).access_token; 
                console.log("Access-token: ", access_token);
                sess = req.session;  
                sess.access_token = access_token;
                res.redirect('/');
            });
    },
    /** 
     * Create a meeting 
     * ref https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetingcreate
     * @param {*} req 
     * @param {*} res 
     */
    createMeeting: function(req, res)
    {
        if(!req.session.access_token)
        {
            return res.json('There is no access token');
        }
        //Using some testing data, this can be changed to anything you want
        //
        var meetingData = {
            "topic": "Test Zoom Meeting",
            "type": "1",
            "password": "1234",
            "agenda": "https://awwapp.com/b/ucpxtw9kigxfg/",            
            "settings": {
              "host_video": true,
              "participant_video": true,              
            }
          };
        var options = {
            method: 'POST',
            url: 'https://api.zoom.us/v2/users/JrKk4r_kTCO2X9M-W_4hhw/meetings',
            body: JSON.stringify(meetingData),
            headers: {
                "Content-Type": 'application/json',
                "Authorization": 'Bearer ' + req.session.access_token,
            }
        }
        request(options, function(error, response, body) {
            if (error) throw new Error(error); 
            console.log(body);
            res.json({success:body});
           });
    },

    /**
     * Getting Signature for ZOOM sdk
     * TODO not being used yet, all is in frontend currently
     * @param {*} req 
     * @param {*} res 
     */
    getSignature (req, res)
    {
        
        var signature = this.generateSignature(config.api_key, config.api_secret, req.body.meetingData.meetingNumber, req.body.meetingData.role);
        res.send(signature);
    },

    /**
     * Generate Signature
     * @param {*} apiKey 
     * @param {*} apiSecret 
     * @param {*} meetingNumber 
     * @param {*} role 
     */
    generateSignature(apiKey, apiSecret, meetingNumber, role) {
        console.log(meetingNumber);
        console.log(meetingNumber);
        console.log(meetingNumber);
        console.log(meetingNumber);
        const crypto = require('crypto') // crypto comes with Node.js

        // Prevent time sync issue between client signature generation and zoom 
        const timestamp = new Date().getTime() - 30000
        const msg = Buffer.from(apiKey + meetingNumber + timestamp + role).toString('base64')
        const hash = crypto.createHmac('sha256', apiSecret).update(msg).digest('base64')
        const signature = Buffer.from(`${apiKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64')
      
        return signature
      }
    
}