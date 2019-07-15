/**
 * Copyright 2016 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    var path = require('path');
    var req = require('request');

    var timePlanner = function(n) {
        RED.nodes.createNode(this,n);
        this.events = JSON.parse(n.events);
        this.central = n.central;
        this.topic = n.topic;
        this.startPayload = n.startPayload;
        this.startPayloadType = n.startPayloadType;
        this.endPayload = n.endPayload;
        this.endPayloadType = n.endPayloadType;
        var node = this;

        function checkCentral() {
            if (node.central) {
                req(node.central, function(err, response, body) {
                    if (!err && response.statusCode === 200) {
                        try { node.events = JSON.parse(body); }
                        catch (error) { node.log(error); }
                    }
                    else { node.log(err, response.statusCode); }
                });
            }
        }

        function firstTime() {
            var now = new Date();
            var day = now.getUTCDay();
            var hour = now.getUTCHours();
            var mins = now.getUTCMinutes();
            // console.log("firstTime now: " + now.toISOString());
            // console.log("firstTime day: " + day);
            // console.log("firstTime hour: " + hour);
            // console.log("firstTime min: " + mins);
            var found = false;
            for (var i=0; i< node.events.length; i++) {
                var evtStart = new Date();
                evtStart.setTime(Date.parse(node.events[i].start));
                // console.log("firstTime evtStart: " + evtStart.toISOString());
                // console.log("firstTime evtStart day: " + evtStart.getUTCDay());
                // console.log("firstTime evtStart hour: " + evtStart.getUTCHours());
                // console.log("firstTime evtStart min: " + evtStart.getUTCMinutes());
                var evtEnd = new Date();
                evtEnd.setTime(Date.parse(node.events[i].end));

                if (evtStart.getUTCDay() === day) {
                    //same day
                    evtStart.setFullYear(now.getFullYear(), now.getUTCMonth(), now.getUTCDate());
                    evtEnd.setFullYear(now.getFullYear(), now.getUTCMonth(), now.getUTCDate());
                    if (hour >= evtStart.getUTCHours()) {
                        //after or same start hour
                        if (hour === evtStart.getUTCHours) {
                            if (mins >= evtStart.getUTCMinutes()) {
                                //same hour and same or after start mins
                                if (hour <= evtEnd.getUTCHours()) {
                                    //before or equal to end hour
                                    if (hour < evtEnd.getUTCHours) {
                                        //in event
                                        sendStartMessage(evtStart,evtEnd);
                                        found = true;
                                        break;
                                    }
                                    else if (hour === evtEnd.getUTCHours()) {
                                        if (mins <= evtEnd.getUTCMinutes()) {
                                            //in event
                                            sendStartMessage(evtStart, evtEnd);
                                            found = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            //after start
                            if (hour <= evtEnd.getUTCHours()) {
                                //before or same to end hour
                                if (hour === evtEnd.getUTCHours()) {
                                    //same hour as end
                                    if (mins <= evtEnd.getUTCMinutes()) {
                                        //in event
                                        sendStartMessage(evtStart,evtEnd);
                                        found = true;
                                        break;
                                    }
                                }
                                else if (hour < evtEnd.getUTCHours()) {
                                    //in event
                                    sendStartMessage(evtStart,evtEnd);
                                    found = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            if (!found) { sendEndMessage(); }
        }

        function sendStartMessage(evtStart,evtEnd) {
            // console.log("sendStartMessage");
            var now = new Date();
            // evtStart.setFullYear(now.getFullYear(),now.getUTCMonth(), now.getUTCDate());
            // evtEnd.setFullYear(now.getFullYear(),now.getUTCMonth(), now.getUTCDate());
            if (node.startPayloadType !== "nul") {
                var msg = {
                    topic: node.topic,
                    event: {
                        start:evtStart.toTimeString(),
                        end: evtEnd.toTimeString()
                    },
                    payload: RED.util.evaluateNodeProperty(node.startPayload, node.startPayloadType, node, msg)
                };
                setTimeout(function() {
                    node.send(msg);
                }, 500);
            }
        }

        function sendEndMessage() {
            // console.log("sendEndMessage");
            if (node.endPayloadType !== "nul") {
                var msg = {
                    topic: node.topic,
                    payload: RED.util.evaluateNodeProperty(node.endPayload, node.endPayloadType, node,msg)
                }
                setTimeout(function() {
                    node.send(msg);
                }, 500);
            }
        }

        firstTime();

        function checkTime() {
            var now = new Date();
            var day = now.getUTCDay();
            var hour = now.getUTCHours();
            var mins = now.getUTCMinutes();
            for (var i=0; i< node.events.length; i++) {
                var evtStart = new Date();
                evtStart.setTime(Date.parse(node.events[i].start));
                var evtEnd = new Date();
                evtEnd.setTime(Date.parse(node.events[i].end));

                if (evtStart.getUTCDay() === day) { //same day of week
                    evtStart.setFullYear(now.getFullYear(), now.getUTCMonth(), now.getUTCDate());
                    evtEnd.setFullYear(now.getFullYear(), now.getUTCMonth(), now.getUTCDate());

                    var msg = {
                        topic: node.topic,
                        event: {
                            start: evtStart.toTimeString(),
                            end: evtEnd.toTimeString()
                        }
                    };
                    if (hour === evtStart.getUTCHours() && mins === evtStart.getUTCMinutes()) {
                        console.log("start");
                        if (node.startPayloadType !== "nul") {
                            msg.payload = RED.util.evaluateNodeProperty(node.startPayload, node.startPayloadType, node, msg);
                            node.send(msg);
                        }
                    }
                    if (hour === evtEnd.getUTCHours() && mins === evtEnd.getUTCMinutes()) {
                        console.log("end");
                        if (node.endPayloadType !== "nul") {
                            msg.payload = RED.util.evaluateNodeProperty(node.endPayload, node.endPayloadType, node,msg);
                            node.send(msg);
                        }
                    }
                }
            }
        }

        node.centralInterval = setInterval(function() { checkCentral(); }, 600000); //once every 10mins
        node.interval = setInterval(function() { checkTime(); }, 60000); //once a min
        //checkTime();

	node.on('input', function(msg){
            firstTime();
        });

        node.on('close', function() {
            clearInterval(node.centralInterval);
            clearInterval(node.interval);
        });
    }
    RED.nodes.registerType("time-planner",timePlanner);

    RED.httpAdmin.get('/time-planner/js/*', function(req,res) {
        // var filename = path.join(__dirname , 'static', req.params[0]);
        // res.sendfile(filename);
        var options = {
            root: __dirname + '/static/',
            dotfiles: 'deny'
        };
        res.sendFile(req.params[0], options);
    });
};
