const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    data:new SlashCommandBuilder()
	.setName('katıl')
	.setDescription('odanıza katılıp radyoyu çalar'),
    async execute(interaction,writableStreams){
        require('../utils/readable').emit('end');
        
    }
}