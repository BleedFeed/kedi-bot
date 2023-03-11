const {SlashCommandBuilder} = require('discord.js');
const read = require('../utils/playingReadable');

module.exports = {
    data:new SlashCommandBuilder()
	.setName('geç')
	.setDescription('geçer'),
    async execute(interaction){
        if(read.playingRedable !== null){
            read.playingRedable.emit('end');
            interaction.reply('gecildi');
        }
    }
}