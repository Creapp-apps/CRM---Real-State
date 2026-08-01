import { NextResponse } from 'next/server';
import { getTokkoDevelopments } from '@/lib/tokko';

export async function GET() {
  const result = await getTokkoDevelopments();
  return NextResponse.json(result);
}
