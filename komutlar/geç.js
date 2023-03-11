const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    data:new SlashCommandBuilder()
	.setName('geç')
	.setDescription('geçer'),
    async execute(interaction){
        let stream = require('../utils/playingReadable').stream;
        if(stream !== null){
            stream.emit('end');
            interaction.reply({content:'geçildi',ephemeral:true});
        }
        else{
            interaction.reply({content:'geçilemedi',ephemeral:true});
        }
    }
}