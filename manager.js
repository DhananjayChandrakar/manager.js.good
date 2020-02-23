const Discord = require('discord.js');
const Enmap = require("enmap");
const Canvas = require("canvas");
const { ErelaClient, Utils } = require('erela.js');
const mongoose = require("mongoose");
const client = new Discord.Client();
const fs = require('fs');
const { token } = require("./config.json");
const nodes = [{
  host: "localhost",
  port: 2333,
  password: "youshallnotpass",
}];

client.on('ready', async () => {
  client.points = new Enmap({name: "points"});
  client.user.setActivity(`${client.guilds.size} servers.`, { type: "WATCHING"});
  console.log(`${client.user.username}`);
  client.music = new ErelaClient(client, nodes)
    .on("nodeConnect", node => console.log("Sucessfully created a new node."))
    .on("nodeError", (node, error) => console.log(`Node error: ${error.message}`))
    .on("queueEnd", player => {
        player.textChannel.send("Queue has ended.");
        client.music.players.destroy(player.guild.id);
    })
    .on("trackStart", ({textChannel}, {title, duration}) => textChannel.send(`**Now Playing ${title}\`${Utils.formatTime(duration, true)}\`**`));
    client.levels = new Map()
      .set("none", 0.0)
      .set("low", 0.10)
      .set("medium", 0.15)
      .set("high", 0.25);
    
});

client.on('voiceStateUpdate', (oldMember, newMember) => {
  let newUserChannel = newMember.voiceChannel
  let oldUserChannel = oldMember.voiceChannel
  if(oldUserChannel === undefined && newUserChannel !== undefined) {
    let joinembed = new Discord.RichEmbed()
	    .setColor("GREEN")
      .setTimestamp()
      .setAuthor(`${newMember.user.username}`, newMember.user.displayAvatarURL)
      .setFooter(`ID: ${newMember.user.id}`)
	    .setTitle(`**The ${newMember.user.username} has joined the voice channel named ${newMember.voiceChannel.name}**`);
	let joinlog = oldMember.guild.channels.find(ch => ch.name === "logs");
	if (!joinlog) return;
	joinlog.send(joinembed)
  } else if(newUserChannel === undefined){
    let leaveembed = new Discord.RichEmbed()
      .setColor("RED")
      .setTimestamp()
      .setAuthor(`${oldMember.user.username}`, oldMember.user.displayAvatarURL)
      .setFooter(`ID: ${oldMember.user.id}`)
	    .setTitle(`**The ${newMember.user.username} has just left the voice channel named ${oldMember.voiceChannel.name}**`);
	let leavelog = oldMember.guild.channels.find(ch => ch.name === "logs");
	if (!leavelog) return;
	leavelog.send(leaveembed)
  }
})

let prompt = process.openStdin()
prompt.addListener("data", res => {
  let x = res.toString().trim().split(/ +/g)
  client.channels.get("667664454313574400").send(x.join(" "));
});

client.on('guildMemberAdd', async member => {
  let welcomerCHANNEL = member.guild.channels.find(ch => ch.name === "welcome");
  if (!welcomerCHANNEL) return;
  let canvas = Canvas.createCanvas(401, 202);
  let ctx = canvas.getContext('2d');
  let background = await Canvas.loadImage('./wallpaper.png');
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  let avatar = await Canvas.loadImage(member.user.displayAvatarURL);
  ctx.drawImage(avatar, 150, 20, 90, 90);
  ctx.font = '20px Roboto';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(member.displayName, canvas.width / 3.8, canvas.height / 1.5);
  ctx.fillText(`You are our ${member.guild.memberCount}th member!`, canvas.width / 4.1, canvas.height / 1.3)
  let attachment = new Discord.Attachment(canvas.toBuffer(), 'welcome-image.png');
  welcomerCHANNEL.send(`Welcome to the server, ${member}!`, attachment);
  });


