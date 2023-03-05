const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder ,ButtonBuilder} = require("discord.js");
require('dotenv').config();
const ytdl = require('ytdl-core');
const Throttle = require('throttle');
const fs = require('fs');
const path = require('path');
const { Converter } = require("ffmpeg-stream")
const hostname = process.env.hostname;
const songs = ['https://www.youtube.com/watch?v=Ynlfvw2QgE4'];
const ytlist = require('youtube-playlist');
const port = process.env.port

let readableThrottled = null;
let queue = [];

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

        if(!videoLink.startsWith('https://www.youtube.com') && !videoLink.startsWith('https://youtu.be/')){
            console.log('hatalı link');
            interaction.reply({content:'Hatalı Link ! Sadece youtube video ve playlist linkleri geçerlidir',ephemeral:true});
            return;
        }

        const videoDetails = (await ytdl.getBasicInfo(videoLink)).videoDetails;

        queue.push({title:videoDetails.title,url:videoDetails.video_url});

        if(readableThrottled){
            interaction.reply('Sıraya eklendi');
            return;
        }

        const row = new ActionRowBuilder()
                .addComponents(
                        new ButtonBuilder()
                                .setLabel('Radyo Link')
                                .setURL(hostname + '/radyo')
                                .setStyle(ButtonStyle.Link),
                );

        setUpThrottledStream(true,writableStreams);

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

    let converter;

    if(fromQueue){
       converter = await getReadableAudioStream(queue[0].url);
    }
    else{
        converter = await getReadableAudioStream(songs[Math.floor(Math.random() * songs.length)].url);
    }


    const readable = converter.createOutputStream({
        'f':'mp3',
        'codec:a': 'libmp3lame',
        'b:a':'128k'
    });

    if(readableThrottled){
    readableThrottled.destroy();
    }
    
    readableThrottled = readable.pipe(new Throttle(128000 / 8));

    readableThrottled.on('data', (chunk) => {
        for (const writable of writableStreams) {
            writable.write(chunk);
        }});

    readableThrottled.on('close',()=>{
        console.log('stream kapandı');
        if(fromQueue){
            queue.shift();
        }
        setUpThrottledStream(queue.length !== 0,writableStreams);
    })

    await converter.run();
    


}