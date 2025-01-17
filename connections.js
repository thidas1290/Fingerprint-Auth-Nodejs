class Connections
{
    constructor(connectionsEmitter)
    {
        this.connections = [];
        this.connectionsEmitter = connectionsEmitter;
    }

    addConnection(connection)
    {
        this.connections.push(connection);
        console.log(`Connection added for ID: ${connection.getId()}`);
        this.connectionsEmitter.emit('change');
        this.logConnections();

    }

    removeConnection(connection)
    {
        this.connections = this.connections.filter(c => c.getId() !== connection.getId());
        console.log(`Connection removed for ID: ${connection.getId()}`);
        this.connectionsEmitter.emit('change');
        this.logConnections();
    }

    logConnections()
    {
        this.connections.forEach(c => console.log(c.getId()));
    }
}

module.exports = Connections;   