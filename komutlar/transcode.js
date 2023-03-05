const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder ,ButtonBuilder} = require("discord.js");
const ytdl = require('ytdl-core');
const Throttle = require('throttle');
const fs = require('fs');
const youtubedl = require('youtube-dl-exec');
const ffprobe = require('ffprobe');
const ffmpeg = require('ffmpeg');
const path = require('path');
const ffprobeStatic = require('ffprobe-static');
const { Converter } = require("ffmpeg-stream")
const { spawn } = require('node:child_process');
let readableThrottled = null;

module.exports = {
    data : new SlashCommandBuilder()
	.setName('transcode')
	.setDescription('transcode')
    .addStringOption(option =>
		option.setName('video')
			.setDescription('video linki')
            .setRequired(true)),
    async execute(interaction,writableStreams){
        interaction.deferReply({ephemeral:true});
        const videoLink = interaction.options.getString('video');

        if(!videoLink.startsWith('https://www.youtube.com') && !videoLink.startsWith('https://youtu.be/')){
            interaction.editReply({content:'hatalı link'});
        }


        const videoDetails = (await ytdl.getBasicInfo(videoLink)).videoDetails;

        const row = new ActionRowBuilder()
                .addComponents(
                        new ButtonBuilder()
                                .setLabel('Radyo Link')
                                .setURL('https://kedi-bot.nedenegelordofg.repl.co/radyo')
                                .setStyle(ButtonStyle.Link),
                );



        const converter = new Converter();
        const input = converter.createInputStream();
        (await ytdl(videoLink,{filter:'audioonly',quality:'highestaudio'})).pipe(input);
        const readable = converter.createOutputStream({
            'f':'mp3',
            'codec:a': 'libmp3lame',
            'b:a':'128k'
        })
        if(readableThrottled){
            readableThrottled.destroy();
        }
        readableThrottled = new Throttle(128000 / 8);
        readable.pipe(readableThrottled).on('data', (chunk) => {
            for (const writable of writableStreams) {
                writable.write(chunk);
            }});

        interaction.editReply({content:videoDetails.title + ' çalıyor', components:[row]});

        await converter.run();

    }
}