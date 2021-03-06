const log = require('npmlog')
const Discord = require('discord.js')
const discord = new Discord.Client()

const sendError = require('../error.js')

module.exports = config => {
  log.level = config.logLevel
  // log in to discord
  log.info('login', 'Logging in to Discord...')
  return discord.login(config.discord.token).then(async u => {
    log.info('login', 'Logged in to Discord')

    // if bot isn't added to any guilds, send error
    log.silly('login: guilds', discord.guilds)
    if (discord.guilds.size === 0) sendError('No guilds added!')

    // set guild as a global variable, if it's specified in arguments then get it by name, if not then get the first one
    config.discord.guild = config.discord.guild ? discord.guilds.get(config.discord.guild) : discord.guilds.first()
    log.silly('login: guild', config.discord.guild)

    // if guild is undefined, send error
    if (!config.discord.guild) sendError('Guild not found!')
    log.verbose('login', 'Found Discord guild')

    // get category and list of channels
    var category = config.discord.guild.channels.find(channel => (channel.name === config.discord.category || channel.id === config.discord.category) && (channel.type === null || channel.type === 'category'))
    if (!category) category = await config.discord.guild.createChannel(config.discord.category, 'category')
    log.verbose('login', 'Got Discord category')
    log.silly('login', category)
    config.discord.category = category
    config.discord.channels = new Map()

    // map every category's channel by topic
    category.children.forEach(channel => config.discord.channels.set(channel.topic, channel))

    // handle custom channels
    if (config.custom && Object.keys(config.custom).length) Object.entries(config.custom).forEach(entry => config.discord.channels.set(entry[0], category.children.find(el => el.topic === entry[0] && (el.name === entry[1] || el.id === entry[1]))))

    log.silly('login: channels', config.discord.channels)

    log.info('login', 'Got Discord channels list')

    return discord
  })
}
