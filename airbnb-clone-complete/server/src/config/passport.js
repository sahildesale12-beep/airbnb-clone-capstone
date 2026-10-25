const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL);
}

function configurePassport(passport) {
  if (!isGoogleConfigured()) return false;

  passport.use(
    'google',
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
        state: true,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase().trim();
          if (!email) return done(new Error('Google did not provide an email address.'));

          let user = await User.findOne({ googleId: profile.id });
          if (user) return done(null, user);

          user = await User.findOne({ email });
          if (user) {
            // Link the account only when it is not already linked to another Google account.
            if (user.googleId && user.googleId !== profile.id) {
              return done(new Error('This email is already linked to a different Google account.'));
            }
            user.googleId = profile.id;
            if (!user.avatar && profile.photos?.[0]?.value) user.avatar = profile.photos[0].value;
            await user.save();
            return done(null, user);
          }

          user = await User.create({
            name: profile.displayName || email.split('@')[0],
            email,
            googleId: profile.id,
            avatar: profile.photos?.[0]?.value || '',
            role: 'guest',
          });
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  return true;
}

module.exports = { configurePassport, isGoogleConfigured };
