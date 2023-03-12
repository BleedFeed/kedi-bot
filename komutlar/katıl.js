const {SlashCommandBuilder} = require('discord.js');
const voice = require('@discordjs/voice');
const hostname = process.env.hostname;
const port = process.env.port;

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



        const resource = voice.createAudioResource('http://13.50.73.94');

        resource.on('')

        const player = voice.createAudioPlayer()


        const connection = voice.joinVoiceChannel({
            channelId: interaction.member.voice.channelId,
            guildId: interaction.guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        connection.on(voice.VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
            
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
                // Seems to be reconnecting to a new channel - ignore disconnect
            } catch (error) {
                // Seems to be a real disconnect which SHOULDN'T be recovered from
                connection.destroy();
            }
        });

        connection.on(voice.VoiceConnectionStatus.Ready, () => {
            play(resource,player,connection);
        });

    }
}

function play(resource,player,connection){
    player.play(resource);
    player.on('end',()=>{
        const newResource = voice.createAudioResource('http://13.50.73.94');
        play(newResource,player,connection);
    })
    connection.subscribe(player);
}