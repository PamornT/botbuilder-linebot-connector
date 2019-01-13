
const fetch = require('node-fetch');
const crypto = require('crypto');
var url = require('url');

// import bodyParser from "body-parser";
var bodyParser = require('body-parser')

import * as botbuilder from "botbuilder";

const VERIFY_TOKENS = [
    '00000000000000000000000000000000',
    'ffffffffffffffffffffffffffffffff'
]
export class ImageMap implements botbuilder.IIsAttachment {
    // session: botbuilder.Session;
    address: botbuilder.IAddress
    text: string;
    baseUrl: string;
    baseSize: { width: number, height: number }
    actions: Array<{
        type: string,
        linkUri?: string,
        label?: string,
        text?: string,
        area: {
            x: number,
            y: number,
            width: number,
            height: number
        }
    }>
    constructor(address: botbuilder.IAddress, text: string, baseUrl: string, baseSize: { width: number, height: number }, actions: Array<{
        type: string,
        linkUri?: string,
        label?: string,
        text?: string,
        area: {
            x: number,
            y: number,
            width: number,
            height: number
        }
    }>) {
        this.address = address;
        this.text = text;
        this.baseUrl = baseUrl;
        this.baseSize = baseSize;
        this.actions = actions;
    }
    toAttachment(): botbuilder.IAttachment {
        return {
            contentType: "imagemap",
            content: {
                baseUrl: this.baseUrl,
                baseSize: this.baseSize,
                actions: this.actions,
                text: this.text
            }
        }
        // throw new Error("Method not implemented.");
        // console.log(this.session.message)
        // let address: any = this.session.message.address;
        // if (this.session.message &&
        //     ((this.session.message.source && this.session.message.source === "line") ||
        //         (address.channel.source && address.channel.source === "line"))
        // ) {
        //     return {
        //         contentType: "imagemap",
        //         content: {
        //             baseUrl: this.baseUrl,
        //             baseSize: this.baseSize,
        //             actions: this.actions,
        //             text: this.text
        //         }
        //     }
        // } else {
        //     // throw new Error("Method not implemented.");

        //     return new botbuilder.MediaCard().text("this is a image map!!").toAttachment()
        // }

    }
}

export class Sticker implements botbuilder.IIsAttachment {
    address: botbuilder.IAddress
    packageId: string;
    stickerId: string;
    // session: botbuilder.Session;
    constructor(address: botbuilder.IAddress, packageId: number, stickerId: number) {
        this.packageId = packageId.toString();
        this.stickerId = stickerId.toString();
        this.address = address;
    }
    toAttachment(): botbuilder.IAttachment {
        // throw new Error("Method not implemented.");
        // console.log(this.session.message)
        // let address: any = this.session.message.address;
        // if (this.session.message &&
        //     ((this.session.message.source && this.session.message.source === "line") ||
        //         (address.channel.source && address.channel.source === "line"))
        // ) {

        // if (this.session.message && this.session.message.source && this.session.message.source === "line") {
        return {
            contentType: "sticker",
            content: {
                packageId: this.packageId,
                stickerId: this.stickerId
            }
        }
        // } else {
        //     // throw new Error("Method not implemented.");

        //     return new botbuilder.MediaCard().text("this is a sticker!!").toAttachment()
        // }

    }
}

export class Location implements botbuilder.IIsAttachment {
    // session: botbuilder.Session;
    address: botbuilder.IAddress
    title: string;
    location_address: string;
    latitude: number;
    longitude: number;
    constructor(address: botbuilder.IAddress, title: string, address_or_desc: string, latitude: number, longitude: number) {
        this.address = address;
        this.title = title;
        this.location_address = address_or_desc;
        this.latitude = latitude;
        this.longitude = longitude;
    }
    toAttachment(): botbuilder.IAttachment {
        // let address: any = this.session.message.address;
        // if (this.session.message &&
        //     ((this.session.message.source && this.session.message.source === "line") ||
        //         (address.channel.source && address.channel.source === "line"))
        // ) {
        // if (this.session.message && this.session.message.source && this.session.message.source === "line") {
        return {
            contentType: "location",
            content: {
                title: this.title,
                address: this.location_address,
                latitude: this.latitude,
                longitude: this.longitude
            }
            // }
            // } else {
            //     // throw new Error("Method not implemented.");

            //     return new botbuilder.MediaCard().text(`this is a location!! ${this.location_address}`).toAttachment()
            // }
        }
    }
}
export class LineConnector implements botbuilder.IConnector {
    //const
    headers: any;
    endpoint: string;
    botId: string;
    hasPushApi = false;
    autoGetUserProfile = false

