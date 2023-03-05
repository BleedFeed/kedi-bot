const {SlashCommandBuilder} = require('discord.js');
const { VoiceConnectionStatus } = require('@discordjs/voice');
const voice = require('@discordjs/voice');
const hostname = process.env.hostname;

module.exports = {
    data:new SlashCommandBuilder()
	.setName('katıl')
	.setDescription('odanıza katılıp radyoyu çalar'),
    async execute(interaction,writableStreams){
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


        let urlStream = hostname + '/radyo';
        const resource =  voice.createAudioResource(urlStream);
        const player =  voice.createAudioPlayer();

        connection.on(VoiceConnectionStatus.Ready, (oldState, newState) => {
            console.log('bağlantı hazır');
            connection.subscribe(player);
            player.play(resource);
        });

        connection.on(VoiceConnectionStatus.Disconnected, (oldState, newState)=>{
        });

        voiceConnection.on('stateChange', (oldState, newState) => {
            const oldNetworking = Reflect.get(oldState, 'networking');
            const newNetworking = Reflect.get(newState, 'networking');
          
            const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
              const newUdp = Reflect.get(newNetworkState, 'udp');
              clearInterval(newUdp?.keepAliveInterval);
            }
          
            oldNetworking?.off('stateChange', networkStateChangeHandler);
            newNetworking?.on('stateChange', networkStateChangeHandler);
          });

    }
}