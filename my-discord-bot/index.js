require('dotenv').config();
const express = require('express');
const app = express();
// ใช้ Port ที่ Render สุ่มให้ หรือถ้าไม่มีให้ใช้ 3000
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(port, () => console.log(`App listening on port ${port}`));

const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    EmbedBuilder,
    ApplicationCommandOptionType 
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// --- 1. ลงทะเบียนคำสั่ง Slash Command (/) ---
client.once('ready', async () => {
    console.log(`✅ บอท ${client.user.tag} ออนไลน์!`);
    const commands = [
        { name: 'menu', description: 'เปิดเมนูรับของรางวัล (เฉพาะเจ้าของ)' },
        { name: 'clear', description: 'ลบข้อความ (เฉพาะเจ้าของ)', options: [{ name: 'amount', description: 'จำนวน', type: ApplicationCommandOptionType.Integer, required: true }] },
        { name: 'rules', description: 'ประกาศกฎระเบียบ (เฉพาะเจ้าของ)' }
    ];
    try { await client.application.commands.set(commands); console.log('🎉 ลงทะเบียนคำสั่งเรียบร้อย!'); } 
    catch (error) { console.error('Error:', error); }
});

// --- 2. จัดการ Interaction ---
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        // เช็คเจ้าของ
        if (interaction.user.id !== interaction.guild.ownerId) {
            await interaction.reply({ content: '⛔ เฉพาะเจ้าของเซิร์ฟเวอร์เท่านั้น', ephemeral: true });
            return;
        }

        if (interaction.commandName === 'rules') {
            const rulesEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('📜 Server Rules')
                .setDescription('กรุณาปฏิบัติตามกฎระเบียบอย่างเคร่งครัด')
                .addFields(
                    { name: '• ห้ามใช้คำหยาบ', value: 'ห้ามพูดจาหยาบคายหรือดูหมิ่นผู้อื่น' },
                    { name: '• ห้ามสแปม', value: 'ห้ามส่งข้อความซ้ำๆ รบกวนผู้อื่น' }
                );
            await interaction.reply({ embeds: [rulesEmbed] });
        }

        if (interaction.commandName === 'menu') {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('open_secret_menu').setLabel('เลือกของ').setStyle(ButtonStyle.Success).setEmoji('🎁'),
                new ButtonBuilder().setCustomId('just_text_btn').setLabel('คู่มือ').setStyle(ButtonStyle.Secondary).setEmoji('ℹ️')
            );
            await interaction.reply({ content: 'กดปุ่มด้านล่าง:', components: [row], ephemeral: true });
        }

        if (interaction.commandName === 'clear') {
            const amount = interaction.options.getInteger('amount');
            if (amount < 1 || amount > 100) return interaction.reply({ content: '❌ ลบได้ทีละ 1-100 ข้อความ', ephemeral: true });
            await interaction.deferReply({ ephemeral: true });
            try {
                await interaction.channel.bulkDelete(amount, true);
                await interaction.editReply(`🧹 ลบแล้ว ${amount} ข้อความ`);
            } catch (error) { await interaction.editReply('❌ ลบไม่ได้ (ข้อความเก่าเกิน)'); }
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === 'open_secret_menu') {
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder().setCustomId('select_item').setPlaceholder('เลือกไอเทม...').addOptions(
                    new StringSelectMenuOptionBuilder().setLabel('ดาบ').setValue('sword').setEmoji('⚔️'),
                    new StringSelectMenuOptionBuilder().setLabel('โล่').setValue('shield').setEmoji('🛡️'),
                    new StringSelectMenuOptionBuilder().setLabel('ยา').setValue('potion').setEmoji('🧪')
                )
            );
            await interaction.reply({ content: 'เลือกรายการ:', components: [row], ephemeral: true });
        }
        if (interaction.customId === 'just_text_btn') {
            await interaction.reply({ content: 'คู่มือ: กดปุ่มเลือกของได้เลย (ข้อความนี้จะหายใน 10 วิ)', ephemeral: true });
            setTimeout(() => interaction.deleteReply().catch(()=>{}), 10000);
        }
    }
    
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_item') {
        const val = interaction.values[0];
        let text = val === 'sword' ? '⚔️ ดาบ' : val === 'shield' ? '🛡️ โล่' : '🧪 ยา';
        await interaction.update({ content: `คุณเลือก: ${text}`, components: [], embeds: [] });
    }
});

client.login(process.env.DISCORD_TOKEN);