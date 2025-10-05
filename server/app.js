const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// 微信小程序配置
const WECHAT_CONFIG = {
    appId: 'wx59aed11d3aa8ed48',
    appSecret: '9ba9f298109e8fc3f11c327ece2c6df3'
};

// 微信access_token缓存
let wechatAccessToken = {
    token: null,
    expiresAt: 0
};

// 确保上传目录存在
const uploadsDir = path.join(__dirname, 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
const usersDataDir = path.join(__dirname, 'data', 'users');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
}
if (!fs.existsSync(usersDataDir)) {
    fs.mkdirSync(usersDataDir, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, avatarsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueName + ext);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB限制
    },
    fileFilter: (req, file, cb) => {
        // 只允许图片文件
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'));
        }
    }
});

// 中间件配置
app.use(cors());
app.use(express.json());
// 静态文件服务，用于访问上传的头像
app.use('/uploads', express.static(uploadsDir));

// 微信登录接口（统一登录和手机号解密）
app.post('/api/login', async (req, res) => {
    try {
        const { code, encryptedData, iv } = req.body;
        console.log('=== 统一登录请求 ===');
        console.log('请求时间:', new Date().toISOString());
        console.log('code:', code);
        console.log('encryptedData:', encryptedData ? '已提供' : '未提供');
        console.log('iv:', iv ? '已提供' : '未提供');

        // 验证必需参数
        if (!code) {
            return res.status(400).json({
                success: false,
                message: '缺少登录凭证code'
            });
        }

        if (!encryptedData || !iv) {
            return res.status(400).json({
                success: false,
                message: '缺少手机号授权数据'
            });
        }

        // 1. 调用微信接口获取openid和session_key
        const wechatUrl = 'https://api.weixin.qq.com/sns/jscode2session';
        const params = {
            appid: WECHAT_CONFIG.appId,
            secret: WECHAT_CONFIG.appSecret,
            js_code: code,
            grant_type: 'authorization_code'
        };

        console.log('正在调用微信登录接口...');
        const response = await axios.get(wechatUrl, { params });
        console.log('微信接口返回数据:', response.data);

        if (response.data.errcode) {
            console.error('微信接口返回错误:', response.data);
            return res.status(400).json({
                success: false,
                message: '微信登录失败',
                error: response.data
            });
        }

        const { openid, session_key } = response.data;
        console.log('微信登录成功, openid:', openid);

        // 2. 解密手机号数据
        let phoneData;
        try {
            phoneData = decryptWeChatData(encryptedData, session_key, iv);
            console.log('手机号解密成功:', phoneData.phoneNumber);
        } catch (decryptError) {
            console.error('手机号解密失败:', decryptError);
            return res.status(400).json({
                success: false,
                message: '手机号解密失败',
                error: decryptError.message
            });
        }

        // 3. 生成访问令牌和刷新令牌
        const accessToken = generateAccessToken(openid);
        const refreshToken = generateRefreshToken(openid);
        console.log('生成令牌成功');

        // 4. 返回完整的登录结果
        const loginResult = {
            success: true,
            data: {
                accessToken,
                refreshToken,
                phoneNumber: phoneData.phoneNumber,
                purePhoneNumber: phoneData.purePhoneNumber,
                countryCode: phoneData.countryCode,
                openid,
                watermark: phoneData.watermark
            }
        };

        console.log('登录成功，返回数据:', {
            accessToken: accessToken.substring(0, 20) + '...',
            refreshToken: refreshToken.substring(0, 20) + '...',
            phoneNumber: phoneData.phoneNumber,
            openid
        });
        console.log('=== 统一登录请求结束 ===\n');

        res.json(loginResult);
    } catch (error) {
        console.error('登录接口错误:', error);
        console.log('=== 统一登录请求结束（失败）===\n');
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: error.message
        });
    }
});


/**
 * 解密微信数据
 * @param {string} encryptedData 加密数据
 * @param {string} sessionKey 会话密钥
 * @param {string} iv 初始向量
 * @returns {object} 解密后的数据
 */
