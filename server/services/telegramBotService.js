import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { pool } from '../utils/dbUtils.js';
import bcrypt from 'bcrypt';
import { runAiAgent } from './aiAgentService.js';
import { generateGroupExcelBuffer } from '../utils/excelGenerator.js';
import { processReceiptImage } from './receiptService.js';
import moment from 'moment';
import axios from 'axios';

let bot;
const pendingInputs = new Map();
let botUsernameCache = null;
let userTableColumnsCache = null;
const DEFAULT_WEB_APP_URL = 'https://tinynotie.vercel.app';

const getPendingInput = (telegramUserId) => pendingInputs.get(telegramUserId);
const setPendingInput = (telegramUserId, state) => pendingInputs.set(telegramUserId, {
    ...state,
    expiresAt: Date.now() + (state.ttlMs || 10 * 60 * 1000),
});
const clearPendingInput = (telegramUserId) => pendingInputs.delete(telegramUserId);

const getWebAppBaseUrl = () => {
    const configured =
        process.env.WEB_APP_URL ||
        process.env.CLIENT_APP_URL ||
        process.env.FRONTEND_URL ||
        process.env.SITE_URL ||
        process.env.NEXT_PUBLIC_WEB_APP_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        DEFAULT_WEB_APP_URL;

    const cleaned = String(configured || '').trim().replace(/\/+$/, '');

    // Guard against accidentally using API domains for website links.
    if (/tinynotie-api|\/bot\b|\/api\b/i.test(cleaned)) {
        return DEFAULT_WEB_APP_URL;
    }

    return cleaned || DEFAULT_WEB_APP_URL;
};

const getTelegramCommandGuideUrl = () => `${getWebAppBaseUrl()}/help/telegram-commands`;

