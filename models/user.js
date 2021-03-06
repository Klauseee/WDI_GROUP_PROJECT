const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');
const beautifyUnique = require('mongoose-beautiful-unique-validation');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    image: String,
    role: { type: String, required: true },
    cohort: { type: String, required: true },
    passwordHash: { type: String, required: true },
    needHelp: Boolean
  },
  {
    timestamps: true
  }
);

userSchema.plugin(beautifyUnique);

userSchema.virtual('password').set(setPassword);

userSchema.virtual('passwordConfirmation').set(setPasswordConfirmation);

userSchema.path('passwordHash').validate(validatePasswordHash);

userSchema.path('email').validate(validateEmail);

userSchema.statics.fetchByIdWithRatings = fetchByIdWithRatings;
userSchema.methods.validatePassword = validatePassword;

userSchema.set('toJSON', {
  virtuals: true,
  getters: true,
  setters: true,
  transform: function(doc, ret) {
    delete ret.passwordHash;
    delete ret.password;
    delete ret.passwordConfirmation;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);

function fetchByIdWithRatings(req, res) {
  const self = this;
  return new Promise((resolve, reject) => {
    self
      .findById(req.params.id)
      .exec()
      .then(user => {
        if (!user) return res.notFound();
        req.user = user.toObject();

        return self
          .model('Rating')
          .find({ createdBy: user.id })
          .exec();
      })

      .then(ratings => {
        req.user.ratings = ratings;
        return resolve(req.user);
      })
      .catch(reject);
  });
}

function setPassword(value) {
  this._password = value;
  this.passwordHash = bcrypt.hashSync(value, bcrypt.genSaltSync(8));
}

function setPasswordConfirmation(passwordConfirmation) {
  this._passwordConfirmation = passwordConfirmation;
}

function validatePasswordHash() {
  if (this.isNew) {
    if (!this._password) {
      return this.invalidate('password', 'A password is required.');
    }

    if (this._password.length < 6) {
      this.invalidate('password', 'must be at least 6 characters.');
    }

    if (this._password !== this._passwordConfirmation) {
      return this.invalidate('passwordConfirmation', 'Passwords do not match.');
    }
  }
}

function validateEmail(email) {
  if (!validator.isEmail(email)) {
    return this.invalidate('email', 'must be a valid email address');
  }
}

function validatePassword(password) {
  return bcrypt.compareSync(password, this.passwordHash);
}