function decryptWeChatData(encryptedData, sessionKey, iv) {
    try {
        // Base64 解码
        const sessionKeyBuffer = Buffer.from(sessionKey, 'base64');
        const encryptedDataBuffer = Buffer.from(encryptedData, 'base64');
        const ivBuffer = Buffer.from(iv, 'base64');

        // 创建解密器
        const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuffer, ivBuffer);
        decipher.setAutoPadding(true);

        // 解密数据
        let decrypted = decipher.update(encryptedDataBuffer, null, 'utf8');
        decrypted += decipher.final('utf8');

        // 解析JSON数据
        const decryptedData = JSON.parse(decrypted);

        console.log('解密成功，数据:', decryptedData);
        return decryptedData;
    } catch (error) {
        console.error('解密过程出错:', error);
        throw new Error('数据解密失败: ' + error.message);
    }
}

/**
 * 生成访问令牌
 * @param {string} openid 用户openid
 * @returns {string} 访问令牌
 */
function generateAccessToken(openid) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `access_${openid}_${timestamp}_${random}`;
}

/**
 * 生成刷新令牌
 * @param {string} openid 用户openid
 * @returns {string} 刷新令牌
 */
function generateRefreshToken(openid) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `refresh_${openid}_${timestamp}_${random}`;
}

/**
 * 验证访问令牌
 * @param {string} token 访问令牌
 * @returns {object|null} 解析后的令牌信息
 */
function verifyAccessToken(token) {
    try {
        if (!token || !token.startsWith('access_')) {
            return null;
        }

        const parts = token.split('_');
        if (parts.length !== 4) {
            return null;
        }

        const [prefix, openid, timestamp, random] = parts;
        const tokenTime = parseInt(timestamp);
        const currentTime = Date.now();

        // 检查令牌是否过期（24小时）
        if (currentTime - tokenTime > 24 * 60 * 60 * 1000) {
            return null;
        }

        return {
            openid,
            timestamp: tokenTime,
            random
        };
    } catch (error) {
        console.error('验证访问令牌失败:', error);
        return null;
    }
}

/**
 * 验证刷新令牌
 * @param {string} token 刷新令牌
 * @returns {object|null} 解析后的令牌信息
 */
function verifyRefreshToken(token) {
    try {
        if (!token || !token.startsWith('refresh_')) {
            return null;
        }

        const parts = token.split('_');
        if (parts.length !== 4) {
            return null;
        }

        const [prefix, openid, timestamp, random] = parts;
        const tokenTime = parseInt(timestamp);
        const currentTime = Date.now();

        // 检查令牌是否过期（30天）
        if (currentTime - tokenTime > 30 * 24 * 60 * 60 * 1000) {
            return null;
        }

        return {
            openid,
            timestamp: tokenTime,
            random
        };
    } catch (error) {
        console.error('验证刷新令牌失败:', error);
        return null;
    }
}

/**
 * 获取微信access_token
 * @returns {Promise<string>} 返回access_token
 */
async function getWechatAccessToken() {
    try {
        // 检查缓存的token是否还有效
        const now = Date.now();
        if (wechatAccessToken.token && now < wechatAccessToken.expiresAt) {
            console.log('使用缓存的access_token');
            return wechatAccessToken.token;
        }

        console.log('获取新的access_token...');

        // 调用微信接口获取access_token
        const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
            params: {
                grant_type: 'client_credential',
                appid: WECHAT_CONFIG.appId,
                secret: WECHAT_CONFIG.appSecret
            }
        });

        if (response.data.errcode) {
            throw new Error(`获取access_token失败: ${response.data.errmsg}`);
        }

        // 缓存token，提前5分钟过期以确保安全
        wechatAccessToken.token = response.data.access_token;
        wechatAccessToken.expiresAt = now + (response.data.expires_in - 300) * 1000;

        console.log('access_token获取成功，有效期至:', new Date(wechatAccessToken.expiresAt).toLocaleString());

        return wechatAccessToken.token;
    } catch (error) {
        console.error('获取微信access_token失败:', error);
        throw error;
    }
}

