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

        // TODO KATIL VE RADYOYU ÇALMAYA BAŞLA
    }
}