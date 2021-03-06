var DefaultSetting = {};

DefaultSetting.getDefaultPushClient = (pushId, platform) => {

  let port = require("../config-proxy").http_port + 1;
  return require('socket.io-push-client')('http://localhost:' + port, {
    pushId,
    platform,
    transports: ['websocket', 'polling'],
    useNotification: true
  });
};

DefaultSetting.getDefaultPushHttpsClient = (pushId) => {
  let port = require("../config-proxy").https_port + 1;
  return require('socket.io-push-client')('https://localhost:' + port, {
    pushId: pushId,
    transports: ['websocket', 'polling'],
    useNotification: true,
    rejectUnauthorized: false
  });
};

DefaultSetting.getDefaultApiUrl = () => {
  let port = require("../config-api").http_port;
  return 'http://localhost:' + port;
};

DefaultSetting.getDefaultApiServer = () => {
  let apiConfig = require('../config-api');
  apiConfig.pushAllInterval = 0;
  let apiHttpServer = require('http').createServer();
  apiHttpServer.listen(apiConfig.http_port);
  return require('../lib/api')(apiHttpServer, null, apiConfig);
};

DefaultSetting.getDefaultApnProxyServer = () => {
  let apnConfig = require('../config-apn-proxy');
  let apiHttpServer = require('http').createServer();
  apiHttpServer.listen(apnConfig.http_port);
  let fs = require('fs');
  let https_key = fs.readFileSync(apnConfig.https_key);
  let https_cert = fs.readFileSync(apnConfig.https_cert);

  let httpsServer = require('spdy').createServer({
    key: https_key,
    cert: https_cert
  });
  httpsServer.listen(apnConfig.https_port);
  return require('../lib/apnProxy')(apiHttpServer, httpsServer, apnConfig);
}

DefaultSetting.getDefaultProxyServer = () => {
  let proxyConfig = require('../config-proxy');
  let proxyHttpServer = require('http').createServer();
  let fs = require('fs');
  let proxyHttpsServer = require('https').createServer({
    key: fs.readFileSync(__dirname + '/../cert/https/key.pem'),
    cert: fs.readFileSync(__dirname + '/../cert/https/cert.pem')
  });
  let ioServer = require('socket.io');
  let io = new ioServer({
    pingTimeout: proxyConfig.pingTimeout,
    pingInterval: proxyConfig.pingInterval,
    transports: ['websocket', 'polling']
  });
  io.attach(proxyHttpServer);
  io.hs = proxyHttpServer;
  io.attach(proxyHttpsServer);
  io.hss = proxyHttpsServer;
  proxyHttpServer.listen(proxyConfig.http_port + 1);
  proxyHttpsServer.listen(proxyConfig.https_port + 1);
  proxyConfig.statsCommitThreshold = 500;
  return require('../lib/proxy')(io, proxyConfig);
};

module.exports = DefaultSetting;
