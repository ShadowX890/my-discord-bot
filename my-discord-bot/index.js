require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// ส่วน Server สำหรับ Render
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
    MessageFlags 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers // จำเป็นสำหรับแจกยศ
    ]
});

// ====================================================
// ⚠️ โซนตั้งค่า (กรุณาแก้ไขเลข ID ให้ถูกต้อง)
// ====================================================
const VERIFY_ROLE_ID = '1458053861842358434';      // 1. ใส่ ID ยศที่จะแจก (เช่น Member)
const LOG_CHANNEL_ID = '1458096769761149032';      // 2. ใส่ ID ห้อง ❇️・𝐕𝐞𝐫𝐢𝐟𝐲-𝐥𝐨𝐠
// ====================================================

// --- 1. ลงทะเบียนคำสั่ง Slash Command ---
client.once('ready', async () => {
    console.log(`✅ บอท ${client.user.tag} ออนไลน์!`);

    const commands = [
        { 
            name: 'menu', 
            description: 'เปิดเมนูเลือกของรางวัล (เฉพาะเจ้าของ)' 
        },
        { 
            name: 'rules', 
            description: 'ประกาศกฎระเบียบเซิร์ฟเวอร์ (เฉพาะเจ้าของ)' 
        },
        { 
            name: 'verify', 
            description: 'สร้างปุ่มยืนยันตัวตน (เฉพาะเจ้าของ)' 
        },
        { 
            name: 'clear', 
            description: 'ลบข้อความ (เฉพาะเจ้าของ)', 
            options: [{ 
                name: 'amount', 
                description: 'จำนวนข้อความที่ต้องการลบ', 
                type: ApplicationCommandOptionType.Integer, 
                required: true 
            }] 
        }
    ];

    try { 
        console.log('⏳ กำลังลงทะเบียนคำสั่ง...');
        await client.application.commands.set(commands); 
        console.log('🎉 ลงทะเบียนคำสั่งเรียบร้อย!'); 
    } catch (error) { 
        console.error('Error Registering Commands:', error); 
    }
});

