const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder ,ButtonBuilder} = require("discord.js");
require('dotenv').config();
const ytdl = require('ytdl-core');
const Throttle = require('throttle');
const fs = require('fs');
const path = require('path');
const { Converter } = require("ffmpeg-stream")
const hostname = process.env.hostname;
const songs = fs.readdirSync(path.join(process.cwd(),'/songs/'));
const ytlist = require('youtube-playlist');

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
        if(video.startsWith('https')){
            (await ytdl(video,{filter:'audioonly',quality:'highestaudio'})).pipe(input);
        }
        else{
            fs.createReadStream(video).pipe(input);
        }

        resolve(converter);

    });
}

async function setUpThrottledStream(fromQueue,writableStreams){

    var randomBufferInterval;
    let converter;

    if(fromQueue){
       converter = await getReadableAudioStream(queue[0].url);
    }
    else{
        converter = await getReadableAudioStream(path.join(process.cwd(),'songs',songs[Math.floor(Math.random() * songs.length)]));
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
    if(randomBufferInterval){
        clearInterval(randomBufferInterval);
        randomBufferInterval = null;
    }
    readableThrottled.on('data', (chunk) => {
        for (const writable of writableStreams) {
            writable.write(chunk);
        }});
    readableThrottled.on('close',()=>{
        console.log('stream kapandı');
        if(fromQueue){
            queue.shift();
        }
        randomBufferInterval = setInterval(()=>
        {
            for (const writable of writableStreams){
                writable.write(Buffer.from([31,31,31,31,31,31,31]));
            }
        },500);
        setUpThrottledStream(queue.length !== 0,writableStreams);
    })

    await converter.run();
    


}