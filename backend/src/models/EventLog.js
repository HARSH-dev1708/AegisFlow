import mongoose from 'mongoose';

const eventLogSchema = new mongoose.Schema(
  {
    eventType: { type: String, required: true }, // e.g., 'PR_OPENED', 'PR_SYNCHRONIZE', 'PR_CLOSED', 'SECURITY_REJECTED'
    prNumber: { type: Number },
    repoFullName: { type: String },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR'],
      default: 'INFO',
    },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model('EventLog', eventLogSchema);