// 头像上传接口
app.post('/api/upload-avatar', upload.single('avatar'), (req, res) => {
    console.log('=== 头像上传请求 ===');
    console.log('请求时间:', new Date().toISOString());
    console.log('上传文件信息:', req.file);
    console.log('表单数据:', req.body);

    if (!req.file) {
        console.error('没有上传文件');
        return res.status(400).json({
            success: false,
            message: '没有上传文件'
        });
    }

    const os = require('os');
    const interfaces = os.networkInterfaces();
    let localIP = 'localhost';

    // 获取局域网IP
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            if (interface.family === 'IPv4' && !interface.internal) {
                localIP = interface.address;
                break;
            }
        }
    }

    const avatarUrl = `http://${localIP}:${PORT}/uploads/avatars/${req.file.filename}`;

    console.log('头像上传成功，URL:', avatarUrl);
    console.log('文件大小:', req.file.size, 'bytes');
    console.log('=== 头像上传请求结束 ===\n');

    res.json({
        success: true,
        data: {
            url: avatarUrl,
            filename: req.file.filename,
            size: req.file.size
        }
    });
});

// 用户信息保存接口
app.post('/api/save-user-info', (req, res) => {
    console.log('=== 用户信息保存请求 ===');
    console.log('请求时间:', new Date().toISOString());
    console.log('请求数据:', JSON.stringify(req.body, null, 2));

    const { openid, nickName, avatarUrl, phoneNumber } = req.body;

    if (!openid) {
        console.error('缺少openid参数');
        return res.status(400).json({
            success: false,
            message: '缺少openid参数'
        });
    }

    // 准备用户信息
    const userInfo = {
        openid,
        nickName: nickName || '',
        avatarUrl: avatarUrl || '',
        phoneNumber: phoneNumber || '',
        updateTime: new Date().toISOString(),
        saveTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    };

    console.log('准备保存的用户信息:');
    console.log('- OpenID:', userInfo.openid);
    console.log('- 昵称:', userInfo.nickName);
    console.log('- 头像URL:', userInfo.avatarUrl);
    console.log('- 手机号:', userInfo.phoneNumber);
    console.log('- 更新时间:', userInfo.updateTime);

    try {
        // 保存到JSON文件
        const userFilePath = path.join(usersDataDir, `${openid}.json`);

        // 如果文件已存在，先读取原有数据
        let existingData = {};
        if (fs.existsSync(userFilePath)) {
            try {
                const existingContent = fs.readFileSync(userFilePath, 'utf8');
                existingData = JSON.parse(existingContent);
                console.log('读取到已存在的用户数据:', existingData);
            } catch (error) {
                console.warn('读取已存在用户数据失败:', error.message);
            }
        }

        // 合并数据（新数据覆盖旧数据）
        const finalUserInfo = {
            ...existingData,
            ...userInfo,
            history: [
                ...(existingData.history || []),
                {
                    action: '保存用户信息',
                    timestamp: userInfo.updateTime,
                    data: {
                        nickName: userInfo.nickName,
                        avatarUrl: userInfo.avatarUrl,
                        phoneNumber: userInfo.phoneNumber
                    }
                }
            ]
        };

        // 写入文件
        fs.writeFileSync(userFilePath, JSON.stringify(finalUserInfo, null, 2), 'utf8');

        console.log('✅ 用户信息保存成功！');
        console.log('保存路径:', userFilePath);
        console.log('最终保存的数据:', JSON.stringify(finalUserInfo, null, 2));
        console.log('=== 用户信息保存请求结束 ===\n');

        res.json({
            success: true,
            message: '用户信息保存成功',
            data: {
                openid: finalUserInfo.openid,
                nickName: finalUserInfo.nickName,
                avatarUrl: finalUserInfo.avatarUrl,
                phoneNumber: finalUserInfo.phoneNumber,
                updateTime: finalUserInfo.updateTime
            }
        });
    } catch (error) {
        console.error('❌ 保存用户信息失败:', error);
        console.log('=== 用户信息保存请求结束（失败）===\n');

        res.status(500).json({
            success: false,
            message: '保存用户信息失败',
            error: error.message
        });
    }
});

