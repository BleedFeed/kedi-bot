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
const activeConnections = {};
const { PassThrough } = require("stream");
const ReadableStreamClone = require("readable-stream-clone");
const readableThrottled = new PassThrough();
const http = require('http');
let isPlaying = false;
const nodeshout = require('nodeshout');



const youtubedl = require('youtube-dl-exec');


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

        if(isPlaying){
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

        setUpStream(true,writableStreams);

        nodeshout.init();

        // Create a shout instance
        const shout = nodeshout.create();

        // Configure it
        shout.setHost('localhost');
        shout.setPort(8000);
        shout.setMount('radyo');
        shout.setFormat(1); // 0=ogg, 1=mp3
        shout.setAudioInfo('bitrate', '128');
        shout.setAudioInfo('samplerate', '44100');
        shout.setAudioInfo('channels', '2');

        let data;
        const chunkSize = 65536;
        while ((data = readableThrottled.read(chunkSize)) !== null) {
                shout.send(data, data.length);
                shout.sync();
          }





        interaction.reply({content:videoDetails.title + ' çalıyor', components:[row]});

    }
}

function getAudioStream(url){

    return new Promise(async(resolve,reject)=>{

        const ytdlStream = await ytdl(url,{filter:'audioonly',quality:'highestaudio'});

        const ffmpegProcess = spawn('ffmpeg',[
        '-i','pipe:3',
        '-f','mp3',
        '-y',
        '-ar','44100',
        '-ac','2',
        '-codec:a','libmp3lame',
        '-b:a','128k',
        'pipe:4'],{stdio:['ignore','ignore','ignore','pipe','pipe']});
        ytdlStream.pipe(ffmpegProcess.stdio[3]);
        resolve(ffmpegProcess.stdio[4]);
    });
}



async function setUpStream(fromQueue,writableStreams){


    let readable;

    if(fromQueue){
        readable = await getAudioStream(queue[0].url);
    }
    else{
        readable = await getAudioStream(songs[Math.floor(Math.random() * songs.length)]);
    }
    
    readable.pipe(readableThrottled,{end:false});
    console.log('calmaya basladı');
    isPlaying = true;

    readable.on('end',()=>{
        console.log('stream kapandı');
        if(fromQueue){
            queue.shift();
        }
        setUpStream(queue.length !== 0,writableStreams);
    })

}         