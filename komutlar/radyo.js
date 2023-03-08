const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder ,ButtonBuilder} = require("discord.js");
require('dotenv').config();
const ytdl = require('ytdl-core');
const Throttle = require('throttle');
const { Converter } = require("ffmpeg-stream");
const hostname = process.env.hostname;
const queue = require('../utils/queue');
const ytlist = require('youtube-playlist');
const songs = require('../utils/songs');
const fs = require('fs');
const {spawn} = require('child_process');



const youtubedl = require('youtube-dl-exec')

let readableThrottled = null;

module.exports = {
    data : new SlashCommandBuilder()
	.setName('radyo')
	.setDescription('radyo')
    .addStringOption(option =>
		option.setName('video')
			.setDescription('video linki')
            .setRequired(true)),
    async execute(interaction,writableStreams){

        const videoLink = interaction.options.getString('video');

        if(!videoLink.startsWith('https://www.youtube.com') && !videoLink.startsWith('https://youtu.be/')){
            console.log('hatalı link');
            interaction.reply({content:'Hatalı Link ! Sadece youtube video ve playlist linkleri geçerlidir',ephemeral:true});
            return;
        }

        const videoDetails = (await ytdl.getBasicInfo(videoLink)).videoDetails;

        queue.push({title:videoDetails.title,url:videoDetails.video_url});

        if(readableThrottled){
            interaction.reply({content:'Sıraya eklendi',ephemeral:true});
            return;
        }

        const row = new ActionRowBuilder()
                .addComponents(
                        new ButtonBuilder()
                                .setLabel('Radyo Link')
                                .setURL(hostname + '/radyo')
                                .setStyle(ButtonStyle.Link),
                );

        setUpThrottledStream(false,writableStreams);

        interaction.reply({content:videoDetails.title + ' çalıyor', components:[row]});

    }
}

function getReadableAudioStream(video){

    return new Promise(async(resolve,reject)=>{
        const converter = new Converter();
        const input = converter.createInputStream();
        (await ytdl(video,{filter:'audioonly',quality:'highestaudio'})).pipe(input);
        resolve(converter);

    });
}

async function setUpThrottledStream(fromQueue,writableStreams){

    // let converter;

    // if(fromQueue){
    //    converter = await getReadableAudioStream(queue[0].url);
    // }
    // else{
    //     converter = await getReadableAudioStream(songs[Math.floor(Math.random() * songs.length)]);
    // }


    // const readable = converter.createOutputStream({
    //     'f':'mp3',
    //     'codec:a': 'libmp3lame',
    //     'b:a':'128k',
    // });




    const output = await youtubedl(queue[0].url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: [
        'referer:youtube.com',
        'user-agent:googlebot'
        ]
    
    });

    const format = output.formats.filter((format)=> format.format_id == '251')

    const ytdlStream = await ytdl(queue[0].url,{filter:'audioonly',quality:'highestaudio'});

    const ffmpegProcess = spawn('ffmpeg',[
    '-i','stream.',
    '-f','mp3',
    '-ar','44100',
    '-ac','2',
    '-codec:a','libmp3lame',
    '-b:a','128k',
    'pipe:4']);

    // const readable = process.stdin;

    if(readableThrottled){
    readableThrottled.destroy();
    }
    
    readableThrottled = readable.pipe(new Throttle(16384));

    readableThrottled.on('data', (chunk) => {
        for (let i = 0; i < writableStreams.length;i++) {
            writableStreams[i].write(chunk);
        }});

    readableThrottled.on('close',()=>{
        console.log('stream kapandı');
        if(fromQueue){
            queue.shift();
        }
        setUpThrottledStream(queue.length !== 0,writableStreams);
    })

    // await converter.run();
    


}         
