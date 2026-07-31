import { NextResponse } from 'next/server';
import { sendTokkoLead } from '@/lib/tokko';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, message, propertyId } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Nombre y email son requeridos.' }, { status: 400 });
    }

    const result = await sendTokkoLead({
      name,
      email,
      phone,
      text: message,
      propertyId
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Consulta enviada con éxito.' });
    } else {
      return NextResponse.json({ error: 'Error al enviar la consulta a Tokko Broker.' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API Contact Error]:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
