class Client
{
    constructor(ws, ip, close)
    {
        this.ws = ws;
        this.ip = ip;
        this.onClose = close;
        this.heartbeatCounter = 0;
        this.timeout = null;
        this.interval = setInterval(this.heartbeat.bind(this), 3000);
        this.heartbeat();
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
        console.log("sending heartbeat");
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
                clearInterval(this.interval);
                clearTimeout(this.timeout);
            }
        }, 1000);
    }

    resetHeartbeat() {
        clearTimeout(this.timeout);
        this.heartbeatCounter = 0;
    }

    close() {
        console.log(`Connection closed for ID: ${this.id}`);
        clearInterval(this.interval);
        clearTimeout(this.timeout);
    }

}

module.exports = Client;