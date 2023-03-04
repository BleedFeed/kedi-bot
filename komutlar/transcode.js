const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder ,ButtonBuilder} = require("discord.js");
const ytdl = require('ytdl-core');
const Throttle = require('throttle'); 
const fs = require('fs');
const youtubedl = require('youtube-dl-exec');
const ffprobe = require('ffprobe');
const ffmpeg = require('ffmpeg');
const path = require('path');
const ffprobeStatic = require('ffprobe-static');

module.exports = {
    data : new SlashCommandBuilder()
	.setName('transcode')
	.setDescription('transcode')
    .addStringOption(option =>
		option.setName('video')
			.setDescription('video linki')
            .setRequired(true)),
    async execute(interaction,writableStreams){
        interaction.deferReply({ephemeral:true});
        const videoLink = interaction.options.getString('video');

        if(!videoLink.startsWith('https://www.youtube.com') && !videoLink.startsWith('https://youtu.be/')){
            interaction.editReply({content:'hatalı link'});
        }


        const videoDetails = (await ytdl.getBasicInfo(videoLink)).videoDetails;

        const row = new ActionRowBuilder()
                .addComponents(
                        new ButtonBuilder()
                                .setLabel('Radyo Link')
                                .setURL('https://kedi-bot.nedenegelordofg.repl.co/radyo')
                                .setStyle(ButtonStyle.Link),
                );

            
            
        await downloadAndCodec(videoLink)

        const bitRate = (await ffprobe(path.join(process.cwd(),'./stream.mp3'), { path: ffprobeStatic.path })).streams[0].bit_rate;
        const readable = fs.createReadStream(path.join(process.cwd(),'./stream.mp3'));
        const throttle = new Throttle(bitRate / 8);

        interaction.editReply({content:videoDetails.title + ' çalıyor', components:[row]});
            
        readable.pipe(throttle).on('data', (chunk) => {
            for (const writable of writableStreams) {
                writable.write(chunk);
            }}
            );

    }
}


function downloadAndCodec (videoLink) {
    return new Promise(async (resolve,reject)=>{
        await youtubedl(videoLink,{
            f:140,
            o:'streamaac.mp3'
        });


        (await new ffmpeg(path.join(process.cwd(),'./streamaac.mp3')))
        .setAudioChannels(2)
        .setAudioBitRate('128k')
        .save(path.join(process.cwd(), './stream.mp3'),()=>{
        resolve();   
        });


    });
    
}
