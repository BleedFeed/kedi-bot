const {SlashCommandBuilder} = require('discord.js');
const playingReadable = require('../utils/playingReadable');


module.exports = {
    data:new SlashCommandBuilder()
	.setName('geç')
	.setDescription('geçer'),
    async execute(interaction){
        if(playingReadable.stream !== null){
            playingReadable.stream.unpipe();
            playingReadable.stream.push(null);
            interaction.reply({content:'geçildi',ephemeral:true});
        }
        else{
            interaction.reply({content:'geçilemedi',ephemeral:true});
        }
    }
}