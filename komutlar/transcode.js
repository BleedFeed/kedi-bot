const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder ,ButtonBuilder} = require("discord.js");
const ytdl = require('ytdl-core');
const Throttle = require('throttle');  

module.exports = {
    data : new SlashCommandBuilder()
	.setName('transcode')
	.setDescription('transcode')
    .addStringOption(option =>
		option.setName('video')
			.setDescription('video linki')
            .setRequired(true)),
    async execute(interaction,writableStreams){

        const videoLink = interaction.options.getString('video');
        const videoDetails = (await ytdl.getBasicInfo(videoLink)).videoDetails;
        const readableStream = ytdl(videoLink,{filter:'audioonly',quality:'highestaudio'});
        const throttle = new Throttle(128000 / 8);

        const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('link')
                .setURL('https://kedi-bot.nedenegelordofg.repl.co/radyo')
                .setStyle(ButtonStyle.Link),
        );
        
        interaction.reply({content:`${videoDetails.title} çalıyor`, components:[row],ephemeral:true});

        readableStream.pipe(throttle).on('data',(chunk)=>{
            for(const writable of writableStreams){
                writable.write(chunk);
            }
        });
    }
}