const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder ,ButtonBuilder} = require("discord.js");
require('dotenv').config();
const ytdl = require('ytdl-core');
const Throttle = require('throttle');
const hostname = process.env.hostname;
const queue = require('../utils/queue');
const songs = require('../utils/songs');
const {spawn} = require('child_process');
const nowPlaying = require('../utils/nowPlaying');
const { FileReadStream, ShoutStream } = require('nodeshout-napi');
const { PassThrough } = require("stream");
const { Worker, isMainThread } = require('node:worker_threads');
const readableSave = require('../utils/readable');
const {init} = require('./utils/nodeshout');
let isMounted = false;

module.exports = {
    data : new SlashCommandBuilder()
	.setName('radyo')
	.setDescription('radyo')
    .addStringOption(option =>
		option.setName('video')
			.setDescription('video linki')
            .setRequired(true)),
    async execute(interaction){
        if(!asda){
            init();
            isMounted = true;
        }
        await interaction.deferReply({ephemeral:true});
        const videoLink = interaction.options.getString('video');

        if(!videoLink.startsWith('https://www.youtube.com') && !videoLink.startsWith('https://youtu.be/')){
            console.log('hatalı link');
            await interaction.editReply({content:'Hatalı Link ! Sadece youtube video ve playlist linkleri geçerlidir',ephemeral:true});
            return;
        }

        queue.push(videoLink);
        if(nowPlaying.playing.title){
            console.log('sıraya eklendi');
            await interaction.editReply({content:'Sıraya eklendi',ephemeral:true});
            return;
        }

        const row = new ActionRowBuilder()
                .addComponents(
                        new ButtonBuilder()
                                .setLabel('Radyo Link')
                                .setURL(hostname + '/radyo')
                                .setStyle(ButtonStyle.Link),
                );
        const shout = require('../utils/nodeshout').getShout();

        let videoDetails = await setUpStream(true,interaction.client,shout);   

        await interaction.editReply({content:videoDetails.title + ' çalıyor', components:[row]});

    }
}

function getAudioStream(url){

    return new Promise(async(resolve,reject)=>{

        const ytdlStream = await ytdl(url,{filter:'audioonly',quality:'highestaudio'});

        const ffmpegProcess = spawn('ffmpeg',[
        '-i','pipe:3',
        '-f','mp3',
        '-ar','44100',
        '-ac','2',
        '-b:a','128k',
        '-codec:a','libmp3lame',
        '-flush_packets', '1',
        'pipe:4'],{stdio:['ignore','ignore','pipe','pipe','pipe']});
        ytdlStream.pipe(ffmpegProcess.stdio[3]);
        ffmpegProcess.stderr.on('data',(chunk)=>{
            console.log('FFMPEG ERROR: ' + chunk.toString());
        })
        resolve(ffmpegProcess.stdio[4].pipe(new PassThrough({highWaterMark:4096})));
    });
}

async function setUpStream(fromQueue,client,shout){

    let readable;
    let videoDetails;

    if(fromQueue){
        readable = await getAudioStream(queue[0]);
        videoDetails = (await ytdl.getBasicInfo(queue[0])).videoDetails;
        queue.shift();
    }
    else{
        let song = songs[Math.floor(Math.random() * songs.length)];
        readable = await getAudioStream(song);
        videoDetails = (await ytdl.getBasicInfo(song)).videoDetails;
    }


    readable.on('data',async (chunk)=>{
        readable.pause();
        shout.send(chunk,chunk.length);
        await new Promise((resolve)=>{setTimeout(resolve,shout.delay())});
        readable.resume();
    });

    readable.on('end',()=>{
        readable.destroy();
        setUpStream(queue.length !==0,client,shout);
    });


    readable.on('error',(err)=>{
        console.log(err);
    });

    
    readableSave.readable = readable;

    nowPlaying.set({title:videoDetails.title},client);

    return(videoDetails);
}

