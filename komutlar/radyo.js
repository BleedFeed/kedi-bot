const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder ,ButtonBuilder,ActivityType} = require("discord.js");
const {getBasicInfo} = require('ytdl-core');
require('dotenv').config();
const {spawn} = require('child_process');
const hostname = process.env.hostname;
const {songs,queue} = require('../variables');
const variables = require('../variables');
const ffmpeg = require('fluent-ffmpeg');
const { PassThrough } = require("stream");
const nodeshout = require('nodeshout');

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
            interaction.reply({content:'Hatalı Link ! Sadece youtube video ve playlist linkleri geçerlidir',ephemeral:true});
            return;
        }

        queue.push(videoLink);
        if(variables.playingStream !== null){
            interaction.editReply({content:'Sıraya eklendi',ephemeral:true});
            return;
        }

        nodeshout.init();

        // Create a shout instance
        const shout = nodeshout.create();

        // Configure it
        shout.setHost('localhost');
        shout.setPort(80);
        shout.setUser('source');
        shout.setPassword('hackme');
        shout.setMount('radyo');
        shout.setFormat(1); // 0=ogg, 1=mp3
        shout.setAudioInfo('bitrate', '128');
        shout.setAudioInfo('samplerate', '44100');
        shout.setAudioInfo('channels', '2');

        shout.open();

        const row = new ActionRowBuilder()
                .addComponents(
                        new ButtonBuilder()
                                .setLabel('Radyo Link')
                                .setURL(hostname + '/radyo')
                                .setStyle(ButtonStyle.Link),
                );


        let videoDetails = await setUpStream(true,interaction.client,shout);

        await interaction.editReply({content:videoDetails.title + ' çalıyor', components:[row]});

    }
}

function getAudioStream(url){

    return new Promise(async(resolve,reject)=>{


        const ytdlpProcess = spawn('./yt-dlp',['-f','ba',url,'-o','-'],{stdio:['ignore','pipe','ignore']});
            
        const ffmpegProcess = ffmpeg(ytdlpProcess.stdio[1])
        .inputOptions(['-flush_packets','1'])
        .outputFormat('mp3')
        .audioChannels(2)
        .audioBitrate(128)
        .audioFrequency(22050)
        .audioCodec('libmp3lame')

        ffmpegProcess.on('error',(err)=>{
            console.log(err);
            ytdlpProcess.kill();
        })

        ffmpegProcess.on('close',(code,signal)=>{
            console.log('exit code is : ' + code);
            console.log('exit signal is : ' + signal);
            ytdlpProcess.kill();
        })
        resolve(ffmpegProcess)
    });
}

async function setUpStream(fromQueue,client,shout){

    let videoDetails;
	let ffmpegProcess;
    let song;

    if(fromQueue){
        song = queue[0]
        queue.shift();
    }
    else{
        song = songs[Math.floor(Math.random() * songs.length)];
    }
    
    videoDetails = (await getBasicInfo(song)).videoDetails;
    ffmpegProcess = await getAudioStream(song);

    let readable = new PassThrough();

    ffmpegProcess.output(readable);

    readable.on('data',async (chunk)=>{
        readable.pause();
        shout.send(chunk,chunk.length);
        await new Promise(resolve=> setTimeout(resolve,shout.delay()));
        readable.resume();
    });

    readable.on('end',()=>{
        ffmpegProcess.ffmpegProc.stdin.write('q');
        setUpStream(queue.length !==0,client,shout);
    });

    readable.on('error',(err)=>{
        console.log(err);
    })

    variables.playingStream = readable;

    client.user.setActivity(videoDetails.title, { type: ActivityType.Listening});

    ffmpegProcess.run();

    return(videoDetails);
}