const express = require('express');
const express_ws = require('express-ws');
const http = require('http');
const eventEmitter = require('events'); 
import { v4 as uuidv4 } from 'uuid';

const Client = require('./client');
const Connections = require('./connections');

const app = express();
const server = http.createServer(app);
express_ws(app, server)

const connectionsEvent = new eventEmitter();
const connections = new Connections(connectionsEvent);
const sseClients = [];

connectionsEvent.on('change', () => {
    const deviceList = connections.connections.map(c => c.getId());
    sseClients.forEach((client) => {
        client.res.write(`data: ${JSON.stringify(...deviceList)}\n\n`);
    });
});


app.get('/devices', (req, res) =>{
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sseClient = {
        id: uuidv4(),
        res
    };
    sseClients.push(sseClient);

    req.on('close', () => {
        console.log('client dropped me');
        sseClients = sseClients.filter(c => c.id !== sseClient.id);
        res.end();
    });
});

app.post('/enroll/:device/:id', (req, res) => {
    const device = req.params.device;
    const userId = req.params.id;

  });

app.post('/config/:device/:id', (req, res) => {
    const userId = req.params.id;
    connections[0].send(
        JSON.stringify(
            {
                msg: "TEMPLATE",
                payload: {
                    id: 3,
                    template: {}
                }
            }
        )
    )
    res.end();
  });


app.post("/delete/:device/:id", async (req, res)  => {
    await req.JSON()
});


app.ws('/', (_ws, req) => {
    console.log("Got a websocket connection")
    const ip = req.socket.remoteAddress;
    console.log(" from IP:", ip);

    const client = new Client(_ws, ip, () => {
        connections.removeConnection(client);
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
        connections.addConnection(client);
      }
      else if (data['msg'] == "STATUS")
      {

      }
      else if (data['msg'] == "ENROLL_FINGERPRINT")
      {

      }
      else if (data['msg'] == "UPDATE_COMPLETE")
      {
        
      }
      else if (data['msg'] == "DELETE_COMPLETE")
      {

      }

    });

    _ws.on('pong', async () => {
        console.log("recieved pong");
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

