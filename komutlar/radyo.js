const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder ,ButtonBuilder} = require("discord.js");
require('dotenv').config();
const ytdl = require('ytdl-core');
const queue = require('../utils/queue');
const songs = require('../utils/songs');
const {spawn} = require('child_process');
const nowPlaying = require('../utils/nowPlaying');
const hostname = process.env.hostname;
const Throttle = require('throttle');
const playingReadable = require('../utils/playingReadable');


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


        let writableStreams = require('../utils/writableStreams');

        let videoDetails = await setUpStream(true,writableStreams,interaction.client);

        await interaction.editReply({content:videoDetails.title + ' çalıyor', components:[row]});

    }
}

function getAudioStream(url){

    return new Promise(async(resolve,reject)=>{

		const ytdlpProcess = spawn('./yt-dlp',['-f','ba',url,'-o','-'],{stdio:['ignore','pipe','ignore']});


        const ffmpegProcess = spawn('ffmpeg',[
        '-i','pipe:3',
        '-f','mp3',
        '-tune', 'zerolatency',
        '-ar','44100',
        '-ac','2',
        '-b:a','128k',
        '-codec:a','libmp3lame',
		'-flush_packets','1',
        'pipe:4',
		],{stdio:['ignore','pipe','pipe','pipe','pipe']});
		ytdlpProcess.stdio[1].pipe(ffmpegProcess.stdio[3]);
		ffmpegProcess.on('close',()=>{
			// ytdlpProcess.kill('SIGKILL');
		})
        resolve(ffmpegProcess);
    });
}

async function setUpStream(fromQueue,writableStreams,client){

    let videoDetails
	let process;

    if(fromQueue){
        videoDetails = (await ytdl.getBasicInfo(queue[0])).videoDetails;
        process = await getAudioStream(queue[0]);
        queue.shift();
    }
    else{
        let song = songs[Math.floor(Math.random() * songs.length)];
        videoDetails = (await ytdl.getBasicInfo(song)).videoDetails;
        process = await getAudioStream(song);
    }
    
    const readable = process.stdio[4].pipe(new Throttle(16384));

    nowPlaying.set({title:videoDetails.title},client);


    readable.on('data',async (chunk)=>{
		for(let i = 0; i < writableStreams.length;i++){
			writableStreams[i].write(chunk);
		}
    });

    readable.on('end',()=>{
        console.log('bitti');
		process.kill('SIGKILL');
        setUpStream(queue.length !==0,writableStreams,client);
    });


    readable.on('error',(err)=>{
        console.log(err);
    });

    playingReadable.stream = readable;

    return(videoDetails);
}
