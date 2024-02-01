const https = require('https');

exports.handler = async (event, context) => {
 const url = 'https://yoursitehere.onrender.com';

 return new Promise((resolve, reject) => {
   const req = https.get(url, (res) => {
     if (res.statusCode === 200) {
       resolve({
         statusCode: 200,
         body: 'Server pinged successfully',
       });
     } else {
       reject(
         new Error(`Server ping failed with status code: ${res.statusCode}`)
       );
     }
   });

   req.on('error', (error) => {
     reject(error);
   });

   req.end();
 });
};


const App = require('./lib/app')
const ServerRegistration = require('./lib/servers')

const logger = require('./lib/logger')

const config = require('./config')
const servers = require('./servers')

const app = new App()

servers.forEach((server, serverId) => {
  // Assign a generated color for each servers.json entry if not manually defined
  // These will be passed to the frontend for use in rendering
  if (!server.color) {
    let hash = 0
    for (let i = server.name.length - 1; i >= 0; i--) {
      hash = server.name.charCodeAt(i) + ((hash << 5) - hash)
    }

    const color = Math.floor(Math.abs((Math.sin(hash) * 10000) % 1 * 16777216)).toString(16)
    server.color = '#' + Array(6 - color.length + 1).join('0') + color
  }

  // Init a ServerRegistration instance of each entry in servers.json
  app.serverRegistrations.push(new ServerRegistration(app, serverId, server))
})

if (!config.serverGraphDuration) {
  logger.log('warn', '"serverGraphDuration" is not defined in config.json - defaulting to 3 minutes!')
  config.serverGraphDuration = 3 * 60 * 10000
}

if (!config.logToDatabase) {
  logger.log('warn', 'Database logging is not enabled. You can enable it by setting "logToDatabase" to true in config.json. This requires sqlite3 to be installed.')

  app.handleReady()
} else {
  app.loadDatabase(() => {
    app.handleReady()
  })
}
