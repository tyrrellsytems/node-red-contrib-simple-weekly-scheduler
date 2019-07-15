# node-red-contrib-simple-weekly-scheduler

A collection of nodes to do basic scheduling.

## Simple Scheduler
A node to schedule a weeks worth of events. Multiple events can
be scheduled Sun-Sat at a courseness of 15mins (e.g. and event can 
start at 10:00, 10:15, 10:30 or 11:00 and is a multiple of 15min 
in duration)

Events are scheduled by dragging out periods of time on a calendar
style interface

The node will emit messages at the start and end of each event with
a configurable payload for both messages. If the node has a message 
in its input, the node will be fired to get the current payload.

Messages include an `event` object that includes the start and end 
times

```
{
  "topic": "some/topic",
  "event": {
    "start": "09:00:00 GMT+0100 (BST)",
    "end": "09:15:00 GMT+0100 (BST)"
  },
  "payload": "end",
}
```

The node can take a URL to pull a updated version of the calendar from.
This URL is checked every 10 minutes and it replaces any events 
configured in the UI. The URL should return a JSON object similar to 
the following. The week in this object should start on Sunday 26th May 
2009 in order to map to the same time slots as those in the UI.

```
[
  {
    "end": "2009-04-26T08:30:00.000Z",
    "id": 0,
    "start": "2009-04-26T06:15:00.000Z",
    "title": ""
  },
  {
    "end": "2009-04-28T08:00:00.000Z",
    "id": 1,
    "start": "2009-04-28T06:15:00.000Z",
    "title": ""
  },
  {
    "end": "2009-04-29T08:15:00.000Z",
    "id": 2,
    "start": "2009-04-29T07:15:00.000Z",
    "title": ""
  },
  {
    "end": "2009-04-30T06:15:00.000Z",
    "id": 3,
    "start": "2009-04-30T05:00:00.000Z",
    "title": ""
  },
  {
    "end": "2009-05-01T07:45:00.000Z",
    "id": 4,
    "start": "2009-05-01T06:00:00.000Z",
    "title": ""
  }
]
```

## Simple Schedule Filter

This node filters messages based on timeslots over a week. The 
interface is the same as the Simple Schduler node but it will 
pass messages though to the first output if message arrives inside 
a marked zone and output to the second if it is outside.
