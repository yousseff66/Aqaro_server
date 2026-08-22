import 'dotenv/config';

import mongoose from 'mongoose';

import {
  Property,
  PropertySchema,
} from '../properties/schemas/property.schema';

async function backfillListingPurpose() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(mongoUri);

  try {
    const propertyModel = mongoose.model(
      Property.name,
      PropertySchema,
    );

    const result = await propertyModel.updateMany(
      {
        $or: [
          { listingPurpose: { $exists: false } },
          { listingPurpose: null },
        ],
      },
      { $set: { listingPurpose: 'Rent' } },
    );

    console.log(
      `Backfilled ${result.modifiedCount} properties with listingPurpose=Rent.`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

void backfillListingPurpose().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
