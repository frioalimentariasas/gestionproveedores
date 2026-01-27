import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { Readable } from 'stream';

// --- Firebase Admin Initialization ---
try {
  // The service account key is stored in an environment variable
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountString) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not set in environment variables.'
    );
  }

  // Parse the string back into a JSON object
  const serviceAccount = JSON.parse(serviceAccountString);

  // Initialize the app if it's not already initialized
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'proveedores-fal.appspot.com',
    });
  }
} catch (error: any) {
  console.error('Firebase Admin Initialization Error:', error.message);
  // We don't want to throw here, as it would break the build process on the client.
  // The error will be caught and returned in the POST handler if the admin app is not available.
}

export async function POST(request: NextRequest) {
  // Check if the admin app was initialized correctly
  if (!admin.apps.length) {
    return NextResponse.json(
      { error: 'Backend not configured. Firebase Admin SDK failed to initialize.' },
      { status: 500 }
    );
  }

  // Explicitly get the bucket by its full name. This is more robust.
  const bucket = admin.storage().bucket('proveedores-fal.appspot.com');

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const fileName = formData.get('fileName') as string | null;

    if (!file || !userId || !fileName) {
      return NextResponse.json(
        { error: 'Missing file, userId, or fileName in the request.' },
        { status: 400 }
      );
    }

    const filePath = `providers/${userId}/${fileName}`;
    const fileRef = bucket.file(filePath);

    // Stream the file upload
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(fileBuffer);

    await new Promise((resolve, reject) => {
      const streamWriter = fileRef.createWriteStream({
        metadata: {
          contentType: file.type,
        },
      });

      streamWriter.on('error', reject);
      streamWriter.on('finish', resolve);
      stream.pipe(streamWriter);
    });

    // Make the file publicly readable
    await fileRef.makePublic();

    // Get the public URL
    const publicUrl = fileRef.publicUrl();

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    // The error object from Google Cloud can be complex. We extract the message.
    const errorMessage =
      error.errors?.[0]?.message ||
      error.message ||
      'An unknown error occurred.';
    return NextResponse.json(
      { error: `Failed to upload file: ${errorMessage}` },
      { status: 500 }
    );
  }
}
