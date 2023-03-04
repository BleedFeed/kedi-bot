const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder ,ButtonBuilder} = require("discord.js");
const ytdl = require('ytdl-core');

module.exports = {
    data : new SlashCommandBuilder()
	.setName('transcode')
	.setDescription('transcode')
    .addStringOption(option =>
		option.setName('video')
			.setDescription('video linki')
            .setRequired(true)),
    async execute(interaction,writableStreams){

        const stream = ytdl(videoLink,{filter:'audioonly'});
        const videoLink = interaction.options.getString('video');
        const videoDetails = (await ytdl.getBasicInfo(videoLink)).videoDetails;

        const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('link')
                .setURL('https://kedi-bot.nedenegelordofg.repl.co/radyo')
                .setStyle(ButtonStyle.Link),
        );
        
        interaction.reply({content:`${videoDetails.title} çalıyor`, components:[row],ephemeral:true});

        stream.on('data',(chunk)=>{
            for(writable of writableStreams){
                writable.write(chunk);
            }
        })
    }
}