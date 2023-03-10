const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder ,ButtonBuilder} = require("discord.js");
require('dotenv').config();
const ytdl = require('ytdl-core');
const Throttle = require('throttle');
const hostname = process.env.hostname;
const queue = require('../utils/queue');
const songs = require('../utils/songs');
const {spawn} = require('child_process');
const nowPlaying = require('../utils/nowPlaying');
const { PassThrough } = require("stream");
const mainStream =  new PassThrough({highWaterMark:16384});
const readable = require('../utils/readable');

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

        let videoDetails = await setUpFile(true,interaction.client,shout);   

        mainStream.on('data',async (chunk)=>{
            mainStream.pause();
            shout.send(chunk,chunk.length);
            const delay = Math.abs(shout.delay());
            console.log(delay);
            await new Promise((resolve)=>setTimeout(resolve,delay));
            mainStream.resume();
        });
    

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
        '-codec:a','libmp3lame',
        '-b:a','128k',
        'pipe:4'],{stdio:['ignore','ignore','ignore','pipe','pipe']});
        ytdlStream.pipe(ffmpegProcess.stdio[3]);
        resolve(ffmpegProcess.stdio[4]);
    });
}

async function setUpFile(fromQueue,client,shout){

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

    readable.pipe(mainStream,{end:false});

    readable.on('end',()=>{
        setUpFile(queue.length !==0,client,shout);
    });


    readable.on('error',(err)=>{
        console.log(err);
    });

    
    readable.readable = readable;

    nowPlaying.set({title:videoDetails.title},client);

    return(videoDetails);
}

