const express = require('express');
const express_ws = require('express-ws');
const http = require('http');
const eventEmitter = require('events'); 
const { v4: uuidv4 } = require('uuid');

const Client = require('./client');
const Connections = require('./connections');

const app = express();
app.use(express.json());
const server = http.createServer(app);
express_ws(app, server)

const webHookEndpoint = "http://localhost:3000/webhook";

const connectionsEvent = new eventEmitter();
const clientConnections = new Connections(connectionsEvent);
let sseClients = [];

connectionsEvent.on('change', () => {
    const deviceList = clientConnections.connections.filter(c => c.getEventId() === 0).map(c => c.getId());
    sseClients.forEach((client) => { 
        if(deviceList.length > 0) client.res.write(`data: ${JSON.stringify(...deviceList)}\n\n`);
        else {
            client.res.write(`data: ${JSON.stringify("[]")}\n\n`);
        }
    });
});


app.get('/devices', (req, res) =>{
    console.log("GET /devices");
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sseClient = {
        id: uuidv4(),
        res
    };
    sseClients.push(sseClient);
    connectionsEvent.emit('change');

    res.on('close', () => {
        console.log('sse client dropped me');
        sseClients = sseClients.filter(c => c.id !== sseClient.id);
        res.end();
    });
});

app.post('/enroll/:eventId/:device/:id', (req, res) => {
    console.log("POST /enroll");
    const eventId = req.params.eventId;
    const deviceId = req.params.device;
    const userId = req.params.id;
    console.log("device: ", deviceId);

    const targetClient = clientConnections.connections.find(c => c.getId() === deviceId);
    if (targetClient && targetClient.getEventId() === 0)
    {
        targetClient.setEventId(eventId);
        targetClient.ws.send(
            JSON.stringify(
                {
                    msg: "ENROLL",
                    payload: {
                        id: userId
                    }
                }
            )
        )
        // targetClient.setEnrollTimeout(20000);
        res.status(200).end();

    }
    else 
    {
        console.log("Device not found");
        res.status(404).end();
    }
  });

app.post('/config/:eventId/:device/:id', (req, res) => {
    console.log("POST /config");
    const eventId = req.params.eventId;
    const deviceId = req.params.device;
    const userId = req.params.id;
    const template_ = req.body.template;

    const targetClient = clientConnections.connections.find(c => c.getId() === deviceId);
    if(targetClient && targetClient.getEventId() === 0)
    {
        targetClient.setEventId(eventId);
        targetClient.setResponse(res);
        targetClient.ws.send(
            JSON.stringify(
                {
                    msg: "TEMPLATE",
                    payload: {
                        id: userId,
                        template: template_
                    }
                }
            )
        )
    }
    else
    {
        console.log("Device not found");
        res.status(404).end();
    }
    
  });


app.post("/delete/:eventId/:device/:id", async (req, res)  => {
    console.log("POST /delete");
    const eventId = req.params.eventId;
    const deviceId = req.params.device;
    const userId = req.params.id;
    
    const targetClient = clientConnections.connections.find(c => c.getId() === deviceId);
    if (targetClient && targetClient.getEventId() === 0)
    {
        targetClient.setEventId(eventId);
        targetClient.setResponse(res);
        targetClient.ws.send(
            JSON.stringify(
                {
                    msg: "DELETE",
                    payload: {
                        id: userId
                    }
                }
            )
        )
    }
    else
    {
        console.log("Device not found");
        res.status(404).end();
    }
});

app.post("/cancelEnroll/:eventId/:device", async (req, res) => {
    console.log("POST /cancelEnroll");
    const eventId = req.params.eventId;
    const deviceId = req.params.device;

    const targetClient = clientConnections.connections.find(c => c.getId() === deviceId);
    
});

app.ws('/', (_ws, req) => {
    console.log("Got a websocket connection")
    const ip = req.socket.remoteAddress;
    console.log(" from IP:", ip);

    const client = new Client(_ws, ip, connectionsEvent, () => {
        clientConnections.removeConnection(client);
    });

    _ws.on("message", async (message) => {
      const data = JSON.parse(message);
      console.log("Received message : ", data);
      console.log('from client', client.ip);

      if(data['msg'] == "ERROR")
      {

      }
      else if (data['msg'] == "REGISTER")
      {
        client.setId(data['payload']);
        clientConnections.addConnection(client);
      }
      else if (data['msg'] == "STATUS")
      {

      }
      else if (data['msg'] == "ENROLL_FINGERPRINT")
      {
        client.clearEnrollTimeout();
        fetch(webHookEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventId: client.getEventId(),
                id: data['payload']['id'],
                template: data['payload']
            })
        })
        client.setEventId(0);
      }
      else if (data['msg'] == "UPDATE_COMPLETE")
      {
        client.onResponse();
      }
      else if (data['msg'] == "DELETE_COMPLETE")
      {
        client.onResponse();
      }
      else if (data['msg'] == "AUTH")
      {
        fetch(webHookEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // eventId: client.getEventId(),
                id: data['payload']['id'],
                template: data['payload']
            })
        })
        client.setEventId(0);
      }

    });

    _ws.on('pong', async () => {
        // console.log("recieved pong");
        client.resetHeartbeat();
    })

    _ws.on("close", function() {
        console.log('The connection was closed! _ws.on("close")');
        // clearInterval(interval);
        // clearTimeout(timeout);
        client.close();
    });

  });


  server.listen(3000)
  console.log("Express HTTP and Websocket server listening on 3000");

