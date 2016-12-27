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

	var timeFilter = function(n) {
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
				req(node.central, function(err, respose, body){
					if (!err && response.statusCode == 200) {
						try{
							node.events = JSON.parse(body);
						} catch (error) {
							//problem with the events returned
							node.log(error);
						}
					} else {
						node.log(err, response.statusCode);
					}
				});
			}
		}

		node.on('input', function(msg){
			var now = new Date();
			var day = now.getDay();
			var hour = now.getHours();
			var mins = now.getMinutes();
			for (var i=0; i< node.events.length; i++) {
				var evtStart = new Date();
				evtStart.setTime(Date.parse(node.events[i].start));
				var evtEnd =  new Date();
				evtEnd.setTime(Date.parse(node.events[i].end));

				// console.log("---------");
				// console.log("Now: ", now);
				// console.log("Now hour: ", hour);
				// console.log("Now mins: ", mins);
				// console.log("Start: ",evtStart);
				// console.log("Start hour: ",evtStart.getUTCHours());
				// console.log("Start mins: ",evtStart.getUTCMinutes());
				// console.log("End: ",evtEnd);
				// console.log("evtStart.getDay(): ",evtStart.getDay());
				// console.log("day: ",day);

				if (evtStart.getDay() === day) { //same day of week
					evtStart.setFullYear(now.getFullYear(),now.getMonth(), now.getDate());
					evtEnd.setFullYear(now.getFullYear(),now.getMonth(), now.getDate());

					var start = ((evtStart.getHours() * 60) + evtStart.getMinutes());
					var end = ((evtEnd.getHours() * 60) + evtEnd.getMinutes());
					var test = ((hour * 60) + mins);

					// console.log("start: ", start);
					// console.log("end: ", end);
					// console.log("test: ", test);

					if (test >= start &&  test <= end) {
						node.send([[msg],[]]);
					} else {
						node.send([[],msg]);
					}
				} else {
					node.send([[],msg]);
				}
			}

		});

		node.centralInterval = setInterval(checkCentral,600000); //once every 10mins


		node.on('close', function(){
			clearInterval(node.centralInterval);
		});

	};
	RED.nodes.registerType("time-filter",timeFilter);

};