// 获取用户信息接口
app.get('/api/get-user-info/:openid', (req, res) => {
    console.log('=== 获取用户信息请求 ===');
    console.log('请求时间:', new Date().toISOString());

    const { openid } = req.params;
    console.log('查询OpenID:', openid);

    if (!openid) {
        return res.status(400).json({
            success: false,
            message: '缺少openid参数'
        });
    }

    try {
        const userFilePath = path.join(usersDataDir, `${openid}.json`);

        if (!fs.existsSync(userFilePath)) {
            console.log('用户信息文件不存在:', userFilePath);
            return res.json({
                success: true,
                message: '用户信息不存在',
                data: null
            });
        }

        const userContent = fs.readFileSync(userFilePath, 'utf8');
        const userInfo = JSON.parse(userContent);

        console.log('查询到的用户信息:', userInfo);
        console.log('=== 获取用户信息请求结束 ===\n');

        res.json({
            success: true,
            data: userInfo
        });
    } catch (error) {
        console.error('获取用户信息失败:', error);
        console.log('=== 获取用户信息请求结束（失败）===\n');

        res.status(500).json({
            success: false,
            message: '获取用户信息失败',
            error: error.message
        });
    }
});

// 首页数据接口
app.get('/api/home-info', (req, res) => {
    console.log('=== 首页数据请求 ===');
    console.log('请求时间:', new Date().toISOString());

    const homeData = {
        success: true,
        data: {
            imgList: [
                'https://img1.baidu.com/it/u=3518465425,3124019593&fm=253&fmt=auto&app=120&f=JPEG?w=889&h=500',
                'https://q2.itc.cn/q_70/images03/20250817/050833f9e2c14253888b9017583d252e.jpeg'
            ],
            companyName: 'XX汽车服务有限公司',
            companyDesc:
                '专业提供优质车源和驾校模拟考试服务，致力于为客户提供一站式汽车服务解决方案。我们拥有丰富的车源信息和专业的服务团队，为您的购车和学车需求提供全方位支持。',
            companyAddress: '北京市朝阳区建国路88号现代城A座15层',
            companyContact: '400-123-4567'
        }
    };

    console.log('返回首页数据:', homeData);
    console.log('=== 首页数据请求结束 ===\n');

    res.json(homeData);
});

// 刷新令牌接口
app.post('/api/auth/refresh', (req, res) => {
    console.log('=== 刷新令牌请求 ===');
    console.log('请求时间:', new Date().toISOString());

    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            success: false,
            message: '缺少刷新令牌'
        });
    }

    // 验证刷新令牌
    const tokenInfo = verifyRefreshToken(refreshToken);
    if (!tokenInfo) {
        console.log('刷新令牌无效或已过期');
        return res.status(401).json({
            success: false,
            message: '刷新令牌无效或已过期'
        });
    }

    console.log('刷新令牌验证成功, openid:', tokenInfo.openid);

    // 生成新的访问令牌
    const newAccessToken = generateAccessToken(tokenInfo.openid);
    const newRefreshToken = generateRefreshToken(tokenInfo.openid);

    console.log('生成新的令牌成功');
    console.log('=== 刷新令牌请求结束 ===\n');

    res.json({
        success: true,
        data: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        }
    });
});

