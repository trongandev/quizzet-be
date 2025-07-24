const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const { GamificationProfile } = require("../models/GamificationProfile");
// Configure Passport with Google Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_LOGIN_CLIENT_ID, // Thay bằng Client ID từ Google
            clientSecret: process.env.GOOGLE_LOGIN_CLIENT_SECRET, // Thay bằng Client Secret từ Google
            callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
            passReqToCallback: true, // Thêm dòng này
            scope: ["profile", "email", "openid"], // Đầy đủ scope
        },

        async (req, accessToken, refreshToken, profile, done) => {
            try {
                // Tìm user theo Google ID trước
                let user = await User.findOne({ googleId: profile.id });
                if (user) {
                    // Nếu đã tồn tại Google ID, trả về user
                    // kiểm tra xem có GamificationProfile không, nếu không thì tạo mới
                    const gamificationProfile = await GamificationProfile.findOne({ user_id: user._id });
                    if (!gamificationProfile) {
                        const newGamificationProfile = new GamificationProfile({
                            user_id: user._id,
                        });
                        await newGamificationProfile.save();
                        user.gamification = newGamificationProfile._id;
                        await user.save();
                    }
                    return done(null, user);
                } else {
                    // Tìm user theo email
                    const existingUserByEmail = await User.findOne({
                        email: profile.emails[0].value,
                    });

                    if (existingUserByEmail) {
                        // Nếu tìm thấy user có email, merge thông tin
                        existingUserByEmail.googleId = profile.id;

                        // Cập nhật thêm các thông tin từ Google profile nếu cần
                        existingUserByEmail.displayName = existingUserByEmail.name || profile.displayName;

                        // Lưu lại user đã merge

                        // kiểm tra xem có GamificationProfile không, nếu không thì tạo mới
                        const gamificationProfile = await GamificationProfile.findOne({ user_id: existingUserByEmail._id });
                        if (!gamificationProfile) {
                            const newGamificationProfile = new GamificationProfile({
                                user_id: existingUserByEmail._id,
                            });
                            await newGamificationProfile.save();
                        }
                        existingUserByEmail.gamification = gamificationProfile._id;
                        await existingUserByEmail.save();
                        return done(null, existingUserByEmail);
                    }

                    // Nếu không tìm thấy user nào, tạo mới
                    const newUser = new User({
                        googleId: profile.id,
                        displayName: profile.displayName,
                        email: profile.emails[0].value,
                        profilePicture: profile.photos[0].value,
                        provider: profile.provider,
                        verify: profile.emails[0].verified,
                    });
                    // Tạo GamificationProfile cho user mới
                    const newGamificationProfile = new GamificationProfile({
                        user_id: newUser._id,
                    });
                    await newGamificationProfile.save();
                    newUser.gamification = newGamificationProfile._id;
                    await newUser.save();

                    return done(null, newUser);
                }
            } catch (error) {
                console.error("Google Auth Error:", error);
                return done(error);
            }
        }
    )
);

// Phương thức serialize user
passport.serializeUser((user, done) => {
    // Lưu user ID vào session
    done(null, user.id);
});

// Phương thức deserialize user
passport.deserializeUser(async (id, done) => {
    try {
        // Tìm user từ ID trong database
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});
