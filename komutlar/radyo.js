const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder ,ButtonBuilder,ActivityType} = require("discord.js");
const {getBasicInfo} = require('ytdl-core');
require('dotenv').config();
const {spawn} = require('child_process');
const hostname = process.env.hostname;
const {songs,queue,writableStreams} = require('../variables');
const variables = require('../variables');
const ffmpeg = require('fluent-ffmpeg');
const { PassThrough } = require("stream");
const nodeshout = require('nodeshout');
const mainStream = new PassThrough();

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
        if(variables.process !== null){
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
        shout.setPort(80);
        shout.setUser('source');
        shout.setPassword('hackme');
        shout.setMount('radyo');
        shout.setFormat(1); // 0=ogg, 1=mp3
        shout.setAudioInfo('bitrate', '128');
        shout.setAudioInfo('samplerate', '44100');
        shout.setAudioInfo('channels', '2');

        shout.open();



        let videoDetails = await setUpStream(true,interaction.client,shout);

        mainStream.on('data',async (chunk)=>{
            mainStream.pause();
            shout.send(chunk,chunk.length);
            await new Promise(resolve => setTimeout(resolve,shout.delay()));
            mainStream.resume();
        });



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
        .audioFrequency(44100)
        .audioCodec('libmp3lame')

        resolve(ffmpegProcess);

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
        song = songs[0];
    }
    
    videoDetails = (await getBasicInfo(song)).videoDetails;
    ffmpegProcess = await getAudioStream(song);

    const readable = new PassThrough();

    ffmpegProcess.output(readable);

    readable.pipe(mainStream,{end:false});

    readable.on('end',()=>{
        readable.unpipe();
        setUpStream(queue.length !==0,client,shout);
    });

    readable.on('error',(err)=>{
        console.log(err);
    })

    variables.process = ffmpegProcess;

    client.user.setActivity(videoDetails.title, { type: ActivityType.Listening});

    ffmpegProcess.run();

    return(videoDetails);
}