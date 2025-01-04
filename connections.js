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

    }

    removeConnection(connection)
    {
        this.connections = this.connections.filter(c => c.getId() !== connection.getId());
        console.log(`Connection removed for ID: ${connection.getId()}`);
        this.connectionsEmitter.emit('change');
    }

    get connections()
    {
        return this.connections;
    }
}

module.exports = Connections;   