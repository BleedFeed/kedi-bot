require('dotenv').config();
const token = process.env.token;
const fs = require('fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const http = require('http');

const client = new Client({ intents: [GatewayIntentBits.Guilds,GatewayIntentBits.GuildVoiceStates] });

const writableStreams = [];

let servers = {};

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'komutlar');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}


client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction,writableStreams);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'Komut çalışıtırlamadı.', ephemeral: true });
		} else {
			await interaction.reply({ content: 'Komut çalıştırılamadı.', ephemeral: true });
		}
	}
});


client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});


const server = http.createServer((req,res)=>{
	if(req.url === '/radyo'){
		console.log('radyoya dinleyici geldi');
		res.writeHead(200,{'Content-Type':'audio/mpeg','Connection':'keep-alive'});
		writableStreams.push(res);
		res.on('error',()=>{
			writableStreams.splice(writableStreams.indexOf(res),1);
		});
		res.on('close',()=>{
			writableStreams.splice(writableStreams.indexOf(res),1);
		});
	}
	else if (req.url === '/'){
		res.writeHead(200);
		res.write('asdas famanas');
	}

});

server.listen(80);



client.login(token);
