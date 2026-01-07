import { NextRequest, NextResponse } from "next/server";
import { generateParticipantQR } from "@/lib/qr-utils";
import { connectDB } from "@/lib/db";
import { StudentModel } from "@/lib/models";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    // Verify student exists
    await connectDB();
    const student = await StudentModel.findOne({
      $or: [{ id: uid }, { chest_no: uid }, { badge_uid: uid }]
    }).lean<any>();

    if (!student) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // Get base URL from request
    const baseUrl = request.nextUrl.origin;
    const qrIdentifier = student.badge_uid || student.chest_no;
    const qrCodeDataUrl = await generateParticipantQR(qrIdentifier, baseUrl);

    // Return as JSON with data URL
    return NextResponse.json({ qrCode: qrCodeDataUrl, identifier: qrIdentifier });
  } catch (error) {
    console.error("QR generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}