client.on('guildMemberRemove', async member => {
  let leavechannel = member.guild.channels.find(ch => ch.name === "leave");
  if (!leavechannel) return;
  let leaveembed = new Discord.RichEmbed()
  .setColor("RED")
  .setThumbnail(member.user.displayAvatarURL)
  .setTitle(`**Goodbye ${member.user.username} 😭 from our server we will miss you. I hope that you had a good time with us. Now we have only ${member.guild.memberCount} members on our server.**`)
  .setTimestamp()
  leavechannel.send(leaveembed);
  let loggingChannel = member.guild.channels.find(ch => ch.name === "logs")
  if (!loggingChannel) return;
  let leavedembed = new Discord.RichEmbed()
  .setColor("RED")
  .setThumbnail(member.user.displayAvatarURL)
  .setTitle(`** ${member.user.username} has just left our server**`)
  .setDescription(`**Now we have only ${member.guild.memberCount} members**`)
  .setTimestamp()
  loggingChannel.send(leavedembed);
});

client.on('guildBanAdd', async (guild, user) => {
  let { reason } =  await guild.fetchBan(user);
  if (!reason) reason = "No reason given!"
  let loggingChannel = guild.channels.find(ch => ch.name === "logs")
  let embed = new Discord.RichEmbed()
  .setColor("RANDOM")
  .setTitle('**A new member has been banned from the server**')
  .setThumbnail(user.displayAvatarURL)
  .setTimestamp()
  .addField("REASON:", reason)
  .addField(`Member Name:`, user.username)
  if(!loggingChannel) return;
  await loggingChannel.send(embed)
})

client.on('guildBanRemove', async (guild,user) => {
	let loggingChannel = guild.channels.find(ch => ch.name === "logs");
	if (!loggingChannel) return;
	let embed = new Discord.RichEmbed()
		.setColor("RANDOM")
		.setTitle("**A new member has been unbanned from the server**")
		.setTimestamp()
		.addField("MEMBER NAME:", user.username, true)
	loggingChannel.send(embed);
});

client.on('guildCreate', async guild => {
  let owner = guild.owner
  let embed = new Discord.RichEmbed()
  .setColor("RANDOM")
  .setTitle(`**Thanks for adding me to your server ${guild.name}**`)
  .setDescription("**MY DEFAULT PREFIX IS: !. YOU CAN SET YOUR OWN PREFIX BY TYPING !SETPREFIX <prefix name>**")
  owner.send(embed)
});

client.on("guildDelete", async guild => {
  let owner = guild.owner
  let embed = new Discord.RichEmbed()
  .setColor("RANDOM")
  .setTitle(`**We really apologize that our bot could not do the things that you want to do.**`)
  owner.send(embed)
})

client.on('messageUpdate', async (oldMessage, newMessage) => {
  if(oldMessage.content === newMessage.content){
    return;
  };
  let embed = new Discord.RichEmbed()
    .setColor("RANDOM")
    .setAuthor(oldMessage.author.tag, oldMessage.author.avatarURL)
    .setThumbnail(oldMessage.author.avatarURL)
    .setDescription('A message form a user updated')
    .addField("BEFORE", oldMessage.content, true)
    .addField("AFTER", newMessage.content, true)
    .setTimestamp()
  let loggingChannel = newMessage.guild.channels.find(ch => ch.name === "logs")
  if(!loggingChannel) return;
  loggingChannel.send(embed);
});

client.on('messageDelete', async message => {
  if (!message.content) return;
  let embed = new Discord.RichEmbed()
    .setColor("RANDOM")
    .setTitle("**A new deleted Message!**")
    .setThumbnail(message.author.avatarURL)
    .addField("Deleted Content:", message.content)
    .addField("Deleted By:", message.author.username)
    .addField("DELETED In", message.channel)
    .addField("Deleted AT:", message.createdAt.toLocaleString())
    .setTimestamp()
  let loggingChannel = message.guild.channels.find(ch => ch.name === "logs")
  if(!loggingChannel) return;
  loggingChannel.send(embed);
});

