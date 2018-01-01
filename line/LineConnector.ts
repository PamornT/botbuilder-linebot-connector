
const fetch = require('node-fetch');
const crypto = require('crypto');
var url = require('url');

import bodyParser = require("body-parser");
import * as botbuilder from "botbuilder";

export class Sticker implements botbuilder.IIsAttachment {
    packageId;
    stickerId;
    session;
    constructor(session: botbuilder.Session, packageId: number, stickerId: number) {
        this.packageId = packageId.toString();
        this.stickerId = stickerId.toString();
        this.session = session;
    }
    toAttachment(): botbuilder.IAttachment {
        // throw new Error("Method not implemented.");
        // console.log(this.session.message)
        if (this.session.message && this.session.message.source && this.session.message.source === "line") {
            return {
                contentType: "sticker",
                content: {
                    packageId: this.packageId,
                    stickerId: this.stickerId
                }
            }
        } else {
            // throw new Error("Method not implemented.");

            return new botbuilder.MediaCard().text("this is a sticker!!").toAttachment()
        }

    }
}

export class Location implements botbuilder.IIsAttachment {
    session;
    title;
    address;
    latitude;
    longitude;
    constructor(session: botbuilder.Session, title: string, address_or_desc: string, latitude: number, longitude: number) {
        this.session = session;
        this.title = title;
        this.address = address_or_desc;
        this.latitude = latitude;
        this.longitude = longitude;
    }
    toAttachment(): botbuilder.IAttachment {
        if (this.session.message && this.session.message.source && this.session.message.source === "line") {
            return {
                contentType: "location",
                content: {
                    title: this.title,
                    address: this.address,
                    latitude: this.latitude,
                    longitude: this.longitude
                }
            }
        } else {
            // throw new Error("Method not implemented.");

            return new botbuilder.MediaCard().text(`this is a location!! ${this.address}`).toAttachment()
        }
    }
}

export class LineConnector implements botbuilder.IConnector {
    //const
    headers;
    endpoint;
    botId;
    hasPushApi = false;

    //from dispatch
    replyToken;
    options;
    conversationId;
    event_cache = [];

    //form botframework
    handler;



