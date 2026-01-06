require('dotenv').config();
const express = require('express');
const app = express();
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
    ApplicationCommandOptionType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags // <--- 1. เพิ่มตัวนี้เข้ามาใหม่ เพื่อแก้ Warning
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// 🔥 ตั้งค่า ID (อย่าลืมแก้ ID ให้ถูกต้องนะครับ) 🔥
const VERIFY_ROLE_ID = '123456789012345678';      // ID ยศที่จะแจก
const LOG_CHANNEL_ID = '987654321098765432';      // ID ห้อง Log

client.once('ready', async () => {
    console.log(`✅ บอท ${client.user.tag} ออนไลน์!`);
    const commands = [
        { name: 'menu', description: 'เปิดเมนูรับของรางวัล (เฉพาะเจ้าของ)' },
        { name: 'clear', description: 'ลบข้อความ (เฉพาะเจ้าของ)', options: [{ name: 'amount', description: 'จำนวน', type: ApplicationCommandOptionType.Integer, required: true }] },
        { name: 'rules', description: 'ประกาศกฎระเบียบ (เฉพาะเจ้าของ)' },
        { name: 'verify', description: 'สร้างปุ่มยืนยันตัวตน (เฉพาะเจ้าของ)' }
    ];
    try { await client.application.commands.set(commands); console.log('🎉 ลงทะเบียนคำสั่งเรียบร้อย!'); } 
    catch (error) { console.error('Error:', error); }
});

client.on('interactionCreate', async (interaction) => {
    
    // ================= A: Slash Command =================
    if (interaction.isChatInputCommand()) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            // 2. เปลี่ยน ephemeral: true เป็น flags: MessageFlags.Ephemeral
            return interaction.reply({ content: '⛔ เฉพาะเจ้าของเซิร์ฟเวอร์เท่านั้น', flags: MessageFlags.Ephemeral });
        }

        if (interaction.commandName === 'verify') {
            const verifyEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🔐 Verification Required')
                .setDescription('เพื่อความปลอดภัย กรุณากดปุ่มด้านล่างและกรอกข้อมูลให้ครบถ้วนเพื่อเข้าสู่เซิร์ฟเวอร์ครับ')
                .setFooter({ text: 'กดปุ่ม Verify เพื่อเริ่มทำรายการ' });

            const verifyBtn = new ButtonBuilder()
                .setCustomId('btn_open_verify_modal')
                .setLabel('Verify / ยืนยันตัวตน')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅');

            await interaction.reply({ embeds: [verifyEmbed], components: [new ActionRowBuilder().addComponents(verifyBtn)] });
        }

        if (interaction.commandName === 'rules') {
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x0099FF).setTitle('📜 Server Rules').setDescription('กฎระเบียบ...')] });
        }
        
        if (interaction.commandName === 'menu') {
            // แก้ Warning ตรงนี้
            await interaction.reply({ content: 'เมนู (Demo)', flags: MessageFlags.Ephemeral }); 
        }
        
        if (interaction.commandName === 'clear') {
            const amount = interaction.options.getInteger('amount');
            await interaction.channel.bulkDelete(amount, true).catch(() => {});
            // แก้ Warning ตรงนี้
            await interaction.reply({ content: `ลบแล้ว ${amount}`, flags: MessageFlags.Ephemeral });
        }
    }

    // ================= B: Button (เปิดฟอร์ม) =================
    if (interaction.isButton()) {
        if (interaction.customId === 'btn_open_verify_modal') {
            const modal = new ModalBuilder().setCustomId('modal_verify_submit').setTitle('📝 แบบฟอร์มยืนยันตัวตน');

            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_name').setLabel("ชื่อเล่นของคุณคืออะไร?").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_age').setLabel("อายุเท่าไหร่?").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_reason').setLabel("เหตุผลที่เข้าเซิร์ฟเวอร์?").setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            await interaction.showModal(modal);
        }
    }

    // ================= C: Modal Submit (ส่งข้อมูล + Log) =================
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_verify_submit') {
            
            const name = interaction.fields.getTextInputValue('input_name');
            const age = interaction.fields.getTextInputValue('input_age');
            const reason = interaction.fields.getTextInputValue('input_reason');

            const role = interaction.guild.roles.cache.get(VERIFY_ROLE_ID);
            
            // แก้ Warning ตรงนี้
            if (!role) return interaction.reply({ content: '❌ Error: ไม่พบยศ Verify (เช็ค ID ในโค้ด)', flags: MessageFlags.Ephemeral });

            try {
                await interaction.member.roles.add(role);

                // แก้ Warning ตรงนี้
                await interaction.reply({
                    content: `✅ **ยืนยันตัวตนสำเร็จ!**\nยินดีต้อนรับคุณ **${name}** เข้าสู่เซิร์ฟเวอร์ครับ!`,
                    flags: MessageFlags.Ephemeral 
                });

                const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0xFFA500)
                        .setTitle('📋 มีสมาชิกใหม่ Verify!')
                        .setThumbnail(interaction.user.displayAvatarURL())
                        .addFields(
                            { name: '👤 ผู้ใช้งาน (User)', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: false },
                            { name: '📛 ชื่อที่กรอก', value: name, inline: true },
                            { name: '🎂 อายุ', value: age, inline: true },
                            { name: '📝 เหตุผลที่เข้า', value: reason, inline: false }
                        )
                        .setFooter({ text: `User ID: ${interaction.user.id}` })
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }

            } catch (error) {
                console.error(error);
                // แก้ Warning ตรงนี้
                if (!interaction.replied) await interaction.reply({ content: '❌ บอทให้ยศไม่ได้ (เช็คยศบอทว่าอยู่สูงกว่ายศ Member หรือไม่)', flags: MessageFlags.Ephemeral });
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);