/**
 * models/User.js
 * ---------------------------------------------------------
 * One collection for ALL accounts; the `role` field decides
 * what the user can do:  customer | seller | admin
 * A seller additionally owns a Shop document (see models/Shop.js).
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Home' }, // Home / Work ...
    fullName: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, required: [true, 'City is required'] },
    street: { type: String, trim: true, default: '' },
    details: { type: String, trim: true, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned by default (use .select('+password'))
    },
    phone: { type: String, trim: true, default: '' },
    avatar: { type: String, default: '' },
    role: {
      type: String,
      enum: {
        values: Object.values(ROLES),
        message: 'Role must be one of: customer, seller, admin',
      },
      default: ROLES.CUSTOMER,
    },
    addresses: { type: [addressSchema], default: [] },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------- Indexes ----------
userSchema.index({ role: 1, createdAt: -1 });

// ---------- Virtuals ----------
/** The shop owned by this user (only for sellers). */
userSchema.virtual('shop', {
  ref: 'Shop',
  localField: '_id',
  foreignField: 'owner',
  justOne: true,
});

// ---------- Middlewares ----------
/** Hash the password whenever it is set/changed. */
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  // used to invalidate the tokens issued before the password change
  if (!this.isNew) this.passwordChangedAt = new Date();
  return next();
});

// ---------- Methods ----------
/** Compare a plain password with the stored hash. */
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/**
 * True if the password was changed after the JWT was issued.
 * NOTE: `iat` has a 1 second resolution, so a token created in the very
 * same second as the change is still considered valid.
 */
userSchema.methods.changedPasswordAfter = function changedPasswordAfter(jwtTimestamp) {
  if (!this.passwordChangedAt) return false;
  const changedAt = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return jwtTimestamp < changedAt;
};

/** Public representation of a user (never leaks the password). */
userSchema.methods.toPublic = function toPublic() {
  const {
    _id, name, email, phone, avatar, role, addresses, favorites, isActive, createdAt,
  } = this;
  return { _id, name, email, phone, avatar, role, addresses, favorites, isActive, createdAt };
};

module.exports = mongoose.model('User', userSchema);
