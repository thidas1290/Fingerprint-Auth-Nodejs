class Client
{
    constructor(ws, ip, connectionsEmitter, close)
    {
        this.ws = ws;
        this.ip = ip;
        this.onClose = close;
        this.heartbeatCounter = 0;
        this.timeout = null;
        this.connectionsEmitter = connectionsEmitter;
        this.heartbeatTimer = setInterval(this.heartbeat.bind(this), 3000);
        this.heartbeat();
        this.eventId = 0;
        this.enrollTimeout = null;
        this.responseTimeout = null;
        this.response = null;
    }

    setId(id)
    {
        this.id = id;
    }

    getId()
    {
        return this.id;
    }

    heartbeat() 
    {
        // console.log("sending heartbeat");
        this.ws.ping(Buffer.from('abcdefgh'), (err) => {
            if (err) {
                console.log(err);
            }
        });
        this.timeout = setTimeout(() => {
            console.log("timeout");
            this.heartbeatCounter++;
            if (this.heartbeatCounter > 2) {
                console.log("closing connection");
                this.ws.close(1000, "timeout");
                this.onClose();
                clearInterval(this.heartbeatTimer);
                clearTimeout(this.timeout);
                if(this.enrollTimeout)
                {
                    clearTimeout(this.enrollTimeout);
                }
            }
        }, 1000);
    }

    resetHeartbeat() {
        clearTimeout(this.timeout);
        this.heartbeatCounter = 0;
    }

    close() {
        console.log(`Connection closed for ID: ${this.id}`);
        clearInterval(this.heartbeatTimer);
        clearTimeout(this.timeout);
    }

    setEventId(id)
    {
        this.eventId = id;
        this.connectionsEmitter.emit('change');
    }

    getEventId()
    {
        return this.eventId;
    }

    clearEnroll()
    {
        console.log("Clearing enroll");
        this.ws.send(
            JSON.stringify({
                msg: "CANCEL_ENROLL",
                payload: {}
            })
        );
        this.setEventId(0);
    }

    setEnrollTimeout(timeout_)
    {
        console.log("Setting enroll timeout");
        this.enrollTimeout = setTimeout(() => {
            console.log("Enroll timeout");
            this.clearEnroll();
        }, timeout_);
    }

    clearEnrollTimeout()
    {
        console.log("Clearing enroll timeout");
        clearTimeout(this.enrollTimeout);
    }

    setResponse(response)
    {
        this.response = response;
        this.responseTimeout = setTimeout(() => {
            console.log("Response timeout");
            response.status(500).send("Response timeout").end();
            this.setEventId(0);
        }, 5000);
    }

    onResponse()
    {
        clearTimeout(this.responseTimeout);
        this.response.status(200).end();
        this.response = null;
        this.setEventId(0);
    }

}

module.exports = Client;