// --- 2. จัดการ Interaction ทั้งหมด ---
client.on('interactionCreate', async (interaction) => {
    
    // ==========================================
    // ส่วน A: Slash Command (/คำสั่งต่างๆ)
    // ==========================================
    if (interaction.isChatInputCommand()) {
        
        // เช็คเจ้าของเซิร์ฟเวอร์ (Security Check)
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ 
                content: '⛔ **ขออภัย!** คำสั่งนี้สำหรับเจ้าของเซิร์ฟเวอร์เท่านั้น', 
                flags: MessageFlags.Ephemeral 
            });
        }

        // --- คำสั่ง /verify ---
        if (interaction.commandName === 'verify') {
            const verifyEmbed = new EmbedBuilder()
                .setColor(0x00FF00) // สีเขียว
                .setTitle('🔐 Verification Required')
                .setDescription('เพื่อความปลอดภัย กรุณากดปุ่มด้านล่างและกรอกข้อมูลให้ครบถ้วนเพื่อเข้าสู่เซิร์ฟเวอร์ครับ')
                .setFooter({ text: 'กดปุ่ม Verify เพื่อเริ่มทำรายการ' });

            const verifyBtn = new ButtonBuilder()
                .setCustomId('btn_open_verify_modal')
                .setLabel('Verify / ยืนยันตัวตน')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅');

            const row = new ActionRowBuilder().addComponents(verifyBtn);

            await interaction.reply({ embeds: [verifyEmbed], components: [row] });
        }

        // --- คำสั่ง /rules ---
        if (interaction.commandName === 'rules') {
            const rulesEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('📜 Server Rules (กฎระเบียบ)')
                .setDescription('**กรุณาปฏิบัติตามกฎอย่างเคร่งครัด**')
                .addFields(
                    { name: '1. ห้ามใช้คำหยาบ', value: 'ห้ามพูดจาหยาบคาย ก้าวร้าว หรือดูหมิ่นผู้อื่น' },
                    { name: '2. ห้ามสแปม', value: 'ห้ามส่งข้อความซ้ำๆ หรือรบกวนผู้อื่น' },
                    { name: '3. ห้ามเนื้อหา 18+', value: 'ห้ามส่งรูปหรือข้อความลามกอนาจาร' }
                );
            await interaction.reply({ embeds: [rulesEmbed] });
        }

        // --- คำสั่ง /menu (แก้ไขให้เห็นทุกคนแล้ว) ---
        if (interaction.commandName === 'menu') {
            const menuEmbed = new EmbedBuilder().setColor(0xFFA500).setTitle('🎁 เมนูของรางวัล');
            
            const btnOpen = new ButtonBuilder().setCustomId('open_secret_menu').setLabel('เลือกของ').setStyle(ButtonStyle.Primary).setEmoji('🎁');
            const btnGuide = new ButtonBuilder().setCustomId('just_text_btn').setLabel('คู่มือ').setStyle(ButtonStyle.Secondary).setEmoji('ℹ️');
            
            const row = new ActionRowBuilder().addComponents(btnOpen, btnGuide);

            // 🚩 แก้ไขตรงนี้: ลบ flags ออก เพื่อให้ทุกคนเห็นข้อความนี้
            await interaction.reply({ embeds: [menuEmbed], components: [row] });
        }

        // --- คำสั่ง /clear ---
        if (interaction.commandName === 'clear') {
            const amount = interaction.options.getInteger('amount');
            if (amount < 1 || amount > 100) {
                return interaction.reply({ content: '❌ ลบได้ทีละ 1-100 ข้อความเท่านั้น', flags: MessageFlags.Ephemeral });
            }
            
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            try {
                await interaction.channel.bulkDelete(amount, true);
                await interaction.editReply(`🧹 ลบข้อความไปแล้ว ${amount} ข้อความ!`);
            } catch (error) {
                await interaction.editReply('❌ ลบไม่ได้ (ข้อความอาจเก่าเกิน 14 วัน)');
            }
        }
    }

    // ==========================================
    // ส่วน B: ปุ่มกด (Buttons)
    // ==========================================
    if (interaction.isButton()) {
        
        // ปุ่มเปิดฟอร์ม Verify
        if (interaction.customId === 'btn_open_verify_modal') {
            const modal = new ModalBuilder().setCustomId('modal_verify_submit').setTitle('📝 แบบฟอร์มยืนยันตัวตน');

            const inputName = new TextInputBuilder().setCustomId('input_name').setLabel("ชื่อเล่นของคุณคืออะไร?").setStyle(TextInputStyle.Short).setRequired(true);
            const inputAge = new TextInputBuilder().setCustomId('input_age').setLabel("อายุเท่าไหร่?").setStyle(TextInputStyle.Short).setRequired(true);
            const inputReason = new TextInputBuilder().setCustomId('input_reason').setLabel("เหตุผลที่เข้าเซิร์ฟเวอร์?").setStyle(TextInputStyle.Paragraph).setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(inputName),
                new ActionRowBuilder().addComponents(inputAge),
                new ActionRowBuilder().addComponents(inputReason)
            );
            await interaction.showModal(modal);
        }

        // ปุ่มเมนูของรางวัล (จากคำสั่ง /menu)
        if (interaction.customId === 'open_secret_menu') {
            const select = new StringSelectMenuBuilder()
                .setCustomId('select_item')
                .setPlaceholder('🔻 เลือกไอเทมที่ต้องการ...')
                .addOptions(
                    new StringSelectMenuOptionBuilder().setLabel('ดาบ').setValue('sword').setEmoji('⚔️'),
                    new StringSelectMenuOptionBuilder().setLabel('โล่').setValue('shield').setEmoji('🛡️'),
                    new StringSelectMenuOptionBuilder().setLabel('ยา').setValue('potion').setEmoji('🧪')
                );
            await interaction.reply({ components: [new ActionRowBuilder().addComponents(select)], flags: MessageFlags.Ephemeral });
        }

        // ปุ่มคู่มือ
        if (interaction.customId === 'just_text_btn') {
            await interaction.reply({ content: 'ℹ️ คู่มือ: กดปุ่มเพื่อเลือกของรางวัล (ข้อความนี้จะหายใน 5 วิ)', flags: MessageFlags.Ephemeral });
            setTimeout(() => interaction.deleteReply().catch(()=>{}), 5000);
        }
    }

    // ==========================================
    // ส่วน C: ส่งฟอร์ม (Modal Submit) - ระบบ Verify
    // ==========================================
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_verify_submit') {
            
            // 1. ดึงข้อมูลจากฟอร์ม
            const name = interaction.fields.getTextInputValue('input_name');
            const age = interaction.fields.getTextInputValue('input_age');
            const reason = interaction.fields.getTextInputValue('input_reason');

            // 2. หายศและห้อง Log
            const role = interaction.guild.roles.cache.get(VERIFY_ROLE_ID);
            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

            if (!role) {
                return interaction.reply({ content: '❌ ไม่พบยศ Verify (กรุณาเช็ค ID ในโค้ด)', flags: MessageFlags.Ephemeral });
            }

            try {
                // ให้ยศ
                await interaction.member.roles.add(role);

                // ตอบกลับ User
                await interaction.reply({ 
                    content: `✅ **ยืนยันตัวตนสำเร็จ!**\nยินดีต้อนรับคุณ **${name}** เข้าสู่เซิร์ฟเวอร์ครับ!`, 
                    flags: MessageFlags.Ephemeral 
                });

                // ส่ง Log เข้าห้องแอดมิน
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0xFFA500) // สีส้ม
                        .setTitle('📋 มีสมาชิกใหม่ Verify!')
                        .setThumbnail(interaction.user.displayAvatarURL())
                        .addFields(
                            { name: '👤 ผู้ใช้งาน', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: false },
                            { name: '📛 ชื่อ', value: name, inline: true },
                            { name: '🎂 อายุ', value: age, inline: true },
                            { name: '📝 เหตุผล', value: reason, inline: false }
                        )
                        .setFooter({ text: `User ID: ${interaction.user.id}` })
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }

            } catch (error) {
                console.error('Verify Error:', error);
                if (!interaction.replied) {
                    await interaction.reply({ content: '❌ เกิดข้อผิดพลาด: บอทอาจจะยศต่ำกว่ายศที่จะแจก', flags: MessageFlags.Ephemeral });
                }
            }
        }
    }

    // ==========================================
    // ส่วน D: เลือกเมนู (Select Menu)
    // ==========================================
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_item') {
        const val = interaction.values[0];
        let text = '';
        if (val === 'sword') text = 'คุณได้รับ ⚔️ **ดาบผู้กล้า**!';
        if (val === 'shield') text = 'คุณได้รับ 🛡️ **โล่พิทักษ์**!';
        if (val === 'potion') text = 'คุณได้รับ 🧪 **ยาเพิ่มเลือด**!';
        
        await interaction.update({ content: text, components: [], embeds: [] });
    }
});

client.login(process.env.DISCORD_TOKEN);