    constructor(options) {
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

        this.headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + this.options.channelAccessToken
        };
        this.endpoint = 'https://api.line.me/v2/bot';
        this.botId = options.channelId;
    }
    verify(rawBody, signature) {
        const hash = crypto.createHmac('sha256', this.options.channelSecret)
            .update(rawBody, 'utf8')
            .digest('base64');
        return hash === signature;
    }
    listen() {
        // console.log("listen")
        const parser = bodyParser.json({
            verify: function (req: any, res, buf, encoding) {
                req.rawBody = buf.toString(encoding);
            }
        });
        return (req, res) => {

            parser(req, res, () => {

                if (this.options.verify && !this.verify(req.rawBody, req.get('X-Line-Signature'))) {
                    return res.sendStatus(400);
                }
                this.dispatch(req.body, res);
                return res.json({});
            });
        };
    }

    addReplyToken(replyToken) {

        const _this = this;
        _this.replyToken = replyToken;
        console.log("addReplyToken1", _this.replyToken, _this.event_cache)

        setTimeout(() => {
            console.log("addReplyToken2", _this.replyToken)
            if (_this.replyToken && _this.event_cache.length > 0) {
                _this.reply(_this.replyToken, _this.event_cache);
            }
            _this.replyToken = null;
            _this.event_cache = [];

        }, 1000)
    }
    dispatch(body, res) {
        // console.log("dispatch")
        const _this = this;
        if (!body || !body.events) {
            return;
        }
        body.events.forEach(event => {
            // console.log("event", event)
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
                    _this.conversationId = event.source.userId;


                    m.address.channel.id = event.source.userId;
                    m.address.user.name = "user";
                    m.address.user.id = event.source.userId;


                    m.from = {
                        id: event.source.userId,
                        name: "user"
                    }
                    break;
                case 'group':
                    m.address.conversation.name = "group";
                    m.address.conversation.id = event.source.groupId;
                    _this.conversationId = event.source.groupId;

                    m.address.channel.id = event.source.groupId;

                    break;
                case 'room':
                    m.address.conversation.name = "room";
                    m.address.conversation.id = event.source.roomId;
                    _this.conversationId = event.source.roomId;

                    m.address.channel.id = event.source.roomId;

                    break;
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

                    break;

                case 'unfollow':

                    m.id = event.source.userId;
                    m.type = 'conversationUpdate'

                    break;

                case 'join':
                    m.type = 'conversationUpdate'

                    break;

                case 'leave':
                    m.type = 'conversationUpdate'
                    break;
                case 'postback':

                    let data = event.postback.data;
                    if (data === 'DATE' || data === 'TIME' || data === 'DATETIME') {
                        data += `(${JSON.stringify(event.postback.params)})`;
                    }

                    break;
                case 'beacon':
                    break;

                default:
                    throw new Error(`Unknown event: ${JSON.stringify(event)}`);
                    break;
            }
            console.log("m", m)
            _this.handler([m]);

        })
    }
    onEvent(handler) {
        this.handler = handler;
    };
    static createMessages(message) {
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
    post(path, body) {
        // console.log(path, body)
        let r;
        try {
            r = fetch(this.endpoint + path, { method: 'POST', headers: this.headers, body: JSON.stringify(body) });
        } catch (er) {
            console.log(er)
        }
        return r
    }
    reply(replyToken, message) {

        let m = LineConnector.createMessages(message);
        const body = {
            replyToken: replyToken,
            messages: m
        };
        // console.log("reply", replyToken, body)

        this.post('/message/reply', body).then(function (res) {
            res.json().then(r => {
                console.log("r", r)
                if (r.message) {
                    throw new Error(r.message)
                }

            })
            return res.json();
        });
    }

    push(toId, message) {
        let m = LineConnector.createMessages(message);

        const body = {
            to: toId,
            messages: m
        };
        // console.log("body", body)
        this.post('/message/push', body).then(function (res) {
            res.json().then(r => {
                console.log("r", r)
                if (r.message) {
                    throw new Error(r.message)
                }

            })
            return res.json();
        });
    }

    getRenderTemplate(event) {
        var _this = this;
        // console.log("getRenderTemplate", event)
        //20170825 should be there
        // console.log("event", event)
        switch (event.type) {
            case 'message':
                if (event.text) {
                    return {
                        type: 'text',
                        text: event.text
                    }
                } else if (event.attachments) {
                    let getButtonTemp = b => {
                        if (b.type === 'postBack') {
                            return {
                                "type": "postback",
                                "label": b.title,
                                "data": b.value,
                                "text": "OK"
                            }
                        } else if (b.type === 'openUrl') {
                            return {
                                "type": "uri",
                                "label": b.title ? b.title : "open url",
                                "uri": b.value
                            }
                        } else if (b.type === 'datatimepicker') {
                            // console.log("datatimepicker")
                            return {
                                "type": "datetimepicker",
                                "label": b.title,
                                "data": "storeId=12345",
                                "mode": "datetime",
                                "initial": new Date(new Date().getTime() - (1000 * 60 * new Date().getTimezoneOffset())).toISOString().substring(0, new Date().toISOString().length - 8),
                                "max": new Date(new Date().getTime() + (1000 * 60 * 60 * 24 * 30 * 12)).toISOString().substring(0, new Date().toISOString().length - 8),
                                "min": new Date(new Date().getTime() - (1000 * 60 * 60 * 24 * 30 * 12)).toISOString().substring(0, new Date().toISOString().length - 8),
                            }
                        } else {
                            return {
                                "type": "message",
                                "label": b.title,
                                "text": b.value
                            }
                        }
                    }
                    let getAltText = s => {
                        return s.substring(0, 400)
                    }
                    if (event.attachmentLayout === 'carousel') {
                        //for carousel
                        //for image carousel
                        let be_same = event.attachments.reduce((c, n) => {
                            return c.contentType === n.contentType
                        })
                        if (!be_same) {
                            throw new Error("must be same attachment")
                        }
                        if (event.attachments[0].contentType === "application/vnd.microsoft.card.hero") {
                            let be_image_carousel = event.attachments.reduce((c, n) => {
                                return c.content.images.length === 1 && n.content.images.length === 1 && c.content.buttons.length === 1 && n.content.buttons.length === 1
                            })

                            if (be_image_carousel) {
                                return {
                                    "type": "template",
                                    "altText": getAltText(event.attachments[0].content.text),
                                    "template": {
                                        "type": "image_carousel",
                                        "columns": event.attachments.map(a => {
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

                                        columns: event.attachments.map(a => {
                                            let c: any = {
                                                title: a.content.title || "",
                                                text: `${a.content.title || ""}${a.content.subtitle || ""}`,
                                                actions: a.content.buttons.map(b =>
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

                    return event.attachments.map(a => {
                        console.log("a", a)
                        switch (a.contentType) {
                            case 'sticker':
                                return { type: 'sticker', packageId: a.content.packageId, stickerId: a.content.stickerId }

                            case 'location':
                                return {
                                    type: 'location',
                                    title: a.content.title,
                                    address: a.content.address,

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
                                        "duration": 240000
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
                                            actions: a.content.buttons.map(b =>
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
                                            actions: a.content.buttons.map(b =>
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
    send(messages, done) {
        // let ts = [];
        const _this = this;

        messages.map(e => {
            console.log("e", e)
            if (_this.hasPushApi) {
                _this.push(_this.conversationId, _this.getRenderTemplate(e))
            } else if (_this.replyToken) {
                let t = _this.getRenderTemplate(e)
                // console.log(t)
                if (Array.isArray(t)) {
                    _this.event_cache = _this.event_cache.concat(t)
                } else {
                    _this.event_cache.push(t)
                }
                if (_this.event_cache.length === 5) {
                    _this.reply(_this.replyToken, _this.event_cache);
                    _this.replyToken = null;
                    _this.event_cache = [];
                }
            } else {
                throw new Error(`no way to send message: ` + e);
            }
        })
    }
    startConversation(address, callback) {
        console.log(address);
        console.log(callback);
    }

}