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
    ModalBuilder,       // <--- เพิ่มตัวสร้างฟอร์ม
    TextInputBuilder,   // <--- เพิ่มช่องกรอกข้อความ
    TextInputStyle      // <--- เพิ่มรูปแบบช่องข้อความ
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] // เพิ่ม GuildMembers เผื่อไว้แจกยศ
});

// 🔥 ตั้งค่า ID ยศที่จะแจกตรงนี้ (อย่าลืมเปลี่ยนนะครับ!)
const VERIFY_ROLE_ID = '1458053861842358434'; 

// --- 1. ลงทะเบียนคำสั่ง ---
client.once('ready', async () => {
    console.log(`✅ บอท ${client.user.tag} ออนไลน์!`);
    const commands = [
        { name: 'menu', description: 'เปิดเมนูรับของรางวัล (เฉพาะเจ้าของ)' },
        { name: 'clear', description: 'ลบข้อความ (เฉพาะเจ้าของ)', options: [{ name: 'amount', description: 'จำนวน', type: ApplicationCommandOptionType.Integer, required: true }] },
        { name: 'rules', description: 'ประกาศกฎระเบียบ (เฉพาะเจ้าของ)' },
        { name: 'verify', description: 'สร้างปุ่มยืนยันตัวตน (เฉพาะเจ้าของ)' } // <--- เพิ่มคำสั่งนี้
    ];
    try { await client.application.commands.set(commands); console.log('🎉 ลงทะเบียนคำสั่งเรียบร้อย!'); } 
    catch (error) { console.error('Error:', error); }
});

// --- 2. จัดการ Interaction ---
client.on('interactionCreate', async (interaction) => {
    
    // ==========================================
    // ส่วน A: จัดการ Slash Command
    // ==========================================
    if (interaction.isChatInputCommand()) {
        
        // เช็คความเป็นเจ้าของ (ใช้ได้กับทุกคำสั่งในนี้)
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: '⛔ เฉพาะเจ้าของเซิร์ฟเวอร์เท่านั้น', ephemeral: true });
        }

        // --- คำสั่ง /verify (สร้างปุ่ม) ---
        if (interaction.commandName === 'verify') {
            const verifyEmbed = new EmbedBuilder()
                .setColor(0x00FF00) // สีเขียว
                .setTitle('🔐 Verification Required')
                .setDescription('เพื่อความปลอดภัย กรุณากดปุ่มด้านล่างและกรอกข้อมูลให้ครบถ้วนเพื่อเข้าสู่เซิร์ฟเวอร์ครับ')
                .setFooter({ text: 'กดปุ่ม Verify เพื่อเริ่มทำรายการ' });

            const verifyBtn = new ButtonBuilder()
                .setCustomId('btn_open_verify_modal') // ID ปุ่ม
                .setLabel('Verify / ยืนยันตัวตน')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅');

            const row = new ActionRowBuilder().addComponents(verifyBtn);

            await interaction.reply({ embeds: [verifyEmbed], components: [row] });
        }

        // ... (คำสั่ง rules, menu, clear ของเดิม ปล่อยไว้เหมือนเดิมได้เลย) ...
        if (interaction.commandName === 'rules') {
            const rulesEmbed = new EmbedBuilder().setColor(0x0099FF).setTitle('📜 Server Rules').setDescription('กรุณาปฏิบัติตามกฎระเบียบ');
            await interaction.reply({ embeds: [rulesEmbed] });
        }
        if (interaction.commandName === 'menu') {
             // ... โค้ด menu เดิม ...
             await interaction.reply({ content: 'เมนูมาแล้ว', ephemeral: true });
        }
        if (interaction.commandName === 'clear') {
             // ... โค้ด clear เดิม ...
             const amount = interaction.options.getInteger('amount');
             await interaction.channel.bulkDelete(amount, true).catch(() => {});
             await interaction.reply({ content: `ลบแล้ว ${amount}`, ephemeral: true });
        }
    }

    // ==========================================
    // ส่วน B: จัดการปุ่มกด (Button)
    // ==========================================
    if (interaction.isButton()) {
        
        // เมื่อกดปุ่ม Verify ให้เด้ง Modal (ฟอร์ม) ขึ้นมา
        if (interaction.customId === 'btn_open_verify_modal') {
            
            const modal = new ModalBuilder()
                .setCustomId('modal_verify_submit') // ID ของฟอร์มนี้
                .setTitle('📝 แบบฟอร์มยืนยันตัวตน');

            // ช่องที่ 1: ชื่อ
            const nameInput = new TextInputBuilder()
                .setCustomId('input_name')
                .setLabel("ชื่อเล่นของคุณคืออะไร?")
                .setStyle(TextInputStyle.Short) // ช่องสั้น
                .setRequired(true); // บังคับกรอก

            // ช่องที่ 2: อายุ
            const ageInput = new TextInputBuilder()
                .setCustomId('input_age')
                .setLabel("อายุเท่าไหร่?")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            // ช่องที่ 3: เหตุผล
            const reasonInput = new TextInputBuilder()
                .setCustomId('input_reason')
                .setLabel("เหตุผลที่เข้าเซิร์ฟเวอร์?")
                .setStyle(TextInputStyle.Paragraph) // ช่องใหญ่ เขียนยาวได้
                .setRequired(true);

            // เอาช่องใส่เข้าไปในแถว (Discord บังคับ 1 ช่อง ต่อ 1 แถว)
            const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
            const secondActionRow = new ActionRowBuilder().addComponents(ageInput);
            const thirdActionRow = new ActionRowBuilder().addComponents(reasonInput);

            // ใส่แถวเข้า Modal
            modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

            // สั่งให้เด้งขึ้นมา
            await interaction.showModal(modal);
        }

        // ... (ปุ่มอื่นๆ ของ menu เดิม) ...
    }

    // ==========================================
    // ส่วน C: จัดการเมื่อส่งฟอร์ม (Modal Submit)
    // ==========================================
    if (interaction.isModalSubmit()) {
        
        // เช็คว่าเป็นฟอร์ม verify หรือไม่
        if (interaction.customId === 'modal_verify_submit') {
            
            // ดึงข้อมูลที่เขากรอกมา (เผื่อเอาไปใช้ Log ในอนาคต)
            const name = interaction.fields.getTextInputValue('input_name');
            const age = interaction.fields.getTextInputValue('input_age');
            const reason = interaction.fields.getTextInputValue('input_reason');

            // ให้ยศ (Add Role)
            const role = interaction.guild.roles.cache.get(VERIFY_ROLE_ID);
            
            if (!role) {
                return interaction.reply({ content: '❌ ไม่พบยศที่กำหนด (กรุณาแจ้งแอดมินให้ตั้งค่า Role ID)', ephemeral: true });
            }

            try {
                // ให้ยศคนกด
                await interaction.member.roles.add(role);
                
                // ตอบกลับเฉพาะคนกด
                await interaction.reply({
                    content: `✅ **ยืนยันตัวตนสำเร็จ!**\nยินดีต้อนรับคุณ **${name}** (อายุ ${age})\nเข้าสู่เซิร์ฟเวอร์ครับ! #❇️・𝐕𝐞𝐫𝐢𝐟𝐲-𝐥𝐨𝐠`,
                    ephemeral: true 
                });

                // (Option) ถ้าอยากให้ส่ง Log ไปห้องแอดมินด้วย เพิ่มโค้ดตรงนี้ได้ครับ

            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ บอทไม่สามารถให้ยศได้ (โปรดเช็คว่ายศบอทอยู่สูงกว่ายศที่จะแจกหรือไม่)', ephemeral: true });
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);