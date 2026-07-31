import { NextResponse } from 'next/server';
import { getTokkoProperties, getTokkoPropertyById } from '@/lib/tokko';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const property = await getTokkoPropertyById(id);
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    return NextResponse.json({ property });
  }

  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const operationType = searchParams.get('operationType');
  const propertyType = searchParams.get('propertyType');

  const result = await getTokkoProperties({ limit, offset, operationType, propertyType });
  return NextResponse.json(result);
}