const getUserTableColumns = async () => {
    if (userTableColumnsCache) return userTableColumnsCache;

    const { rows } = await pool.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'user_infm'`
    );

    userTableColumnsCache = new Set(rows.map((row) => row.column_name));
    return userTableColumnsCache;
};

const enrichUserFromTelegramProfile = async ({ userId, tgUser, chatId }) => {
    try {
        const columns = await getUserTableColumns();
        const updates = [];
        const values = [];

        if (columns.has('first_name') && tgUser?.first_name) {
            values.push(String(tgUser.first_name).slice(0, 100));
            updates.push(`first_name = $${values.length}`);
        }

        if (columns.has('last_name') && tgUser?.last_name) {
            values.push(String(tgUser.last_name).slice(0, 100));
            updates.push(`last_name = $${values.length}`);
        }

        if (columns.has('telegram_chat_id') && Number.isFinite(Number(chatId))) {
            values.push(Number(chatId));
            updates.push(`telegram_chat_id = $${values.length}`);
        }

        if (updates.length === 0) return;

        values.push(userId);
        await pool.query(`UPDATE user_infm SET ${updates.join(', ')} WHERE id = $${values.length}`, values);
    } catch (err) {
        // Profile enrichment is best-effort and should not block registration.
        console.warn('Telegram profile enrichment skipped:', err.message);
    }
};

/**
 * Initialize the Telegram Bot with webhook mode
 */
export const initTelegramBot = (token) => {
    if (!token) {
        console.error('TELEGRAM_BOT_TOKEN is missing');
        return;
    }

    // Initialize Telegraf without launching (no polling)
    bot = new Telegraf(token);

    // Middleware to attach TinyNotie user info to ctx
    bot.use(async (ctx, next) => {
        if (!ctx.from) return next();

        try {
            const { rows } = await pool.query(
                'SELECT id, usernm FROM user_infm WHERE telegram_id = $1',
                [ctx.from.id]
            );

            if (rows.length > 0) {
                ctx.user = rows[0];
            }
        } catch (err) {
            console.error('Error in Telegram middleware:', err);
        }
        return next();
    });

    const getBotUsername = async () => {
        if (botUsernameCache) return botUsernameCache;
        try {
            const me = await bot.telegram.getMe();
            botUsernameCache = (me.username || '').toLowerCase();
            return botUsernameCache;
        } catch {
            return '';
        }
    };

    const isGroupChat = (ctx) => ['group', 'supergroup'].includes(ctx.chat?.type);

    const isTriggeredForBotInGroup = async (ctx, text = '') => {
        if (!isGroupChat(ctx)) return true;

        const lower = (text || '').toLowerCase();
        const username = await getBotUsername();
        const mention = username ? `@${username}` : null;

        const isReplyToBot = !!ctx.message?.reply_to_message?.from?.is_bot;
        const hasMention = mention ? lower.includes(mention) : false;

        return isReplyToBot || hasMention;
    };

    const stripBotMention = async (text = '') => {
        const raw = String(text || '');
        const username = await getBotUsername();
        if (!username) return raw.trim();
        const mentionRegex = new RegExp(`@${username}\\b`, 'ig');
        return raw.replace(mentionRegex, '').replace(/\s{2,}/g, ' ').trim();
    };

    const resolveGroupContext = async ({ chatId, chatType, userId }) => {
        const result = {
            groupId: null,
            groupName: null,
            linkedInCurrentChat: false,
            hasAnyAccessibleGroup: false,
        };

        try {
            const { rows: linkedRows } = await pool.query(
                'SELECT id, grp_name FROM grp_infm WHERE telegram_chat_id = $1 LIMIT 1',
                [chatId]
            );

            if (linkedRows.length > 0) {
                result.groupId = linkedRows[0].id;
                result.groupName = linkedRows[0].grp_name || `Group ${linkedRows[0].id}`;
                result.linkedInCurrentChat = true;
                result.hasAnyAccessibleGroup = true;
                return result;
            }

            if (chatType === 'private' && userId) {
                const { rows: personalGroups } = await pool.query(
                    `SELECT g.id, g.grp_name FROM grp_infm g
                     LEFT JOIN grp_users gu ON gu.group_id = g.id
                     WHERE g.admin_id = $1 OR gu.user_id = $1
                     ORDER BY g.create_date DESC
                     LIMIT 1`,
                    [userId]
                );

                if (personalGroups.length > 0) {
                    result.groupId = personalGroups[0].id;
                    result.groupName = personalGroups[0].grp_name || `Group ${personalGroups[0].id}`;
                    result.hasAnyAccessibleGroup = true;
                }
            }

            return result;
        } catch {
            return result;
        }
    };

    const readCommandArg = (ctx) => (ctx.message?.text || '').split(' ').slice(1).join(' ').trim();

    const sanitizeUsername = (raw, fallbackId) => {
        const base = (raw || `tg_${fallbackId}`)
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .slice(0, 40);
        return base || `tg_${fallbackId}`;
    };

    const buildTelegramBasedUsername = (tgUser = {}) => {
        const usernameFromHandle = sanitizeUsername(tgUser.username || '', tgUser.id);
        if (usernameFromHandle && !usernameFromHandle.startsWith('tg_')) {
            return usernameFromHandle;
        }

        const first = sanitizeUsername(tgUser.first_name || '', tgUser.id).replace(/^tg_\d+$/, '');
        const last = sanitizeUsername(tgUser.last_name || '', tgUser.id).replace(/^tg_\d+$/, '');
        const nameCombo = [first, last].filter(Boolean).join('_').slice(0, 40);
        if (nameCombo) return sanitizeUsername(nameCombo, tgUser.id);

        return `tg_${tgUser.id}`;
    };

    const resolveUniqueTelegramUsername = async (tgUser = {}) => {
        const base = buildTelegramBasedUsername(tgUser);
        let candidate = base;

        for (let i = 0; i < 1000; i++) {
            const { rows } = await pool.query('SELECT 1 FROM user_infm WHERE usernm = $1 LIMIT 1', [candidate]);
            if (rows.length === 0) return candidate;
            candidate = `${base.slice(0, 34)}_${i + 2}`;
        }

        return `${base.slice(0, 30)}_${Date.now().toString().slice(-6)}`;
    };

    const formatAccountInfoMessage = ({ usernm, tgUser }) => {
        const tgHandle = tgUser?.username ? `@${tgUser.username}` : 'not set';
        const tgId = tgUser?.id || 'N/A';
        return (
            `✅ Registration successful!\n\n` +
            `Your TinyNotie Account Info\n` +
            `• Account ID: ${usernm}\n` +
            `• Telegram Username: ${tgHandle}\n` +
            `• Telegram ID: ${tgId}\n\n` +
            `ℹ️ We auto-use your Telegram username as your account ID (with a safe suffix if needed) so it stays unique.\n` +
            `Use this Account ID + your password to login in the app.`
        );
    };

    const ensurePrivateLinkedUser = (ctx) => {
        if (!ctx.user && ctx.chat?.type === 'private') {
            ctx.reply('❌ You are not registered yet. Use /register to create your TinyNotie account via Telegram.');
            return false;
        }
        return true;
    };

    const normalizeYesNo = (text = '') => String(text || '').trim().toLowerCase();

    const normalizeCurrency = (text = '') => {
        const value = String(text || '').trim().toUpperCase();
        if (!value) return null;
        if (value.length > 10) return null;
        return value;
    };

    const getTelegramDisplayName = (tgUser = {}) => {
        const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ').trim();
        if (fullName) return fullName;
        if (tgUser.username) return `@${tgUser.username}`;
        return `Telegram User ${tgUser.id || ''}`.trim();
    };

    const findCreateGroupConflict = async ({ chatId, groupName, userId }) => {
        const sql = `
            SELECT id, grp_name, admin_id, telegram_chat_id
            FROM grp_infm
            WHERE telegram_chat_id = $1
               OR (LOWER(TRIM(grp_name)) = LOWER(TRIM($2)) AND admin_id <> $3)
            ORDER BY CASE WHEN telegram_chat_id = $1 THEN 0 ELSE 1 END, id ASC
            LIMIT 1;
        `;
        const { rows } = await pool.query(sql, [chatId, groupName, userId]);
        return rows[0] || null;
    };

    const createGroupFromTelegramChat = async ({ chatId, groupName, userId, currency = 'W', ctx, autoImportMembers = false }) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const createDate = moment().format('YYYY-MM-DD HH:mm:ss');

            const insertGroupSql = `
                INSERT INTO grp_infm (grp_name, admin_id, telegram_chat_id, currency, create_date)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id;
            `;
            const { rows } = await client.query(insertGroupSql, [groupName, userId, chatId, currency || 'W', createDate]);
            const groupId = rows[0].id;

            let importedCount = 0;
            if (autoImportMembers) {
                const admins = await ctx.telegram.getChatAdministrators(chatId);
                const rawNames = admins.map((admin) => getTelegramDisplayName(admin.user));

                // Ensure the command sender is included.
                rawNames.push(getTelegramDisplayName(ctx.from));

                const uniqueNames = [...new Set(rawNames.map((name) => String(name).trim()).filter(Boolean))].slice(0, 100);

                for (const memName of uniqueNames) {
                    await client.query(
                        'INSERT INTO member_infm (mem_name, group_id, paid) VALUES ($1, $2, 0)',
                        [memName.slice(0, 50), groupId]
                    );
                    importedCount++;
                }
            }

            await client.query('COMMIT');
            return { groupId, importedCount };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    };

    // /start command - handles deep linking for account linking
    bot.start(async (ctx) => {
        const payloadFromStart = ctx.startPayload; // Preferred, when available
        const text = ctx.message?.text || '';
        const payloadFromText = text.startsWith('/start ') ? text.replace('/start ', '').trim() : '';
        const payload = payloadFromStart || payloadFromText;

        if (payload && payload.startsWith('link_')) {
            const code = payload.replace('link_', '');

            try {
                const { rows } = await pool.query(
                    'SELECT user_id FROM telegram_links WHERE code = $1 AND expires_at > NOW()',
                    [code]
                );

                if (rows.length > 0) {
                    const userId = rows[0].user_id;

                    await pool.query(
                        'UPDATE user_infm SET telegram_id = $1 WHERE id = $2',
                        [ctx.from.id, userId]
                    );

                    await pool.query('DELETE FROM telegram_links WHERE code = $1', [code]);

                    return ctx.reply('✅ Success! Your TinyNotie account is now linked to Telegram.');
                } else {
                    return ctx.reply('❌ Invalid or expired linking code. Please generate a new one from the app.');
                }
            } catch (err) {
                console.error('Link error:', err);
                return ctx.reply('❌ An error occurred during linking.');
            }
        }

        await ctx.reply(
            `👋 Welcome to TinyNotie Assistant!\n\nI can help you manage your group expenses, members, and trips directly from Telegram.\n\n${ctx.user
                ? `Logged in as: *${ctx.user.usernm}*`
                : 'To get started, register directly here by sending /register'
            }\n\n*Available Commands:*\n/register - Create account via Telegram\n/reset_password - Change your account password\n/link_group - Link this chat to a group\n/chat_id - Get current chat ID\n/create_group - Create a new group\n/add_member - Add member to group\n/sync_members - Sync visible Telegram members\n/export - Get Excel report\n/status - Group summary\n/guideline - Open full command guide page`,
            { parse_mode: 'Markdown' }
        );

        return ctx.reply(
            `📘 *Command Guideline*\nOpen full guide: [TinyNotie Telegram Command Guide](${getTelegramCommandGuideUrl()})\n\nUse /guideline anytime to open this page again.`,
            { parse_mode: 'Markdown', disable_web_page_preview: true }
        );
    });

    // /guideline command - quick access to the command guide page
    bot.command('guideline', async (ctx) => {
        return ctx.reply(
            `📘 *TinyNotie Command Guideline*\nOpen full guide: [TinyNotie Telegram Command Guide](${getTelegramCommandGuideUrl()})\n\nThis page explains what each command does and when to use it.`,
            { parse_mode: 'Markdown', disable_web_page_preview: true }
        );
    });

    // /register command - conversational account creation
    bot.command('register', async (ctx) => {
        if (!ctx.from) return;

        try {
            const existingByTelegram = await pool.query(
                'SELECT id, usernm FROM user_infm WHERE telegram_id = $1',
                [ctx.from.id]
            );

            if (existingByTelegram.rows.length > 0) {
                return ctx.reply(
                    `✅ This Telegram is already linked.\n\n` +
                    `Your TinyNotie Account Info\n` +
                    `• Account ID: ${existingByTelegram.rows[0].usernm}\n` +
                    `• Telegram Username: ${ctx.from.username ? `@${ctx.from.username}` : 'not set'}\n` +
                    `• Telegram ID: ${ctx.from.id}\n\n` +
                    `Use /reset_password if you want a new password.`
                );
            }

            const autoUsername = await resolveUniqueTelegramUsername(ctx.from);
            setPendingInput(ctx.from.id, {
                type: 'register_password',
                username: autoUsername,
                source: 'telegram_auto_username',
            });

            return ctx.reply(
                `🆔 Your Account ID is auto-generated from Telegram and reserved as: ${autoUsername}\n` +
                `Now send your password in the next message (min 6 characters).`
            );
        } catch (err) {
            console.error('Telegram register error:', err);
            return ctx.reply('❌ Failed to initialize registration. Please try again.');
        }
    });

    // /reset_password command - conversational password reset for linked users
    bot.command('reset_password', async (ctx) => {
        if (!ctx.from) return;

        try {
            const existingByTelegram = await pool.query(
                'SELECT id, usernm FROM user_infm WHERE telegram_id = $1',
                [ctx.from.id]
            );

            if (existingByTelegram.rows.length === 0) {
                return ctx.reply('❌ No linked account found for this Telegram. Please /register first.');
            }

            const pwd = readCommandArg(ctx);
            if (pwd) {
                if (pwd.length < 6) return ctx.reply('❌ Password must be at least 6 characters.');
                const hashed = await bcrypt.hash(pwd, 10);
                await pool.query('UPDATE user_infm SET passwd = $1 WHERE telegram_id = $2', [hashed, ctx.from.id]);
                return ctx.reply('✅ Password updated successfully.');
            }

            setPendingInput(ctx.from.id, { type: 'reset_password' });
            return ctx.reply('🔐 Send your new password in your next message (min 6 characters).');
        } catch (err) {
            console.error('Telegram reset password error:', err);
            return ctx.reply('❌ Failed to reset password. Please try again.');
        }
    });

    // /password command kept for backward compatibility
    bot.command('password', async (ctx) => {
        if (!ctx.from) return;
        const pwd = readCommandArg(ctx);
        const pending = getPendingInput(ctx.from.id);
        if (!pwd) return ctx.reply('Use /reset_password then send your password in the next message.');

        if (pending?.type === 'register_password') {
            if (pwd.length < 6) return ctx.reply('❌ Password must be at least 6 characters.');
            try {
                const usernameTaken = await pool.query('SELECT 1 FROM user_infm WHERE usernm = $1', [pending.username]);
                const resolvedUsername = usernameTaken.rows.length > 0
                    ? await resolveUniqueTelegramUsername(ctx.from)
                    : pending.username;

                const hashed = await bcrypt.hash(pwd, 10);
                const insert = await pool.query(
                    'INSERT INTO user_infm (usernm, passwd, telegram_id) VALUES ($1, $2, $3) RETURNING id, usernm',
                    [resolvedUsername, hashed, ctx.from.id]
                );

                await enrichUserFromTelegramProfile({
                    userId: insert.rows[0].id,
                    tgUser: ctx.from,
                    chatId: ctx.chat?.id,
                });

                clearPendingInput(ctx.from.id);
                return ctx.reply(formatAccountInfoMessage({ usernm: insert.rows[0].usernm, tgUser: ctx.from }));
            } catch (err) {
                console.error('Telegram password/register finalize error:', err);
                return ctx.reply('❌ Failed to complete registration. Please try /register again.');
            }
        }

        try {
            const existingByTelegram = await pool.query('SELECT id FROM user_infm WHERE telegram_id = $1', [ctx.from.id]);
            if (existingByTelegram.rows.length === 0) {
                return ctx.reply('❌ No linked account found. Use /register first.');
            }
            if (pwd.length < 6) return ctx.reply('❌ Password must be at least 6 characters.');
            const hashed = await bcrypt.hash(pwd, 10);
            await pool.query('UPDATE user_infm SET passwd = $1 WHERE telegram_id = $2', [hashed, ctx.from.id]);
            return ctx.reply('✅ Password updated successfully.');
        } catch (err) {
            console.error('Telegram password update error:', err);
            return ctx.reply('❌ Failed to update password.');
        }
    });

    // /chat_id command - helps users discover the current Telegram chat ID
    bot.command('chat_id', async (ctx) => {
        const chatTitle = ctx.chat?.title || ctx.chat?.username || 'this chat';
        return ctx.reply(
            `🆔 Chat ID for *${chatTitle}*: \`${ctx.chat.id}\`\n\nUse this ID in TinyNotie to link Telegram group chat.`,
            { parse_mode: 'Markdown' }
        );
    });

    // /link_group command - links a Telegram chat (group) to a TinyNotie group
    bot.command('link_group', async (ctx) => {
        if (!ctx.user) return ctx.reply('Please link your account first via private message to the bot.');
        if (ctx.chat.type === 'private') return ctx.reply('Please use this command inside a Telegram group.');

        const argText = readCommandArg(ctx);
        if (!argText) {
            setPendingInput(ctx.from.id, { type: 'link_group_id', chatId: ctx.chat.id });
            return ctx.reply('Send the TinyNotie group ID you want to link in your next message.');
        }

        const groupId = parseInt(argText, 10);
        if (!Number.isFinite(groupId)) return ctx.reply('❌ Invalid group ID. Please send a numeric group ID.');

        try {
            const conflictSql = `
                SELECT id, admin_id
                FROM grp_infm
                WHERE telegram_chat_id = $1
                  AND id <> $2
                LIMIT 1;
            `;
            const { rows: conflicts } = await pool.query(conflictSql, [ctx.chat.id, groupId]);
            if (conflicts.length > 0 && conflicts[0].admin_id !== ctx.user.id) {
                return ctx.reply('❌ This Telegram chat is already linked by another TinyNotie owner. Ask them to unlink it first.');
            }

            // Verification: is user owner or member?
            const { rows: accessCheck } = await pool.query(
                'SELECT 1 FROM grp_infm g LEFT JOIN grp_users gu ON g.id = gu.group_id WHERE g.id = $1 AND (g.admin_id = $2 OR gu.user_id = $2)',
                [groupId, ctx.user.id]
            );

            if (accessCheck.length === 0) {
                return ctx.reply('❌ You do not have permission to link this group or the group does not exist.');
            }

            await pool.query(
                'UPDATE grp_infm SET telegram_chat_id = $1 WHERE id = $2',
                [ctx.chat.id, groupId]
            );

            ctx.reply(`✅ Success! This Telegram group is now linked to TinyNotie group: *${groupId}*`, { parse_mode: 'Markdown' });
        } catch (err) {
            console.error('Link group error:', err);
            ctx.reply('❌ Failed to link group.');
        }
    });

    // /create_group command
    bot.command('create_group', async (ctx) => {
        if (!ctx.user) return ctx.reply('Please link your account first.');

        const isGroup = isGroupChat(ctx);
        const grpNameArg = readCommandArg(ctx);
        const chatTitle = (ctx.chat?.title || '').trim();
        const grpName = isGroup ? (chatTitle || `Telegram Group ${ctx.chat.id}`) : (grpNameArg || `TG Group ${ctx.chat.id}`);

        try {
            const conflict = await findCreateGroupConflict({
                chatId: ctx.chat.id,
                groupName: grpName,
                userId: ctx.user.id,
            });

            if (conflict && conflict.admin_id !== ctx.user.id) {
                return ctx.reply('❌ Cannot create group. This Telegram chat or group name is already owned/linked by another TinyNotie user. They must unlink first.');
            }

            if (conflict && conflict.admin_id === ctx.user.id && conflict.telegram_chat_id === ctx.chat.id) {
                return ctx.reply(`ℹ️ This Telegram chat is already linked to your group *${conflict.grp_name}* (ID: \`${conflict.id}\`).`, { parse_mode: 'Markdown' });
            }

            if (isGroup) {
                setPendingInput(ctx.from.id, {
                    type: 'create_group_currency',
                    chatId: ctx.chat.id,
                    groupName: grpName,
                    askImportMembers: true,
                });

                return ctx.reply(
                    `🆕 Group name will be set to this Telegram title: *${grpName}*\n\n` +
                    `Please send the currency code/symbol for this group (example: *USD*, *THB*, *W*).`,
                    { parse_mode: 'Markdown' }
                );
            }

            if (!grpNameArg) {
                setPendingInput(ctx.from.id, { type: 'create_group_name', chatId: ctx.chat.id });
                return ctx.reply('Send the new group name in your next message.');
            }

            setPendingInput(ctx.from.id, {
                type: 'create_group_currency',
                chatId: ctx.chat.id,
                groupName: grpName,
                askImportMembers: false,
            });
            return ctx.reply('Please send the currency code/symbol for this group (example: USD, THB, W).');
        } catch (err) {
            console.error('Create group TG error:', err);
            ctx.reply('❌ Failed to create group.');
        }
    });

    // /add_member command
    bot.command('add_member', async (ctx) => {
        if (!ctx.user) return ctx.reply('Please link your account first.');
        const memName = readCommandArg(ctx);

        if (!memName) {
            setPendingInput(ctx.from.id, { type: 'add_member_name', chatId: ctx.chat.id });
            return ctx.reply('Send the member name in your next message.');
        }

        try {
            // Find linked group for this chat
            const { rows: groups } = await pool.query('SELECT id FROM grp_infm WHERE telegram_chat_id = $1', [ctx.chat.id]);
            if (groups.length === 0) return ctx.reply('❌ This chat is not linked to any group. Use /link_group first.');

            const groupId = groups[0].id;
            await pool.query('INSERT INTO member_infm (mem_name, group_id, paid) VALUES ($1, $2, 0)', [memName, groupId]);
            ctx.reply(`✅ Member *${memName}* added to the group!`, { parse_mode: 'Markdown' });
        } catch (err) {
            console.error('Add member TG error:', err);
            ctx.reply('❌ Failed to add member.');
        }
    });

    bot.command('join', async (ctx) => {
        try {
            // 1️⃣ Ensure command is used in group
            if (ctx.chat.type === 'private') {
                return ctx.reply("Please use /join inside the group chat.");
            }

            const name = getTelegramDisplayName(ctx.from);

            // 2️⃣ Check if this Telegram group is linked
            const { rows: groups } = await pool.query(
                `SELECT id, grp_name 
                FROM grp_infm 
                WHERE telegram_chat_id = $1 
                LIMIT 1`,
                [ctx.chat.id]
            );

            if (groups.length === 0) {
                return ctx.reply("This Telegram group is not linked to TinyNotie yet.\nAsk the admin to run /link_group.");
            }

            const group = groups[0];

            // 3️⃣ Insert member
            const result = await pool.query(
                `INSERT INTO member_infm (mem_name, group_id, paid)
                    VALUES ($1,$2,0)
                    ON CONFLICT (group_id, mem_name) DO NOTHING
                    RETURNING id`,
                [name, group.id]
            );

            // 4️⃣ Check if inserted
            if (result.rowCount === 0) {
                return ctx.reply(
                    `ℹ️ *${name}*, you are already in *${group.grp_name}*.`,
                    { parse_mode: "Markdown" }
                );
            }

            // 5️⃣ Success message
            return ctx.reply(
                `✅ *${name}* joined *${group.grp_name}* successfully!`,
                { parse_mode: "Markdown" }
            );

        } catch (err) {
            console.error("Join command error:", err);
            return ctx.reply("❌ Failed to join the group. Please try again later.");
        }
    });

    // /sync_members command - sync visible Telegram users into linked TinyNotie group
    bot.command('sync_members', async (ctx) => {
        if (!ctx.user) return ctx.reply('Please link your account first.');
        if (!isGroupChat(ctx)) return ctx.reply('Please use this command inside a Telegram group chat.');

        try {
            const { rows: linkedGroups } = await pool.query(
                'SELECT id, grp_name, admin_id FROM grp_infm WHERE telegram_chat_id = $1 LIMIT 1',
                [ctx.chat.id]
            );

            if (linkedGroups.length === 0) {
                return ctx.reply('❌ This chat is not linked to any TinyNotie group. Use /link_group first.');
            }

            const linkedGroup = linkedGroups[0];

            const { rows: accessCheck } = await pool.query(
                'SELECT 1 FROM grp_infm g LEFT JOIN grp_users gu ON g.id = gu.group_id WHERE g.id = $1 AND (g.admin_id = $2 OR gu.user_id = $2)',
                [linkedGroup.id, ctx.user.id]
            );

            if (accessCheck.length === 0) {
                return ctx.reply('❌ You do not have permission to sync members for this linked group.');
            }

            await ctx.reply('⏳ Syncing visible Telegram members into TinyNotie group...');

            const adminMembers = await ctx.telegram.getChatAdministrators(ctx.chat.id);
            const candidateNames = new Set();

            adminMembers.forEach((admin) => {
                const displayName = getTelegramDisplayName(admin.user);
                if (displayName) candidateNames.add(displayName);
            });

            // Include command sender and replied user when available.
            candidateNames.add(getTelegramDisplayName(ctx.from));
            const repliedUser = ctx.message?.reply_to_message?.from;
            if (repliedUser) candidateNames.add(getTelegramDisplayName(repliedUser));

            const normalizedNames = [...candidateNames]
                .map((name) => String(name || '').trim())
                .filter(Boolean)
                .map((name) => name.slice(0, 50));

            if (normalizedNames.length === 0) {
                return ctx.reply('ℹ️ No visible Telegram members found to sync right now.');
            }

            let inserted = 0;
            for (const memName of normalizedNames) {
                const { rows: existing } = await pool.query(
                    'SELECT id FROM member_infm WHERE group_id = $1 AND LOWER(TRIM(mem_name)) = LOWER(TRIM($2)) LIMIT 1',
                    [linkedGroup.id, memName]
                );

                if (existing.length > 0) continue;

                await pool.query(
                    'INSERT INTO member_infm (mem_name, group_id, paid) VALUES ($1, $2, 0)',
                    [memName, linkedGroup.id]
                );
                inserted++;
            }

            return ctx.reply(
                `✅ Member sync complete for *${linkedGroup.grp_name}*\n` +
                `• Checked: ${normalizedNames.length}\n` +
                `• Added: ${inserted}\n` +
                `• Skipped(existing): ${normalizedNames.length - inserted}`,
                { parse_mode: 'Markdown' }
            );
        } catch (err) {
            console.error('Sync members TG error:', err);
            return ctx.reply('❌ Failed to sync members from Telegram chat.');
        }
    });

    // /export command - sends the Excel file
    bot.command('export', async (ctx) => {
        if (!ctx.user) return ctx.reply('Please link your account first.');

        try {
            const { rows: groups } = await pool.query('SELECT id, grp_name FROM grp_infm WHERE telegram_chat_id = $1', [ctx.chat.id]);
            if (groups.length === 0) return ctx.reply('❌ This chat is not linked to any group.');

            const group = groups[0];
            const groupName = (group.grp_name || `Group_${group.id}`).trim();
            ctx.reply('⏳ Generating report...');

            const buffer = await generateGroupExcelBuffer(group.id);
            const filename = `${groupName.replace(/\s+/g, '_')}_Report.xlsx`;

            await ctx.replyWithDocument({ source: buffer, filename: filename }, { caption: `📊 Here is the financial report for *${groupName}*`, parse_mode: 'Markdown' });
        } catch (err) {
            console.error('Export TG error:', err);
            ctx.reply('❌ Failed to generate report.');
        }
    });

    // /status command - summary
    bot.command('status', async (ctx) => {
        try {
            const { rows: groups } = await pool.query('SELECT id, grp_name, currency FROM grp_infm WHERE telegram_chat_id = $1', [ctx.chat.id]);
            if (groups.length === 0) return ctx.reply('❌ This chat is not linked to any group.');

            const group = groups[0];
            const { rows: members } = await pool.query('SELECT COUNT(*) as count FROM member_infm WHERE group_id = $1', [group.id]);
            const { rows: trips } = await pool.query('SELECT COUNT(*) as count, SUM(spend) as total FROM trp_infm WHERE group_id = $1', [group.id]);
            const groupName = group.grp_name || `Group ${group.id}`;
            const memberCount = Number(members?.[0]?.count || 0);
            const tripCount = Number(trips?.[0]?.count || 0);
            const totalSpend = Number(trips?.[0]?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const currency = group.currency || '';

            const summary = `
📊 *Group Status: ${groupName}*
👥 Members: ${memberCount}
✈️ Total Trips: ${tripCount}
💰 Total Spend: ${totalSpend} ${currency}
      `;
            ctx.reply(summary, { parse_mode: 'Markdown' });
        } catch (err) {
            ctx.reply('❌ Error fetching status.');
        }
    });

    // Handle natural language messages (Agentic AI)
    bot.on(message('text'), async (ctx) => {
        if (ctx.message.text.startsWith('/')) return; // Ignore commands

        const fromId = ctx.from?.id;
        const text = (ctx.message?.text || '').trim();
        const pending = fromId ? getPendingInput(fromId) : null;

        if (pending) {
            if (Date.now() > pending.expiresAt) {
                clearPendingInput(fromId);
                return ctx.reply('⌛ Session expired. Please run the command again.');
            }

            try {
                if (pending.type === 'register_password') {
                    if (text.length < 6) return ctx.reply('❌ Password must be at least 6 characters. Send again.');

                    const existingByTelegram = await pool.query('SELECT id FROM user_infm WHERE telegram_id = $1', [fromId]);
                    if (existingByTelegram.rows.length > 0) {
                        clearPendingInput(fromId);
                        return ctx.reply('✅ This Telegram is already linked. Use /reset_password to change your password.');
                    }

                    const usernameTaken = await pool.query('SELECT 1 FROM user_infm WHERE usernm = $1', [pending.username]);
                    const resolvedUsername = usernameTaken.rows.length > 0
                        ? await resolveUniqueTelegramUsername(ctx.from)
                        : pending.username;

                    const hashed = await bcrypt.hash(text, 10);
                    const insert = await pool.query(
                        'INSERT INTO user_infm (usernm, passwd, telegram_id) VALUES ($1, $2, $3) RETURNING id, usernm',
                        [resolvedUsername, hashed, fromId]
                    );

                    await enrichUserFromTelegramProfile({
                        userId: insert.rows[0].id,
                        tgUser: ctx.from,
                        chatId: ctx.chat?.id,
                    });

                    clearPendingInput(fromId);
                    return ctx.reply(formatAccountInfoMessage({ usernm: insert.rows[0].usernm, tgUser: ctx.from }));
                }

                if (pending.type === 'reset_password') {
                    if (text.length < 6) return ctx.reply('❌ Password must be at least 6 characters. Send again.');
                    const hashed = await bcrypt.hash(text, 10);
                    await pool.query('UPDATE user_infm SET passwd = $1 WHERE telegram_id = $2', [hashed, fromId]);
                    clearPendingInput(fromId);
                    return ctx.reply('✅ Password updated successfully.');
                }

                if (pending.type === 'create_group_name') {
                    if (!ctx.user) {
                        clearPendingInput(fromId);
                        return ctx.reply('Please register via /register first.');
                    }
                    const grpName = text || `TG Group ${ctx.chat.id}`;
                    setPendingInput(fromId, {
                        type: 'create_group_currency',
                        chatId: pending.chatId || ctx.chat.id,
                        groupName: grpName,
                        askImportMembers: false,
                    });
                    return ctx.reply('Please send the currency code/symbol for this group (example: USD, THB, W).');
                }

                if (pending.type === 'create_group_currency') {
                    if (!ctx.user) {
                        clearPendingInput(fromId);
                        return ctx.reply('Please register via /register first.');
                    }

                    const currency = normalizeCurrency(text);
                    if (!currency) {
                        return ctx.reply('❌ Invalid currency. Please send a short currency code/symbol (example: USD, THB, W).');
                    }

                    if (pending.askImportMembers) {
                        setPendingInput(fromId, {
                            type: 'create_group_import_members_confirm',
                            chatId: pending.chatId || ctx.chat.id,
                            groupName: pending.groupName,
                            currency,
                        });
                        return ctx.reply(
                            `Currency set to *${currency}*.\n\nDo you want to auto-create members from this Telegram group?\nReply with *yes* or *no*.`,
                            { parse_mode: 'Markdown' }
                        );
                    }

                    const { groupId } = await createGroupFromTelegramChat({
                        chatId: pending.chatId || ctx.chat.id,
                        groupName: pending.groupName || `TG Group ${pending.chatId || ctx.chat.id}`,
                        userId: ctx.user.id,
                        currency,
                        ctx,
                        autoImportMembers: false,
                    });
                    clearPendingInput(fromId);
                    return ctx.reply(`✅ Group *${pending.groupName}* created successfully!\nID: \`${groupId}\`\n💱 Currency: *${currency}*`, { parse_mode: 'Markdown' });
                }

                if (pending.type === 'create_group_import_members_confirm') {
                    if (!ctx.user) {
                        clearPendingInput(fromId);
                        return ctx.reply('Please register via /register first.');
                    }

                    const decision = normalizeYesNo(text);
                    if (!['yes', 'y', 'no', 'n'].includes(decision)) {
                        return ctx.reply('Please reply with *yes* or *no*.', { parse_mode: 'Markdown' });
                    }

                    const groupName = pending.groupName || (ctx.chat?.title || `Telegram Group ${pending.chatId || ctx.chat.id}`);

                    const conflict = await findCreateGroupConflict({
                        chatId: pending.chatId || ctx.chat.id,
                        groupName,
                        userId: ctx.user.id,
                    });

                    if (conflict && conflict.admin_id !== ctx.user.id) {
                        clearPendingInput(fromId);
                        return ctx.reply('❌ Cannot create group. This Telegram chat or group name is already owned/linked by another TinyNotie user. They must unlink first.');
                    }

                    if (conflict && conflict.admin_id === ctx.user.id && conflict.telegram_chat_id === (pending.chatId || ctx.chat.id)) {
                        clearPendingInput(fromId);
                        return ctx.reply(`ℹ️ This Telegram chat is already linked to your group *${conflict.grp_name}* (ID: \`${conflict.id}\`).`, { parse_mode: 'Markdown' });
                    }

                    const autoImportMembers = ['yes', 'y'].includes(decision);
                    const { groupId, importedCount } = await createGroupFromTelegramChat({
                        chatId: pending.chatId || ctx.chat.id,
                        groupName,
                        userId: ctx.user.id,
                        currency: pending.currency || 'W',
                        ctx,
                        autoImportMembers,
                    });

                    clearPendingInput(fromId);
                    if (autoImportMembers) {
                        return ctx.reply(
                            `✅ Group *${groupName}* created successfully!\nID: \`${groupId}\`\n💱 Currency: *${pending.currency || 'W'}*\n👥 Auto-created members: *${importedCount}*`,
                            { parse_mode: 'Markdown' }
                        );
                    }

                    return ctx.reply(`✅ Group *${groupName}* created successfully!\nID: \`${groupId}\`\n💱 Currency: *${pending.currency || 'W'}*`, { parse_mode: 'Markdown' });
                }

                if (pending.type === 'add_member_name') {
                    if (!ctx.user) {
                        clearPendingInput(fromId);
                        return ctx.reply('Please register via /register first.');
                    }
                    const { rows: groups } = await pool.query('SELECT id FROM grp_infm WHERE telegram_chat_id = $1', [pending.chatId || ctx.chat.id]);
                    if (groups.length === 0) {
                        clearPendingInput(fromId);
                        return ctx.reply('❌ This chat is not linked to any group. Use /link_group first.');
                    }
                    await pool.query('INSERT INTO member_infm (mem_name, group_id, paid) VALUES ($1, $2, 0)', [text, groups[0].id]);
                    clearPendingInput(fromId);
                    return ctx.reply(`✅ Member *${text}* added to the group!`, { parse_mode: 'Markdown' });
                }

                if (pending.type === 'link_group_id') {
                    if (!ctx.user) {
                        clearPendingInput(fromId);
                        return ctx.reply('Please register via /register first.');
                    }
                    const groupId = parseInt(text, 10);
                    if (!Number.isFinite(groupId)) return ctx.reply('❌ Invalid group ID. Send numeric group ID.');

                    const { rows: accessCheck } = await pool.query(
                        'SELECT 1 FROM grp_infm g LEFT JOIN grp_users gu ON g.id = gu.group_id WHERE g.id = $1 AND (g.admin_id = $2 OR gu.user_id = $2)',
                        [groupId, ctx.user.id]
                    );

                    if (accessCheck.length === 0) {
                        clearPendingInput(fromId);
                        return ctx.reply('❌ You do not have permission to link this group or the group does not exist.');
                    }

                    const conflictSql = `
                        SELECT id, admin_id
                        FROM grp_infm
                        WHERE telegram_chat_id = $1
                          AND id <> $2
                        LIMIT 1;
                    `;
                    const { rows: conflicts } = await pool.query(conflictSql, [pending.chatId || ctx.chat.id, groupId]);
                    if (conflicts.length > 0 && conflicts[0].admin_id !== ctx.user.id) {
                        clearPendingInput(fromId);
                        return ctx.reply('❌ This Telegram chat is already linked by another TinyNotie owner. Ask them to unlink it first.');
                    }

                    await pool.query('UPDATE grp_infm SET telegram_chat_id = $1 WHERE id = $2', [pending.chatId || ctx.chat.id, groupId]);
                    clearPendingInput(fromId);
                    return ctx.reply(`✅ Success! This Telegram group is now linked to TinyNotie group: *${groupId}*`, { parse_mode: 'Markdown' });
                }
            } catch (pendingErr) {
                console.error('Pending input handling error:', pendingErr);
                clearPendingInput(fromId);
                return ctx.reply('❌ Failed to process your input. Please run the command again.');
            }
        }

        const triggeredInGroup = isGroupChat(ctx)
            ? await isTriggeredForBotInGroup(ctx, text)
            : true;

        if (isGroupChat(ctx) && !triggeredInGroup) {
            return;
        }

        if (!ctx.user) {
            if (ctx.chat?.type === 'private') {
                return ctx.reply('Please register via /register to start using TinyNotie bot.');
            }
            return ctx.reply('👋 I can help once your TinyNotie account is linked. Please DM me and use /register first, then mention me here again.');
        }

        const groupContext = await resolveGroupContext({
            chatId: ctx.chat.id,
            chatType: ctx.chat.type,
            userId: ctx.user.id,
        });

        if (!groupContext.groupId && isGroupChat(ctx)) {
            return ctx.reply('🔗 This Telegram group is not linked to TinyNotie yet. Use /link_group in this chat so I can manage expenses here.');
        }

        if (!groupContext.groupId && ctx.chat.type === 'private') {
            return ctx.reply('No TinyNotie group found for your account yet. Create one with /create_group, then chat with me again.');
        }

        ctx.sendChatAction('typing');

        try {
            const userContext = `Message from @${ctx.from.username || ctx.from.first_name} (App User: ${ctx.user.usernm}). `;
            const cleanText = await stripBotMention(ctx.message.text || '');
            const fullMessage = userContext + (cleanText || text);

            const aiResponse = await runAiAgent({
                message: fullMessage,
                groupId: groupContext.groupId,
            });

            ctx.reply(aiResponse, { parse_mode: 'Markdown' });
        } catch (err) {
            console.error('Bot AI error:', err);
            ctx.reply('❌ Sorry, I encountered an error processing that.');
        }
    });

    // Handle Photos (Receipt Tracking)
    bot.on(message('photo'), async (ctx) => {
        if (isGroupChat(ctx)) {
            const captionText = ctx.message?.caption || '';
            const triggered = await isTriggeredForBotInGroup(ctx, captionText);
            if (!triggered) {
                return;
            }
        }

        const groupContext = await resolveGroupContext({
            chatId: ctx.chat.id,
            chatType: ctx.chat.type,
            userId: ctx.user?.id,
        });

        if (!ctx.user && ctx.chat?.type === 'private') {
            await ctx.reply('📌 You can still send images now. For group-expense actions, please /register to link your TinyNotie account.');
        }

        if (!ctx.user && isGroupChat(ctx)) {
            await ctx.reply('👋 I received your image. To perform TinyNotie actions in this group, please link your account via DM with /register.');
        }

        await ctx.sendChatAction('typing');

        try {
            const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
            const fileLink = await ctx.telegram.getFileLink(fileId);

            // Download image
            const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');
            const base64 = buffer.toString('base64');

            ctx.reply('🔍 Scanning receipt...');

            const ocrResult = await processReceiptImage(base64);
            const contextLine = groupContext.groupName ? `Group: *${groupContext.groupName}*\n` : '';

            if (ocrResult.status && ocrResult.data && ocrResult.data.length > 0) {
                let summary = `📄 *Image Analysis Results*\n${contextLine}\n`;
                let total = 0;

                ocrResult.data.forEach(item => {
                    summary += `• ${item.trp_name}: ${parseFloat(item.spend).toLocaleString()}\n`;
                    total += parseFloat(item.spend);
                });

                summary += `\n*Total: ${total.toLocaleString()}*\n\n`;
                summary += `What do you want me to do with this image next?\n`;
                summary += `• Reply *"add these expenses"* to save them\n`;
                summary += `• Reply with your own instruction (for example: *"summarize by category"*)`;

                ctx.reply(summary, { parse_mode: 'Markdown' });
            } else {
                ctx.reply(
                    `📷 I analyzed the image but could not confidently extract receipt items.\n\n` +
                    `Tell me what you want to do with it, for example:\n` +
                    `• "describe this image"\n` +
                    `• "extract any visible text"\n` +
                    `• "try adding expense manually"`
                );
            }
        } catch (err) {
            console.error('Bot photo error:', err);
            ctx.reply('❌ Error processing photo.');
        }
    });

    // When bot is added to a group, provide setup instructions with chat ID
    bot.on(message('new_chat_members'), async (ctx) => {
        try {
            const me = await bot.telegram.getMe();
            botUsernameCache = (me.username || '').toLowerCase();
            const addedBot = (ctx.message?.new_chat_members || []).some((m) => m.id === me.id);
            if (!addedBot) return;

            await ctx.reply(
                `👋 Thanks for adding TinyNotie bot!\n\n` +
                `🆔 This group chat ID is: \`${ctx.chat.id}\`\n\n` +
                `Next steps:\n` +
                `1) Link your TinyNotie account in private chat with this bot\n` +
                `2) In TinyNotie group settings, paste this chat ID to link this group`,
                { parse_mode: 'Markdown' }
            );
        } catch (err) {
            console.error('[Telegram] new_chat_members handler error:', err.message);
        }
    });

    return bot;
};

