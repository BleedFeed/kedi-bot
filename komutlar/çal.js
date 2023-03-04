const {SlashCommandBuilder} = require('discord.js');
const ytubes = require('ytubes');
const {getBasicInfo} = require('ytdl-core');

module.exports ={ 
    data : new SlashCommandBuilder()
	.setName('çal')
	.setDescription('youtubedan videoların seslerini oynatır.')
    .addStringOption(option =>
		option.setName('video')
			.setDescription('Oynatilacak videonun adi')
            .setRequired(true)),
    async execute(interaction,servers,client){
        console.log(interaction.guild.members.me.voice);
        if(!interaction.member.voice.channel || (!!interaction.guild.members.me.voice.channelId && interaction.guild.members.me.voice.channelId !== interaction.member.voice.channelId)){
            interaction.reply({content:'aynı kanalda değiliz veya sen sesli kanalde değilsin.',ephemeral:true});
            return;
        }

        const videoSpecifier = interaction.options.getString('video');

        if(videoSpecifier.startsWith('https://www.youtube.com') ||videoSpecifier.startsWith('https://youtu.be/')){
            const videoDetails =  (await getBasicInfo(videoSpecifier)).videoDetails;
            if(typeof servers[interaction.guildId] !== 'object'){
                servers[interaction.guildId] = {queue:[]}
            }
            servers[interaction.guildId].queue.push({title:videoDetails.title,duration:secondsToHms(videoDetails.lengthSeconds),link:videoDetails.video_url,thumbnail:`https://i.ytimg.com/vi/${videoDetails.videoId}/maxresdefault.jpg`})
        }
        else{
            const videoDetails = (await ytubes.getVideo(videoSpecifier,{max:1,language:'tr-TR'}))[0];
            if(typeof servers[interaction.guildId] !== 'object'){
                servers[interaction.guildId] = {queue:[]}
            }
            servers[interaction.guildId].queue.push({title:videoDetails.title,duration:videoDetails.duration,link:videoDetails.link,thumbnail:videoDetails.thumbnail});
        }
     

    },
}
