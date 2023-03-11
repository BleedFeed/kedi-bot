const {SlashCommandBuilder} = require('discord.js');
const playingReadable = require('../utils/playingReadable');


module.exports = {
    data:new SlashCommandBuilder()
	.setName('geç')
	.setDescription('geçer'),
    async execute(interaction){
        if(playingReadable.process !== null){
            playingReadable.process.disconnect();
            interaction.reply({content:'geçildi',ephemeral:true});
        }
        else{
            interaction.reply({content:'geçilemedi',ephemeral:true});
        }
    }
}