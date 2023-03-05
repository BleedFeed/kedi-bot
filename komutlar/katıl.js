const {SlashCommandBuilder} = require('discord.js');
const { VoiceConnectionStatus } = require('@discordjs/voice');

const voice = require('@discordjs/voice');
const hostname = process.env.hostname;

module.exports = {
    data:new SlashCommandBuilder()
	.setName('katıl')
	.setDescription('odanıza katılıp radyoyu çalar'),
    async execute(interaction){
        if(!!interaction.guild.members.me.voice.channelId){
            interaction.reply({content:'ben zaten kanaldyım kardesm',ephemeral:true});
            return;
        }
        if(!interaction.member.voice.channelId){
            interaction.reply({content:'seslide değilsin',ephemeral:true});
            return;
        }

        let connection = await voice.joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator
        });

        const player = voice.createAudioPlayer();

        const resource = voice.createAudioResource(hostname + '/radyo', {
            seek: 0,
            volume: 1
        });

        connection.on(VoiceConnectionStatus.Ready, (oldState, newState) => {
            player.play(resource)
        });

    }
}