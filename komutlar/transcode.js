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
    async execute(interaction,transcodes){
        const videoLink = interaction.options.getString('video');
        const videoDetails = (await ytdl.getBasicInfo(videoLink)).videoDetails;
        const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('link')
                .setURL('http://localhost' + url)
                .setStyle(ButtonStyle.Link),
        );
        if(typeof transcodes[url] === 'function'){
            interaction.reply({content:`${videoDetails.title} hazır`, components:[row],ephemeral:true});
            return;
        }
        const url = '/' + videoDetails.videoId;
        transcodes[url] = async function(req,res){
            ytdl(videoLink,{filter:'audioonly'}).pipe(res);
        }

        setTimeout(()=>{delete transcodes[url]},3600*1000*48);
        interaction.reply({content:`${videoDetails.title} hazır`, components:[row],ephemeral:true});
    }
}