client.on('channelCreate', async channel => {
  let embed = new Discord.RichEmbed()
    .setColor("RANDOM")
    .setTitle("A new channel has been created")
    .addField("Created AT:", channel.createdAt.toLocaleDateString())
    .addField("Channel Name:", channel.name)
  let loggingChannel = channel.guild.channels.find(ch => ch.name === "logs")
  if(!loggingChannel) return;
  loggingChannel.send(embed)
})

client.on('channelDelete', async channel => {
  let embed = new Discord.RichEmbed()
    .setColor("RANDOM")
    .setTitle("**A new channel has been deleted.**")
    .addField("Channel Name:", channel.name)
    .setTimestamp()
    .setFooter("Deleted AT:")
  let loggingChannel = channel.guild.channels.find(ch => ch.name === "logs")
  if(!loggingChannel) return;
  loggingChannel.send(embed)
})

client.on('channelUpdate', async (oldChannel, newChannel) => {
  if (oldChannel.name === newChannel.name) return;
  let embed = new Discord.RichEmbed()
    .setColor("RANDOM")
    .setTitle("**A channel has been updated.**")
    .addField("CHANNEL NAME BEFORE:", oldChannel.name, true)
    .addField("CHANNEL NAME AFTER:", newChannel.name, true)
    .setTimestamp()
  let loggingChannel = newChannel.guild.channels.find(ch => ch.name === "logs")
  if(!loggingChannel) return;
  loggingChannel.send(embed)
})

client.on('roleCreate', async role => {
  let embed = new Discord.RichEmbed()
    .setColor("RANDOM")
    .setTitle("**A new role has been created**")
    .addField("ROLE NAME:", role.name)
    .setTimestamp()
    .addField("ROLE CREATED AT:", role.createdAt)
  let loggingChannel = role.guild.channels.find(ch => ch.name === "logs")
  if(!loggingChannel) return;
  loggingChannel.send(embed)
})

client.on('roleDelete', async role => {
  let embed = new Discord.RichEmbed()
    .setColor("RANDOM")
    .setTitle("**A role has been deleted**")
    .setTimestamp()
    .addField("ROLE NAME:", role.name)
    .setTimestamp()
    .setFooter("DELETED AT:")
  let loggingChannel = role.guild.channels.find(ch => ch.name === "logs")
  if(!loggingChannel) return;
  loggingChannel.send(embed)
})

client.on('roleUpdate', async(oldRole, newRole) => {
  if (oldRole.name === newRole.name) return;
  let embed = new Discord.RichEmbed()
    .setColor("RANDOM")
    .setTitle("**A role has been updated**")
    .addField("BEFORE:", oldRole.name, true)
    .addField("AFTER:", newRole.name, true)
    .setTimestamp()
  let loggingChannel = newRole.guild.channels.find(ch => ch.name === "logs")
  if(!loggingChannel) return;
  loggingChannel.send(embed)
})

client.on('message', async (message) => {
  if (message.guild) {
    const key = `${message.guild.id}-${message.author.id}`;
    client.points.ensure(`${message.guild.id}-${message.author.id}`, {
      user: message.author.id,
      guild: message.guild.id,
      points: 0,
      level: 0
    });
    client.points.inc(key, "points");
    const curLevel = Math.floor(client.points.get(key, "points")/100);
    if (client.points.get(key, "level") < curLevel) {
      message.reply(`You've leveled up to level **${curLevel}**`);
      client.points.set(key, curLevel, "level");
    }
  }
  let prefixes = JSON.parse(fs.readFileSync("./prefixes.json", "utf8"));
  if (!prefixes[message.guild.id]){
    prefixes[message.guild.id] = {
      prefixes: '!'
    };
  }
  let prefix = prefixes[message.guild.id].prefixes;
  let args = message.content.slice(prefix.length).trim().split(' ');
  let cmd = args.shift().toLowerCase();

  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  try {
    delete require.cache[require.resolve(`./commands/${cmd}.js`)];
    let commandFile = require(`./commands/${cmd}.js`);
    commandFile.run(client, message, args);
  } catch (error) {
    console.log(error.stack);
  }
});


client.login(token);