    //from dispatch
    replyToken: any;
    options: any;
    conversationId: any;

    conversationType: any;
    event_cache = [];

    //form botframework
    handler: any;
    timer: any;

    constructor(options: any) {
        this.options = options || {};
        this.options.channelId = options.channelId || '';
        this.options.channelSecret = options.channelSecret || '';
        this.options.channelAccessToken = options.channelAccessToken || '';
        if (this.options.verify === undefined) {
            this.options.verify = true;
        }
        if (this.options.hasPushApi !== undefined) {
            this.hasPushApi = this.options.hasPushApi;
        }
        if (this.autoGetUserProfile !== undefined) {
            this.autoGetUserProfile = this.options.autoGetUserProfile;
        }

        this.headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + this.options.channelAccessToken
        };
        this.endpoint = 'https://api.line.me/v2/bot';
        this.botId = options.channelId;
    }
    private verify(rawBody: any, signature: any) {
        const hash = crypto.createHmac('sha256', this.options.channelSecret)
            .update(rawBody, 'utf8')
            .digest('base64');
        return hash === signature;
    }
    listen() {
        console.log("listen")
        const parser = bodyParser.json({
            verify: function (req: any, res: any, buf: any, encoding: any) {
                req.rawBody = buf.toString(encoding);
            }
        });
        return (req: any, res: any) => {
            parser(req, res, () => {
                // if (this.options.verify && !this.verify(req.rawBody, req.get('X-Line-Signature'))) {
                //     return res.sendStatus(400);
                // }
                this.dispatch(req.body, res);
                return res.json({});
            });
        };
    }

    async serverlessWebhock(event: any) {
        this.dispatch(JSON.parse(event.body), null);
    }

    private addReplyToken(replyToken: any) {

        const _this = this;
        _this.replyToken = replyToken;
        // console.log("addReplyToken1", _this.replyToken, _this.event_cache)
        clearTimeout(this.timer)
        this.timer = setTimeout(() => {
            // console.log("addReplyToken2", _this.replyToken)
            if (_this.replyToken && _this.event_cache.length > 0) {
                let r = (' ' + _this.replyToken).slice(1);
                _this.replyToken = null;
                _this.reply(r, _this.event_cache);
            } else if (_this.replyToken !== null) {
                console.log("wait for 2 seconds let will make replyToken no use, clean the replytoken")
            }

            _this.replyToken = null;
            _this.event_cache = [];

        }, 2000)
    }
    private dispatch(body: any, res: any) {
        console.log("dispatch")
        const _this = this;
        if (!body || !body.events) {
            console.log("dispatch return")

            return;
        }
        body.events.forEach(async (event: any) => {
            console.log("event", event)
            if (VERIFY_TOKENS.indexOf(event.replyToken) !== -1) {
                return;
            }

            _this.addReplyToken(event.replyToken)

            let m: any = {
                timestamp: new Date(parseInt(event.timestamp)).toISOString(),
                source: "line",
                address: {
                    conversation: {},
                    channel: {},
                    user: {}
                }
            }
            switch (event.source.type) {
                case 'user':
                    m.address.conversation.name = "user";
                    m.address.conversation.id = event.source.userId;
                    m.address.channel.id = event.source.userId;
                    m.address.channelId = event.source.userId;

                    m.address.channel.source = "line";
                    m.address.user.name = "user";
                    m.address.user.id = event.source.userId;
                    _this.conversationId = event.source.userId;

                    break;
                case 'group':
                    m.address.conversation.name = "group";
                    m.address.conversation.id = event.source.groupId;
                    m.address.conversation.isGroup = true;

                    m.address.channel.id = event.source.groupId;
                    m.address.channelId = event.source.userId;

                    m.address.user.name = "group";
                    m.address.user.id = event.source.groupId;
                    _this.conversationId = event.source.groupId;
                    _this.conversationType = "group";

                    break;
                case 'room':
                    m.address.conversation.name = "room";
                    m.address.conversation.id = event.source.roomId;
                    m.address.conversation.isGroup = true;

                    m.address.channel.id = event.source.roomId;
                    m.address.channelId = event.source.userId;

                    m.address.user.name = "room";
                    m.address.user.id = event.source.roomId;
                    _this.conversationId = event.source.roomId;
                    _this.conversationType = "room";

                    break;
            }
            m.from = {
                id: event.source.userId
            }
            if (event.source.userId && _this.autoGetUserProfile) {

                try {
                    let r = await _this.getUserProfile(event.source.userId);
                    m.from = {
                        id: event.source.userId,
                        name: r.displayName,
                        pictureUrl: r.pictureUrl,
                        statusMessage: r.statusMessage
                    }
                } catch (e) {
                    console.log(e)

                }
            }

            switch (event.type) {
                case 'message':
                    m.id = event.message.id;

                    m.type = 'message'

                    const message = event.message;

                    switch (message.type) {
                        case 'text':
                            m.text = event.message.text
                            break;
                        case 'image':
                            m.attachments = [{
                                contentType: "image", contentUrl: "", name: ""
                            }];
                            break;
                        case 'video':
                            m.attachments = [{
                                contentType: "video", contentUrl: "", name: ""
                            }];
                            break;
                        case 'audio':
                            m.attachments = [{
                                contentType: "audio", contentUrl: "", name: ""
                            }];
                            break;
                        case 'location':
                            m.attachments = [{
                                "type": "location",
                                "id": event.message.id,
                                "latitude": event.message.latitude,
                                "longitude": event.message.longitude
                            }];

                            break;
                        case 'sticker':
                            m.attachments = [{
                                contentType: "sticker", contentUrl: "", name: ""
                            }];

                            break;
                        default:
                            throw new Error(`Unknown message: ${JSON.stringify(message)}`);
                            break;
                    }

                    break;
                case 'follow':
                    m.id = event.source.userId;

                    m.type = 'conversationUpdate'
                    m.text = "follow"
                    break;

                case 'unfollow':

                    m.id = event.source.userId;
                    m.type = 'conversationUpdate'
                    m.text = "unfollow"
                    break;

                case 'join':
                    m.membersAdded = [{}]
                    m.type = 'conversationUpdate'
                    m.text = "join"
                    break;

                case 'leave':
                    m.membersRemoved = true
                    m.type = 'conversationUpdate'
                    m.text = "leave"
                    break;
                case 'postback':

                    m.type = 'message'
                    let data = event.postback.data;
                    if (data === 'DATE' || data === 'TIME' || data === 'DATETIME') {
                        data = `${event.postback.params.datetime}`;
                    }
                    m.text = data
                    break;
                case 'beacon':
                    break;

                default:
                    throw new Error(`Unknown event: ${JSON.stringify(event)}`);
                    break;
            }
            // console.log("m", m)
            _this.handler([m]);

        })
    }
    onEvent(handler: any) {
        this.handler = handler;
    };
    private static createMessages(message: any) {
        // console.log(message)
        if (typeof message === 'string') {
            return [{ type: 'text', text: message }];
        }

        if (Array.isArray(message)) {
            return message.map(function (m) {
                if (typeof m === 'string') {
                    return { type: 'text', text: m };
                }
                return m;
            });
        }
        return [message];
    }
    private post(path: any, body: any) {
        console.log("post", path, body)

        // console.log(path, body)
        // let r;
        // try {
        //     r = fetch(this.endpoint + path, { method: 'POST', headers: this.headers, body: JSON.stringify(body) });
        // } catch (er) {
        //     console.log("er",er)
        // }
        return fetch(this.endpoint + path, { method: 'POST', headers: this.headers, body: JSON.stringify(body) });
    }
    private get(path: any) {
        // console.log("get", path);
        return fetch(this.endpoint + path, { method: 'GET', headers: this.headers });
    }
    private async reply(replyToken: any, message: any) {
        console.log("reply")

        let m = LineConnector.createMessages(message);
        const body = {
            replyToken: replyToken,
            messages: m
        };

        let r = await this.post('/message/reply', body).then();

        if (r.status === 400) {
            r.json().then((json: any) => { console.log(json); throw new Error(json.toString()) });

        }
        return r;
    }

    private async push(toId: any, message: any) {
        let m = LineConnector.createMessages(message);

        const body = {
            to: toId,
            messages: m
        };
        // console.log("body", body)
        // let res = await this.post('/message/push', body).then();

        let r = await this.post('/message/push', body).then();
        // let r = await res.json().then();
        if (r.status === 400) {
            r.json().then((json: any) => { console.log(json); throw new Error(json.toString()) });

        }

        return r;
    }

    async getUserProfile(userId: string) {
        let url = '/profile/' + userId;
        // return url
        let res = await this.get(url).then()
        let r = await res.json().then();
        if (r.message) {
            throw new Error(r.message)
        }
        return r;
    }

    private async getMemberIDs() {
        if (this.conversationType === undefined) {
            throw new Error("not room or group")
            return;
        }
        let url = `/${this.conversationType === "group" ? "group" : this.conversationType === "room" ? "room" : ""}/${this.conversationId}/members/ids`
        // return url
        let res = await this.get(url).then()
        // console.log(res)
        let r = await res.json().then();
        if (r.message) {
            throw new Error(r.message)
        }
        return r;
    }

    private async getMemberRrofile(userId: string) {
        if (this.conversationType === undefined) {
            throw new Error("not room or group")
            return;
        }
        let url = `/${this.conversationType === "group" ? "group" : this.conversationType === "room" ? "room" : ""}/${this.conversationId}/member/${userId}`
        // return url
        let res = await this.get(url).then()
        let r = await res.json().then();
        if (r.message) {
            throw new Error(r.message)
        }
        return r;
    }

    async leave() {
        if (this.conversationType === undefined) {
            throw new Error("not room or group")
            return;
        }
        let url = `/${this.conversationType === "group" ? "group" : this.conversationType === "room" ? "room" : ""}/${this.conversationId}/leave`

        const body = {
            replyToken: this.replyToken,
        };

        let r = await this.post(url, body).then();
        // let r = await res.json().then();
        if (r.status === 400) {
            r.json().then((json: any) => { console.log(json); throw new Error(json.toString()) });

        }
        return r;
    }


    private getRenderTemplate(event: any) {
        var _this = this;
        // console.log("getRenderTemplate", event)
        //20170825 should be there
        let getButtonTemp = (b: any) => {
            if (b.type === 'postBack') {
                return {
                    "type": "postback",
                    "label": b.title,
                    "data": b.value,
                    // "text": "OK"
                }
            } else if (b.type === 'openUrl') {
                return {
                    "type": "uri",
                    "label": b.title ? b.title : "open url",
                    "uri": b.value
                }
            } else if (b.type === 'datatimepicker') {
                // console.log("datatimepicker", b)
                let p = {
                    "type": "datetimepicker",
                    "label": b.title,
                    "data": "DATETIME",
                    "mode": "datetime",
                    "initial": new Date(new Date().getTime() - (1000 * 60 * new Date().getTimezoneOffset())).toISOString().substring(0, new Date().toISOString().length - 8),
                    "max": new Date(new Date().getTime() + (1000 * 60 * 60 * 24 * 30 * 12)).toISOString().substring(0, new Date().toISOString().length - 8),
                    "min": new Date(new Date().getTime() - (1000 * 60 * 60 * 24 * 30 * 12)).toISOString().substring(0, new Date().toISOString().length - 8),
                }
                if (b.value) {
                    let d = JSON.parse(b.value)
                    p.initial = d.initial ? d.initial : p.initial;
                    p.max = d.max ? d.max : p.max;
                    p.min = d.min ? d.min : p.min;
                }
                return p

            } else {
                return {
                    "type": "message",
                    "label": b.title,
                    "text": b.value
                }
            }
        }
        let getAltText = (s: string) => {
            return s.substring(0, 400)
        }
        // console.log("event", event)
        switch (event.type) {
            case 'message':
                if (event.text) {
                    if (event.suggestedActions && event.suggestedActions.actions && event.suggestedActions.actions.length > 0) {
                        let l = event.suggestedActions.actions.length;
                        switch (l) {
                            // case 2:
                            //     //confirm

                            //     return {
                            //         type: "template",
                            //         altText: getAltText(event.text),
                            //         template: {
                            //             type: "confirm",
                            //             // title: event.text || "",
                            //             text: `${event.text || ""}`,
                            //             actions: event.suggestedActions.actions.map(b =>
                            //                 getButtonTemp(b)
                            //             )
                            //         }
                            //     }

                            default:
                                return {
                                    type: "template",
                                    altText: getAltText(event.text),
                                    template: {
                                        type: "buttons",
                                        // title: event.text || "",
                                        text: `${event.text || ""}`,
                                        actions: event.suggestedActions.actions.map((b: any) =>
                                            getButtonTemp(b)
                                        )
                                    }
                                }


                        }
                    }

                    return {
                        type: 'text',
                        text: event.text
                    }
                } else if (event.attachments) {

                    if (event.attachmentLayout === 'carousel') {
                        //for carousel
                        //for image carousel
                        // let be_same = event.attachments.reduce((c, n) => {
                        //     return c.contentType === n.contentType
                        // })
                        var be_same = event.attachments.reduce(function (c: any, n: any) {
                            if (c.contentType === n.contentType) {
                                return c;
                            } else {
                                return false
                            }
                        });
                        if (!be_same) {
                            throw new Error("must be same attachment")
                        }
                        if (event.attachments[0].contentType === "application/vnd.microsoft.card.hero") {
                            // let be_image_carousel = event.attachments.reduce((c, n) => {
                            //     return c.content.images.length === 1 && n.content.images.length === 1 && c.content.buttons.length === 1 && n.content.buttons.length === 1
                            // })
                            var be_image_carousel = event.attachments.reduce(function (c: any, n: any) {
                                if (c === false) {
                                    return false;
                                }
                                if (c.content.images && c.content.images.length === 1 && n.content.images.length === 1 && c.content.buttons.length === 1 && n.content.buttons.length === 1) {
                                    return c;
                                } else {
                                    return false
                                }
                            });

                            if (be_image_carousel) {
                                return {
                                    "type": "template",
                                    "altText": getAltText(event.attachments[0].content.text),
                                    "template": {
                                        "type": "image_carousel",
                                        "columns": event.attachments.map((a: any) => {
                                            return {
                                                imageUrl: a.content.images[0].url,
                                                action: getButtonTemp(a.content.buttons[0])
                                            }
                                        })
                                    }
                                }
                            } else {
                                let t: any = {
                                    type: "template",
                                    altText: getAltText(event.attachments[0].content.text),
                                    template: {
                                        type: "carousel",
                                        imageAspectRatio: "rectangle",
                                        imageSize: "cover",

                                        columns: event.attachments.map((a: any) => {
                                            let c: any = {
                                                title: a.content.title || "",
                                                text: getAltText(event.attachments[0].content.text),
                                                actions: a.content.buttons.map((b: any) =>
                                                    getButtonTemp(b)
                                                )
                                            }
                                            if (a.content.images) {
                                                c.thumbnailImageUrl = a.content.images[0].url;
                                                c.imageBackgroundColor = "#FFFFFF";
                                            }
                                            return c;
                                        })

                                    }
                                }
                                return t;

                            }



                        } else {

                            throw new Error("do not suppoert this card,only support HeroCard ")
                        }





                    }

                    return event.attachments.map((a: any) => {
                        // console.log("a", a)
                        switch (a.contentType) {
                            case 'sticker':
                                return { type: 'sticker', packageId: a.content.packageId, stickerId: a.content.stickerId }
                            case `imagemap`:
                                let t: any;
                                t = {
                                    type: "imagemap",
                                    baseUrl: a.content.baseUrl,
                                    baseSize: a.content.baseSize,
                                    altText: getAltText(a.content.text),
                                    actions: a.content.actions
                                };

                                return t;
                                return {
                                    "type": "imagemap",
                                    "baseUrl": "https://www.profolio.com/sites/default/files/styles/1920x1040/public/field/image/Bikini_Girls_adx.jpg?itok=uciEvomy",
                                    "altText": "This is an imagemap",
                                    "baseSize": {
                                        "width": 1040,
                                        "height": 104
                                    },
                                    // "video": {
                                    //     "originalContentUrl": "https://example.com/video.mp4",
                                    //     "previewImageUrl": "https://www.profolio.com/sites/default/files/styles/1920x1040/public/field/image/Bikini_Girls_adx.jpg?itok=uciEvomy",
                                    //     "area": {
                                    //         "x": 0,
                                    //         "y": 0,
                                    //         "width": 1040,
                                    //         "height": 585
                                    //     },
                                    //     "externalLink": {
                                    //         "linkUri": "https://example.com/see_more.html",
                                    //         "label": "See More"
                                    //     }
                                    // },
                                    "actions": [
                                        {
                                            "type": "uri",
                                            "linkUri": "https://google.com/",
                                            "area": {
                                                "x": 0,
                                                "y": 0,
                                                "width": 1040,
                                                "height": 104
                                            }
                                        },
                                        // {
                                        //     "type": "message",
                                        //     "text": "Hello",
                                        //     "area": {
                                        //         "x": 520,
                                        //         "y": 586,
                                        //         "width": 520,
                                        //         "height": 454
                                        //     }
                                        // }
                                    ]
                                }

                            case 'location':
                                return {
                                    type: 'location',
                                    title: a.content.title,
                                    address: a.content.location_address,

                                    latitude: a.content.latitude,
                                    longitude: a.content.longitude

                                }


                            case 'application/vnd.microsoft.card.video':
                                if (a.content.image && a.content.media && a.content.media[0].url.indexOf("https") > -1 && a.content.image.url.indexOf("https") > -1) {
                                    return {
                                        "type": "video",
                                        "originalContentUrl": a.content.media[0].url,
                                        "previewImageUrl": a.content.image.url
                                    }
                                } else {
                                    return new Error("need image and media")
                                }
                            case 'application/vnd.microsoft.card.audio':
                                if (a.content.media && a.content.media[0].url.indexOf("https") > -1) {
                                    return {
                                        "type": "audio",
                                        "originalContentUrl": a.content.media[0].url,
                                        "duration": a.content.media[0].duration || 240000
                                    }
                                } else {
                                    return new Error("need image and media")
                                }
                            case 'application/vnd.microsoft.keyboard':
                                if (a.content.image && a.content.image.url.indexOf("https") > -1) {
                                    return {
                                        "type": "image",
                                        "originalContentUrl": a.content.image.url,
                                        "previewImageUrl": a.content.image.url
                                    }
                                }
                            case 'application/vnd.microsoft.card.hero':

                                if (!a.content.buttons) {
                                    return new Error("need buttons data")
                                }

                                if (a.content.images === undefined && a.content.buttons.length === 2) {
                                    //confirm

                                    return {
                                        type: "template",
                                        altText: getAltText(a.content.text),
                                        template: {
                                            type: "confirm",
                                            title: a.content.title || "",
                                            text: `${a.content.title || ""}${a.content.subtitle || ""}`,
                                            actions: a.content.buttons.map((b: any) =>
                                                getButtonTemp(b)
                                            )
                                        }
                                    }
                                } else {

                                    let t: any = {
                                        type: "template",
                                        altText: a.content.text,
                                        template: {
                                            type: "buttons",
                                            title: a.content.title || "",
                                            text: `${a.content.title || ""}${a.content.subtitle || ""}`,
                                            actions: a.content.buttons.map((b: any) =>
                                                getButtonTemp(b)
                                            )
                                        }
                                    }
                                    if (a.content.images) {
                                        t.template.thumbnailImageUrl = a.content.images[0].url;
                                        t.template.imageAspectRatio = "rectangle";
                                        t.template.imageSize = "cover";
                                        t.template.imageBackgroundColor = "#FFFFFF";
                                    }
                                    return t;

                                }

                        }
                    })


                }
        }
    }
    send(messages: botbuilder.IMessage[], done: any) {
        // let ts = [];
        const _this = this;

        messages.map((e: botbuilder.IMessage, i) => {
            // console.log("e", e)
            const address = e.address;
            if (e.type === 'endOfConversation') {
                return address;
            }

            if (_this.hasPushApi) {
                _this.conversationId = e.address.channelId;
                _this.push(_this.conversationId, _this.getRenderTemplate(e))
            } else if (_this.replyToken) {
                let t: Array<any> = _this.getRenderTemplate(e)
                // console.log(t)
                if (Array.isArray(t)) {
                    _this.event_cache = _this.event_cache.concat(<any>t)
                } else {
                    _this.event_cache.push(t)
                }
                if ((_this.event_cache.length === messages.length) || _this.event_cache.length === 5) {
                    let r = (' ' + _this.replyToken).slice(1);
                    _this.replyToken = null;

                    _this.reply(r, _this.event_cache);
                    _this.event_cache = [];
                }
            } else {
                throw new Error(`no way to send message: ` + e);
            }
        })
    }
    startConversation(address: any, callback: any) {
        console.log(address);
        console.log(callback);
    }

}
