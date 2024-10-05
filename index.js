const express = require('express');
const express_ws = require('express-ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
express_ws(app, server)

const connections = [];
const currentTemplate = [];

app.get('/', (req, res) => {
    res.send(JSON.stringify({hello: "world"}));
    connections[0].send(
        JSON.stringify(
            {
                msg: "ENROLL",
                payload: {
                    id: 3
                }
            }
        )
    )
    res.end();
  });

app.get('/config', (req, res) => {
    res.send(JSON.stringify({hello: "world"}));
    connections[0].send(
        JSON.stringify(
            {
                msg: "TEMPLATE",
                payload: {
                    id: 3,
                    template: currentTemplate
                }
            }
        )
    )
    res.end();
  });


app.get("/enroll", async (req, res)  => {
    
});


app.ws('/', (_ws) => {
    console.log("Got a websocket connection")
    connections.push(_ws);

    let timeout;
    let heartbeatCounter = 0;

    const heartbeat = () => 
    {
        console.log("sending heartbeat");
        _ws.ping(Buffer.from('abcdefgh'), (err, duration, payload) => 
        {
            if (err) 
            {
                console.log(err);
            }
        });
        timeout = setTimeout(()=>{
            console.log("timeout")
            ++heartbeatCounter;
            if (heartbeatCounter > 2)
            {
                console.log("closing connection");
                _ws.close(1000, "timeout");
            }
        }, 1000)
    }

    const interval = setInterval(heartbeat, 3000);
    heartbeat();

    _ws.on("message", async (message) => {
      const data = JSON.parse(message);
      console.log("Received message : ", data);

      if(data['msg'] == "ID")
      {
        
      }
      else if (data['msg'] == "AUTH")
      {

      }

    });

    _ws.on('pong', async () => {
        console.log("recieved pong");
        clearTimeout(timeout);
        heartbeatCounter = 0;
    })

    _ws.on("close", function() {
        console.log('The connection was closed!');
        clearInterval(interval);
        clearTimeout(timeout);
        connections.pop();
    });

  });


  server.listen(3000)
  console.log("Express HTTP and Websocket server listening on 3000");