// 模拟票列表接口
app.get('/api/mock-tickets', (req, res) => {
    console.log('=== 模拟票列表请求 ===');
    console.log('请求时间:', new Date().toISOString());

    const mockTicketsData = {
        success: true,
        data: [
            {
                id: "1",
                orderNumber: "MT202401150001",
                packageName: "科目二模拟考试",
                studentName: "张三",
                studentPhone: "138****8888",
                appointmentDate: "2024-01-15 09:00",
                status: "已核销",
                drivingSchool: "阳光驾校",
                coachName: "李师傅",
                coachPhone: "139****9999",
                simulationArea: "A区3号场地",
                operator: "管理员",
                operateTime: "2024-01-15 08:30",
                assistantName: "王助考",
                verifyTime: "09:30"
            },
            {
                id: "2",
                orderNumber: "MT202401150002",
                packageName: "科目三模拟考试",
                studentName: "李四",
                studentPhone: "136****6666",
                appointmentDate: "2024-01-15 10:00",
                status: "未使用",
                drivingSchool: "阳光驾校",
                coachName: "张教练",
                coachPhone: "138****7777",
                simulationArea: "B区1号场地",
                operator: "管理员",
                operateTime: "2024-01-15 08:45",
                assistantName: "赵助考",
                verifyTime: null
            },
            {
                id: "3",
                orderNumber: "MT202401150003",
                packageName: "全科目模拟套餐",
                studentName: "王五",
                studentPhone: "135****5555",
                appointmentDate: "2024-01-15 14:00",
                status: "已核销",
                drivingSchool: "蓝天驾校",
                coachName: "刘师傅",
                coachPhone: "137****8888",
                simulationArea: "C区2号场地",
                operator: "管理员",
                operateTime: "2024-01-15 13:30",
                assistantName: "孙助考",
                verifyTime: "14:15"
            },
            {
                id: "4",
                orderNumber: "MT202401160001",
                packageName: "VIP模拟考试套餐",
                studentName: "赵六",
                studentPhone: "134****4444",
                appointmentDate: "2024-01-16 09:30",
                status: "未使用",
                drivingSchool: "蓝天驾校",
                coachName: "陈教练",
                coachPhone: "136****6666",
                simulationArea: "A区1号场地",
                operator: "管理员",
                operateTime: "2024-01-16 08:00",
                assistantName: "周助考",
                verifyTime: null
            },
            {
                id: "5",
                orderNumber: "MT202401160002",
                packageName: "科目二强化训练",
                studentName: "钱七",
                studentPhone: "133****3333",
                appointmentDate: "2024-01-16 15:30",
                status: "已核销",
                drivingSchool: "阳光驾校",
                coachName: "吴师傅",
                coachPhone: "135****5555",
                simulationArea: "B区3号场地",
                operator: "管理员",
                operateTime: "2024-01-16 15:00",
                assistantName: "郑助考",
                verifyTime: "15:45"
            }
        ]
    };

    console.log('返回模拟票数据，共', mockTicketsData.data.length, '条记录');
    console.log('=== 模拟票列表请求结束 ===\n');

    res.json(mockTicketsData);
});

// 生成模拟票二维码接口
app.post('/api/generate-ticket-qrcode', async (req, res) => {
    console.log('=== 生成模拟票二维码请求 ===');
    console.log('请求时间:', new Date().toISOString());
    console.log('请求数据:', JSON.stringify(req.body, null, 2));

    try {
        const { ticketId, studentPhone, orderNumber } = req.body;

        // 验证必需参数
        if (!ticketId || !studentPhone) {
            return res.status(400).json({
                success: false,
                message: '缺少必需参数：ticketId 或 studentPhone'
            });
        }

        console.log('开始生成二维码，票据ID:', ticketId, '学员手机:', studentPhone);

        // 获取微信access_token
        const accessToken = await getWechatAccessToken();
        console.log('获取到access_token');

        // 构建scene参数（微信小程序二维码参数限制32个字符）
        const scene = `t=${ticketId}&p=${studentPhone.slice(-4)}`;
        console.log('二维码scene参数:', scene);

        // 调用微信getUnlimitedQRCode接口
        const qrResponse = await axios.post(
            `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`,
            {
                scene: scene,
                page: 'pages/ticket-verify/ticket-verify', // 核销页面路径
                width: 430,
                auto_color: false,
                line_color: { r: 0, g: 0, b: 0 },
                is_hyaline: false
            },
            {
                responseType: 'arraybuffer' // 重要：设置响应类型为arraybuffer
            }
        );

        console.log('微信二维码接口调用成功');

        // 检查是否返回错误
        if (qrResponse.headers['content-type'].includes('application/json')) {
            const errorData = JSON.parse(Buffer.from(qrResponse.data).toString());
            console.error('微信二维码接口返回错误:', errorData);
            return res.status(400).json({
                success: false,
                message: '生成二维码失败',
                error: errorData
            });
        }

        // 保存二维码图片到本地
        const qrcodesDir = path.join(uploadsDir, 'qrcodes');
        if (!fs.existsSync(qrcodesDir)) {
            fs.mkdirSync(qrcodesDir, { recursive: true });
        }

        const filename = `qr_${ticketId}_${Date.now()}.png`;
        const filePath = path.join(qrcodesDir, filename);

        fs.writeFileSync(filePath, qrResponse.data);
        console.log('二维码图片保存成功:', filePath);

        // 获取本地IP用于构建访问URL
        const os = require('os');
        const interfaces = os.networkInterfaces();
        let localIP = 'localhost';

        for (const name of Object.keys(interfaces)) {
            for (const interface of interfaces[name]) {
                if (interface.family === 'IPv4' && !interface.internal) {
                    localIP = interface.address;
                    break;
                }
            }
        }

        const qrCodeUrl = `http://${localIP}:${PORT}/uploads/qrcodes/${filename}`;

        console.log('二维码生成成功，URL:', qrCodeUrl);
        console.log('=== 生成模拟票二维码请求结束 ===\n');

        res.json({
            success: true,
            data: {
                qrCodeUrl: qrCodeUrl,
                scene: scene,
                ticketId: ticketId,
                filename: filename
            }
        });

    } catch (error) {
        console.error('生成二维码失败:', error);
        console.log('=== 生成模拟票二维码请求结束（失败）===\n');

        res.status(500).json({
            success: false,
            message: '生成二维码失败',
            error: error.message
        });
    }
});