/**
 * Setup Telegram Webhook
 * Call this after your Express server is running
 */
export const setupWebhook = async (webhookUrl) => {
    if (!bot) {
        console.error('[Telegram] Bot not initialized. Cannot setup webhook.');
        return false;
    }

    try {
        // Remove any existing webhook first
        await bot.telegram.deleteWebhook();
        
        // Set the new webhook
        await bot.telegram.setWebhook(webhookUrl, {
            allowed_updates: ['message', 'callback_query', 'my_chat_member']
        });
        
        console.log(`[Telegram] Webhook set successfully to: ${webhookUrl}`);
        return true;
    } catch (err) {
        console.error('[Telegram] Error setting webhook:', err.message);
        return false;
    }
};

/**
 * Get webhook info (useful for debugging)
 */
export const getWebhookInfo = async () => {
    if (!bot) return null;
    try {
        return await bot.telegram.getWebhookInfo();
    } catch (err) {
        console.error('[Telegram] Error getting webhook info:', err);
        return null;
    }
};

/**
 * Send a Telegram message to any chat_id (group or personal)
 */
export const sendTelegramMessageToChat = async (chatId, message, options = { parse_mode: 'Markdown' }) => {
    if (!bot) return false;
    try {
        await bot.telegram.sendMessage(chatId, message, options);
        return true;
    } catch (err) {
        console.error(`[Telegram] sendMessage failed for chat ${chatId}:`, err.message);
        return false;
    }
};

/**
 * Send a notification to a linked Telegram group
 */
export const notifyGroup = async (groupId, message) => {
    if (!bot) return false;
    try {
        const { rows } = await pool.query('SELECT telegram_chat_id FROM grp_infm WHERE id = $1', [groupId]);
        if (rows.length > 0 && rows[0].telegram_chat_id) {
            await bot.telegram.sendMessage(rows[0].telegram_chat_id, message, { parse_mode: 'Markdown' });
            console.log(`[Telegram] Notification sent successfully to group ${groupId} (chat_id: ${rows[0].telegram_chat_id})`);
            return true;
        }
        console.warn(`[Telegram] No telegram_chat_id found for group ${groupId}`);
        return false;
    } catch (err) {
        console.error(`[Telegram] Notification error for group ${groupId}:`, err.message);
        return false;
    }
};

export const getBot = () => bot;
