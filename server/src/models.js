import mongoose from "mongoose";
const { Schema } = mongoose;
const options = { timestamps: true, versionKey: false };
const vehicle = new Schema(
  {
    id: { type: String, unique: true },
    slug: { type: String, required: true, unique: true },
    name: String,
    category: String,
    description: String,
    tagline: String,
    price: Number,
    range: Number,
    topSpeed: Number,
    acceleration: Number,
    power: Number,
    battery: Number,
    seats: Number,
    drivetrain: String,
    colors: [{ name: String, hex: String }],
    wheels: [{ id: String, name: String }],
    media: [{ url: String, alt: String, category: String }],
    featured: Boolean,
    published: Boolean,
  },
  options,
);
const enquiryFields = {
  name: String,
  email: String,
  status: {
    type: String,
    enum: ["new", "reviewing", "contacted", "closed"],
    default: "new",
  },
  fingerprint: { type: String, unique: true },
  message: String,
};
export const Vehicle = mongoose.model("Vehicle", vehicle);
export const TestDriveRequest = mongoose.model(
  "TestDriveRequest",
  new Schema(
    {
      ...enquiryFields,
      phone: String,
      vehicle: String,
      vehicleRef: { type: Schema.Types.ObjectId, ref: "Vehicle" },
      date: String,
      time: String,
      location: String,
    },
    options,
  ),
);
export const ContactSubmission = mongoose.model(
  "ContactSubmission",
  new Schema({ ...enquiryFields, department: String }, options),
);
export const AdminUser = mongoose.model(
  "AdminUser",
  new Schema(
    {
      email: { type: String, unique: true },
      passwordHash: String,
      role: { type: String, default: "admin" },
    },
    options,
  ),
);
export const GalleryItem = mongoose.model(
  "GalleryItem",
  new Schema(
    {
      id: { type: String, unique: true },
      url: String,
      alt: String,
      category: String,
      vehicle: String,
    },
    options,
  ),
);
const models = {
  vehicles: Vehicle,
  testDrives: TestDriveRequest,
  contacts: ContactSubmission,
  admins: AdminUser,
  gallery: GalleryItem,
};
export const mongoRepository = {
  list: (collection, filter = {}) => models[collection].find(filter).lean(),
  find: (collection, filter) => models[collection].findOne(filter).lean(),
  create: async (collection, data) =>
    (await models[collection].create(data)).toObject(),
  update: (collection, filter, data) =>
    models[collection]
      .findOneAndUpdate(
        filter,
        { $set: data },
        { returnDocument: "after", runValidators: true },
      )
      .lean(),
  remove: (collection, filter) =>
    models[collection].findOneAndDelete(filter).lean(),
};
