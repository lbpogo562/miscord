const getEnvConfig = require('./getEnvConfig.js')
const log = require('npmlog')
const path = require('path')
const util = require('util')
const os = require('os')
const fs = require('fs')
const getKey = (e, d) => e === undefined ? d : e
const getConfigPath = () => {
  if (process.env.NODE_ENV === 'development') return '.'
  switch (process.platform) {
    case 'win32':
      return path.join(process.env.APPDATA, 'Miscord')
    case 'linux':
      return path.join(os.homedir(), '.config', 'Miscord')
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', 'Miscord')
    default:
      return path.join(os.homedir(), '.miscord')
  }
}

module.exports = async configPath => {
  var config = await getConfig(configPath)

  // if any of the optional values is undefined, return default value
  return {
    messenger: {
      username: config.messenger.username,
      password: config.messenger.password,
      forceLogin: getKey(config.messenger.forceLogin, false),
      showUsername: getKey(config.messenger.showUsername, true),
      boldUsername: getKey(config.messenger.boldUsername, false),
      filter: {
        whitelist: config.messenger.filter.whitelist || [],
        blacklist: config.messenger.filter.blacklist || []
      }
    },
    discord: {
      token: config.discord.token,
      guild: config.discord.guild,
      category: config.discord.category || 'messenger',
      sendNotifications: getKey(config.discord.sendNotifications, true),
      noEmbeds: getKey(config.discord.noEmbeds, false),
      renameChannels: getKey(config.discord.renameChannels, true),
      showEvents: getKey(config.discord.showEvents, false)
    },
    checkUpdates: getKey(config.checkUpdates, true),
    logLevel: process.env.MISCORD_LOG_LEVEL || config.logLevel || 'info',
    custom: config.custom || {},
    path: getConfigPath()
  }
}

function getConfig (configPath) {
  return new Promise(async (resolve, reject) => {
    var config
    var configFolder = getConfigPath()
    try {
      var data = await util.promisify(fs.readFile)(configPath || path.join(configFolder, 'config.json'), 'utf8')
      config = JSON.parse(data)

      if (config.facebook) {
        log.warn('config.facebook.* is deprecated. Use config.messenger.* instead.')
        config.messenger = config.facebook
      }
      if (!config.discord.token || !config.messenger.username || !config.messenger.password) {
        log.warn('getConfig', 'Token/username/password not found, getting env config')
        resolve(getEnvConfig())
      }
      resolve(config)
    } catch (err) {
      if (err.code && err.code === 'ENOENT') {
        try {
          log.warn('getConfig', (configPath || path.join(configFolder, 'config.json') + ' not found, creating example config'))
          var example = path.join(__dirname, '../../config.example.json')
          var configFile = configPath || path.join(configFolder, 'config.json')
          // https://github.com/zeit/pkg/issues/342#issuecomment-368303496
          if (process.pkg) {
            fs.writeFileSync(configFile, fs.readFileSync(example))
          } else {
            fs.copyFileSync(example, configFile)
          }
        } catch (error) {
          log.warn('getConfig', error)
        }
        resolve(getEnvConfig())
      } else {
        log.warn('getConfig', 'Something went wrong:', err)
        resolve(getEnvConfig())
      }
    }
  })
}
