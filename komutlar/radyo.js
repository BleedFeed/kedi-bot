const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder ,ButtonBuilder} = require("discord.js");
require('dotenv').config();
const ytdl = require('ytdl-core');
const Throttle = require('throttle');
const hostname = process.env.hostname;
const queue = require('../utils/queue');
const songs = require('../utils/songs');
const {spawn} = require('child_process');
const { PassThrough } = require("stream");
const nowPlaying = require('../utils/nowPlaying');
const nodeshout  = require('nodeshout');



const youtubedl = require('youtube-dl-exec');
const youtubedl = require('youtube-dl-exec');


module.exports = {
    data : new SlashCommandBuilder()
	.setName('radyo')
	.setDescription('radyo')
    .addStringOption(option =>
		option.setName('video')
			.setDescription('video linki')
            .setRequired(true)),
    async execute(interaction){
        await interaction.deferReply({ephemeral:true});
        spawn('icecast',['c','/usr/local/etc/icecast.xml']);

        const videoLink = interaction.options.getString('video');

        if(!videoLink.startsWith('https://www.youtube.com') && !videoLink.startsWith('https://youtu.be/')){
            console.log('hatalı link');
            interaction.reply({content:'Hatalı Link ! Sadece youtube video ve playlist linkleri geçerlidir',ephemeral:true});
            return;
        }

        queue.push(videoLink);
        console.log(nowPlaying);
        if(nowPlaying.playing.title){
            interaction.editReply({content:'Sıraya eklendi',ephemeral:true});
            return;
        }

        const row = new ActionRowBuilder()
                .addComponents(
                        new ButtonBuilder()
                                .setLabel('Radyo Link')
                                .setURL(hostname + '/radyo')
                                .setStyle(ButtonStyle.Link),
                );

        nodeshout.init();

        // Create a shout instance
        const shout = nodeshout.create();

        // Configure it
        shout.setHost('localhost');
        shout.setPort(8000);
        shout.setUser('source');
        shout.setPassword('hackme');
        shout.setMount('radyo');
        shout.setFormat(1); // 0=ogg, 1=mp3
        shout.setAudioInfo('bitrate', '128');
        shout.setAudioInfo('samplerate', '44100');
        shout.setAudioInfo('channels', '2');
    
        shout.open();

        let videoDetails = await setUpStream(true,interaction.client,shout);

        // Reading & sending loop


        await interaction.editReply({content:videoDetails.title + ' çalıyor', components:[row]});

    }
}

function getAudioStream(url){
function getAudioStream(url){

    return new Promise(async(resolve,reject)=>{

        const ytdlStream = await ytdl(url,{filter:'audioonly',quality:'highestaudio'});

        const ytdlStream = await ytdl(url,{filter:'audioonly',quality:'highestaudio'});

        const ffmpegProcess = spawn('ffmpeg',[
        '-i','pipe:3',
        '-f','mp3',
        '-ar','44100',
        '-ac','2',
        '-codec:a','libmp3lame',
        '-b:a','128k',
        'pipe:4'],{stdio:['ignore','ignore','ignore','pipe','pipe']});
        ytdlStream.pipe(ffmpegProcess.stdio[3]);
        resolve(ffmpegProcess.stdio[4].pipe(new Throttle(16384)));
    });
}

async function setUpStream(fromQueue,client,shout){

    let readable;
    let videoDetails;

    if(fromQueue){
        readable = await getAudioStream(queue[0]);
        videoDetails = (await ytdl.getBasicInfo(queue[0])).videoDetails;
    }
    else{
        let song = songs[Math.floor(Math.random() * songs.length)];
        readable = await getAudioStream(song);
        videoDetails = (await ytdl.getBasicInfo(song)).videoDetails;

    }

    nowPlaying.set({title:videoDetails.title},client);

    readable.on('data',(chunk)=>{
        shout.send(chunk, chunk.length);
    });

    readable.on('end',async ()=>{
        if(fromQueue){
            queue.shift();
        }
        setUpStream(queue.length !==0,client,shout);
    });
    
    return(videoDetails);
}
