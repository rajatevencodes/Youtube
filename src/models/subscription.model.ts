import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  subscriber: mongoose.Types.ObjectId;
  channel: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    subscriber: {
      // one who is subscribing
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Subscriber is required"],
    },
    channel: {
      // one to whom 'subscriber' is subscribing
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Channel is required"],
    },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

const SubscriptionModel = mongoose.model<ISubscription>(
  "Subscription",
  SubscriptionSchema
);

export default SubscriptionModel;