// 健康检查接口
app.get('/api/health', (req, res) => {
    console.log('=== 健康检查请求 ===');
    console.log('请求时间:', new Date().toISOString());
    console.log('请求来源IP:', req.ip || req.connection.remoteAddress);
    console.log('请求方法:', req.method);
    console.log('请求路径:', req.url);
    console.log('User-Agent:', req.get('User-Agent'));

    const responseData = {
        success: true,
        message: '服务器运行正常',
        timestamp: new Date().toISOString()
    };

    console.log('返回数据:', responseData);
    console.log('=== 健康检查请求结束 ===\n');

    res.json(responseData);
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    let localIP = 'localhost';

    // 获取局域网IP
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            if (interface.family === 'IPv4' && !interface.internal) {
                localIP = interface.address;
                break;
            }
        }
    }

    console.log(`服务器已启动，端口: ${PORT}`);
    console.log(`本地访问: http://localhost:${PORT}`);
    console.log(`局域网访问: http://${localIP}:${PORT}`);
    console.log(`\n=== API接口地址 ===`);
    console.log(`健康检查: http://localhost:${PORT}/api/health`);
    console.log(`首页数据: http://localhost:${PORT}/api/home-info`);
    console.log(`模拟票列表: http://localhost:${PORT}/api/mock-tickets`);
    console.log(`生成二维码: http://localhost:${PORT}/api/generate-ticket-qrcode`);
    console.log(`统一登录接口: http://localhost:${PORT}/api/login`);
    console.log(`刷新令牌: http://localhost:${PORT}/api/auth/refresh`);
    console.log(`头像上传: http://localhost:${PORT}/api/upload-avatar`);
    console.log(`用户信息保存: http://localhost:${PORT}/api/save-user-info`);
    console.log(`获取用户信息: http://localhost:${PORT}/api/get-user-info/:openid`);
    console.log(`\n=== 真机调试地址 ===`);
    console.log(`健康检查: http://${localIP}:${PORT}/api/health`);
    console.log(`首页数据: http://${localIP}:${PORT}/api/home-info`);
    console.log(`模拟票列表: http://${localIP}:${PORT}/api/mock-tickets`);
    console.log(`生成二维码: http://${localIP}:${PORT}/api/generate-ticket-qrcode`);
    console.log(`统一登录接口: http://${localIP}:${PORT}/api/login`);
    console.log(`刷新令牌: http://${localIP}:${PORT}/api/auth/refresh`);
    console.log(`头像上传: http://${localIP}:${PORT}/api/upload-avatar`);
    console.log(`用户信息保存: http://${localIP}:${PORT}/api/save-user-info`);
    console.log(`获取用户信息: http://${localIP}:${PORT}/api/get-user-info/:openid`);
    console.log(`\n请将小程序中的请求地址改为: http://${localIP}:${PORT}`);
});

module.exports = app;
