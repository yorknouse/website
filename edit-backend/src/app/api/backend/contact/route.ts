import { NextRequest, NextResponse } from 'next/server';
import { contactSchema } from '@/lib/validation/contact';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const parsed = contactSchema.parse(payload);   // throws if invalid

    // TODO: add something

    console.log(parsed);

    return NextResponse.json({ message: 'success' }, { status: 200 });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      const fieldErrors: Record<string, string> = {};
      e.errors.forEach((err: any) => {
        const field = err.path[0];
        fieldErrors[field] = err.message;
      });

      return NextResponse.json(
        { fieldErrors, general: 'Please fix the highlighted fields.' },
        { status: 400 }
      );
    }

    console.error(e);
    return NextResponse.json(
      { general: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}