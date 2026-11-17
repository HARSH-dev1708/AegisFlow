import mongoose from 'mongoose';

const environmentSchema = new mongoose.Schema(
  {
    prNumber: { type: Number, required: true },
    repoFullName: { type: String, required: true },
    prTitle: { type: String, required: true },
    branch: { type: String, required: true },
    commitSha: { type: String, required: true },
    author: { type: String, default: 'developer' },
    containerId: { type: String, required: true },
    containerName: { type: String, required: true },
    port: { type: Number, required: true },
    previewUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['PROVISIONING', 'RUNNING', 'DESTROYED', 'FAILED'],
      default: 'RUNNING',
    },
  },
  { timestamps: true }
);

// Enforce port uniqueness ONLY among active containers so destroyed ports can be recycled
environmentSchema.index(
  { port: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['PROVISIONING', 'RUNNING'] } } }
);

environmentSchema.index({ repoFullName: 1, prNumber: 1 });

export default mongoose.model('Environment', environmentSchema);
