const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    data:new SlashCommandBuilder()
	.setName('geç')
	.setDescription('geçer'),
    async execute(interaction,writableStreams){
        let readable = require('../utils/readable').readable
        if(readable !== null){
            emit('end');
        }
    }
}