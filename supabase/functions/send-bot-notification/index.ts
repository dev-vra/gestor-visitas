import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const payload = await req.json()
    const { record } = payload

    if (!record) {
      return new Response(JSON.stringify({ error: 'No record found in payload' }), { status: 400 })
    }

    // Filtro de segurança: Só processa se a origem for 'Bot'
    if (record.source !== 'Bot') {
      return new Response(JSON.stringify({ message: `Ignored: source is ${record.source}` }), { status: 200 })
    }

    // Nota: O e-mail "from" deve ser de um domínio verificado no Resend.
    // Enquanto não houver domínio verificado, use "onboarding@resend.dev"
    const fromEmail = "Vistorias <onboarding@resend.dev>"
    const toEmail = "erlanmoraes@geogis.com.br"

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `🔔 Novo Agendamento (BOT): ${record.name}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
            <h2 style="color: #2563eb;">Nova Vistoria Registrada pelo Bot</h2>
            <p>Um novo agendamento foi capturado via bot de atendimento:</p>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p><strong>Cliente:</strong> ${record.name}</p>
            <p><strong>CPF:</strong> ${record.cpf}</p>
            <p><strong>Telefone:</strong> ${record.phone1}</p>
            <p><strong>Cidade:</strong> ${record.city}</p>
            <p><strong>Bairro:</strong> ${record.neighborhood}</p>
            <p><strong>Endereço:</strong> ${record.address_street}, ${record.address_number}</p>
            ${record.location_url ? `<p><strong>Localização:</strong> <a href="${record.location_url}">Ver no Google Maps</a></p>` : ''}
            <p><strong>Observações:</strong> ${record.observations || 'Nenhuma'}</p>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p style="font-size: 0.875rem; color: #666;">
              Origem: ${record.source} | Status: ${record.status}
            </p>
          </div>
        `,
      }),
    })

    const data = await res.json()

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: res.status,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
