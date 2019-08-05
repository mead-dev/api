const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const User = require('./models/user');
const Role = require('./models/role');

const MONGODB_URI = 'mongodb://localhost:27017/mead';
// const MONGODB_URI = 'mongodb://marvinboris:Marvinboris1@node-complete-shard-00-00-mt9rd.mongodb.net:27017,node-complete-shard-00-01-mt9rd.mongodb.net:27017,node-complete-shard-00-02-mt9rd.mongodb.net:27017/messages?ssl=true&replicaSet=node-complete-shard-0&authSource=admin';

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: function (req, file, cb) {
        cb(null, new Date().getTime() + file.originalname)
    }
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');

app.use(bodyParser.json());
app.use(multer({ storage: fileStorage, fileFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
}));
app.use(flash());

app.use(async (req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    try {
        const user = await User.findById(req.session.user._id);
        if (!user) {
            return next();
        }
        req.user = user;
        next();
    } catch (err) {
        next(new Error(err));
    }
});

// app.use(csrfProtection);
// app.use((req, res, next) => {
//     res.locals.csrfToken = req.csrfToken();
//     console.log('From middleware : ', res.locals.csrfToken);
//     next();
// });

app.get('/csrf', (req, res, next) => {
    const csrfToken = res.locals.csrfToken;
    console.log('From route : ', csrfToken);
    res.status(200).json({
        token: csrfToken
    });
    // next();
});

// Filling up the database
app.use(async (req, res, next) => {
    try {
        const role = await Role.findOne();
        if (!role) {
            const roles = ['Administrateur', 'Classique', 'Premium', 'Commerçant', 'Styliste', 'VIP'];
            roles.forEach(async r => {
                const createdRole = new Role({ name: r });
                await createdRole.save();
            });
        }
        next();
    } catch (error) {
        next(error);
    }
});

app.use(async (req, res, next) => {
    try {
        const user = await User.findOne();
        if (!user) {
            const role = await Role.findOne({ name: 'Administrateur' });
            const roleId = role._id;
            const email = 'admin@localhost.com';
            const password = await bcrypt.hash('adminadmin', 12);
            const name = 'Admin';
            const administrator = new User({ email, password, name, roleId });
            await administrator.save();
        }
        next();   
    } catch (error) {
        next(error);
    }
});

app.use('/auth', authRoutes);
app.use('/shop', shopRoutes);
app.use('/admin', adminRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message, data });
});

mongoose
    .connect(MONGODB_URI, { useNewUrlParser: true })
    .then(user => {
        console.log('Connected !');
        const server = app.listen(8080);
        const io = require('./socket').init(server);
        io.on('connection', socket => {
            console.log('Client connected !');
        });
    })
    .catch(err => {
        console.log(err);
    });