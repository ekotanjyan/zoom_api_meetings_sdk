let request = require('request');
let config = require('../config');
module.exports = {
    /**
     * Get Authorization code
     * @param {*} req
     * @param {*} res
     */
    getAuthCode: function (req, res) {
        var strAuthCode = req.query.code;
        console.log("Auth Code: ", strAuthCode)
        if (strAuthCode && strAuthCode != "") {
            this.getAccessToken(strAuthCode, req, res);
        }
    },

    /**
     * Get Access token with autoization code
     * ref https://marketplace.zoom.us/docs/guides/auth/oauth
     * @param {*} req
     * @param {*} res
     */
    getAccessToken: function (authCode, req, res) {
        let options = {
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
        let self = this;

        //Request access token only one time per user, after other request it will be reset and the old access token will not work anymore
        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            let access_token = JSON.parse(body).access_token;
            console.log("Access-token: ", access_token);
            sess = req.session;
            sess.access_token = access_token;
            //TODO check if in aww we have user integrated with zoom(it can be extra new field within db like zoom_id or something like that)
            //TODO if user does not exist then create new user, if it exsits user that user zoom id to create meeting
            self.createUser(req, res);
        });
    },

    /**
     * Create a meeting
     * ref https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetingcreate
     * @param {*} req
     * @param {*} res
     */
    createMeeting: function (req, res) {
        if (!req.session.access_token) {
            return res.json('There is no access token');
        }
        // TODO changed to correct data
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

        // TODO needs to create a user within Aww
        //  or take from AWW and also needs to create user within Zoom with function createUser and get that zoom user id
        //  and then pass to this API endpoint

        var options = {
            method: 'POST',
            url: 'https://api.zoom.us/v2/users/JrKk4r_kTCO2X9M-W_4hhw/meetings',
            body: JSON.stringify(meetingData),
            headers: {
                "Content-Type": 'application/json',
                "Authorization": 'Bearer ' + req.session.access_token,
            }
        }
        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            //TODO save this data in AWW database for showing joing button to users opened same awwapp link when created this meeting
            res.json({success: body});
        });
    },

    /**
     * Getting Signature for ZOOM sdk
     * @param {*} req
     * @param {*} res
     */
    getSignature(req, res) {
        if (config.api_key
            && config.api_secret
            && req.body.meetingNumber
            && req.body.role) {
            let signature = this.generateSignature(config.api_key, config.api_secret, req.body.meetingNumber, req.body.role);
            res.send({signature: signature, apikey: config.api_key});
        } else {
            res.send({error: true});
        }

    },

    /**
     * Generate Signature
     * @param {*} apiKey
     * @param {*} apiSecret
     * @param {*} meetingNumber
     * @param {*} role
     */
    generateSignature(apiKey, apiSecret, meetingNumber, role) {

        const crypto = require('crypto') // crypto comes with Node.js

        // Prevent time sync issue between client signature generation and zoom
        const timestamp = new Date().getTime() - 30000
        const msg = Buffer.from(apiKey + meetingNumber + timestamp + role).toString('base64')
        const hash = crypto.createHmac('sha256', apiSecret).update(msg).digest('base64')
        const signature = Buffer.from(`${apiKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64')

        return signature
    },

    /**
     * Create new Zoom User
     * @param req
     * @param res
     */
    createUser: function (req, res) {

        /*
        TODO this needs to be changed with your AWW user details
         */
        let objNewUser = {
            action: 'create',
            user_info: {
                email: 'newEmail@custom',
                type: 1,
                first_name: 'Aww New User First Name',
                last_name: 'Lastname'
            }
        }
        let options = {
            "method": "POST",
            "url": "https://api.zoom.us/v2/users",
            "body": JSON.stringify(objNewUser),
            "headers": {
                "content-type": "application/json",
                "Authorization": 'Bearer ' + req.session.access_token,
            }
        };

        request(options, function (error, response, body) {

            //TODO this is not working currently it needs paid plan to let you create new users


            //TODO take the body, analyze it and save/merge into AWW database user
            console.log(body);
            res.redirect('/')
        });


    }

}
